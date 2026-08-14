/**
 * Discord Voice 客户端(真实音频,基于 WS Opus 中继)。
 *
 * 传输链路:
 *   getUserMedia → MediaRecorder(audio/webm;codecs=opus, timeslice 50ms, 32kbps)
 *     → 每 50ms 一个 Blob → ws.send(blob) → 服务端透明转发(前缀 8 字节 userId)
 *     → 本端按 userId 分发到对应 RemotePlayback(MediaSource/SourceBuffer) 播放。
 *
 * 关键点:
 *   - 静音用 recorder.pause()/resume(),不重启(保证 init segment 只发一次);
 *   - 静音时不开 recorder(否则被服务端丢弃的 init 会造成他人无法解码);
 *   - 麦克风被拒 → 仅收听模式,不阻断进入语音频道;
 *   - 每 25s 发控制帧 ping 保活(服务端 idle timeout 300s)。
 */
import { parseRelayedFrame, buildJoinFrame, pickRecorderMime, pickMseMime, wsUrlFromLocation } from './voiceProtocol';
import { RemotePlayback } from './RemotePlayback';

type VoiceStatus = 'idle' | 'connected' | 'error';

class VoiceClient {
  private ws: WebSocket | null = null;
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private playbacks = new Map<string, RemotePlayback>();
  private localUserId = '';
  private muted = false;
  private deafened = false;
  /** 用户手势后为 true:新加入的远端播放器直接有声,无需再点 */
  private soundEnabled = false;
  private recorderMime: string | null = null;
  private mseMime: string | null = null;
  private status: VoiceStatus = 'idle';
  private speakingDetected = false;
  private vadRaf: number | null = null;
  private heartbeat: number | null = null;
  private lastPing = 0;
  private onStatusChange: ((s: VoiceStatus) => void) | null = null;

  // 音频配置 — 匹配 Discord 参数
  private readonly AUDIO_CONFIG: MediaTrackConstraints = {
    channelCount: 2,
    sampleRate: 48000,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };

  /** 获取麦克风。失败抛错,由调用方降级为仅收听 */
  async init(userId: string): Promise<void> {
    this.localUserId = userId;
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: this.AUDIO_CONFIG });
  }

  /**
   * 连接音频中继:开 WS → 发 join 帧(token 来自 REST /voice/join)→ joined 后开始传输。
   * 返回 Promise,joined 后 resolve;错误帧/超时 reject。
   */
  connectAudio(channelId: string, token: string, sessionId: string): Promise<void> {
    this.disconnectAudio(); // 重置旧连接
    this.recorderMime = pickRecorderMime();
    this.mseMime = pickMseMime();

    return new Promise<void>((resolve, reject) => {
      let ws: WebSocket;
      try {
        ws = new WebSocket(wsUrlFromLocation('/ws/voice'));
        ws.binaryType = 'arraybuffer'; // 二进制消息以 ArrayBuffer 到达
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
        return;
      }
      this.ws = ws;
      let settled = false;
      const timeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        this.status = 'error';
        reject(new Error('voice join timeout'));
        try { ws.close(); } catch { /* ignore */ }
      }, 8000);

      ws.onopen = () => ws.send(buildJoinFrame(token, channelId, sessionId));

      ws.onmessage = (ev) => {
        if (typeof ev.data === 'string') {
          let msg: any;
          try {
            msg = JSON.parse(ev.data);
          } catch {
            return;
          }
          if (msg.type === 'joined') {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            this.status = 'connected';
            this.startHeartbeat();
            this.startRecorder(); // joined 后才开始上行
            this.onStatusChange?.(this.status);
            resolve();
          } else if (msg.type === 'error') {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            this.status = 'error';
            this.onStatusChange?.(this.status);
            reject(new Error(msg.message || 'voice error'));
            try { ws.close(); } catch { /* ignore */ }
          }
        } else {
          this.handleRelayedFrame(ev.data as ArrayBuffer);
        }
      };

      ws.onclose = () => {
        window.clearTimeout(timeout);
        this.ws = null;
        if (!settled) {
          settled = true;
          this.status = 'error';
          this.onStatusChange?.(this.status);
          reject(new Error('voice connection closed'));
        }
      };
      ws.onerror = () => { /* 错误由 onclose / error 帧处理 */ };
    });
  }

  private handleRelayedFrame(data: ArrayBuffer): void {
    if (!this.mseMime) return; // 本端不支持解码 → 忽略
    const { senderId, payload } = parseRelayedFrame(data);
    if (senderId === this.localUserId) return; // 兜底:服务端已去回声
    let pb = this.playbacks.get(senderId);
    if (!pb) {
      pb = new RemotePlayback(this.mseMime);
      // 自动播放策略:手势前静音起播;手势后(或不禁听时)直接有声
      pb.setMuted(this.deafened || !this.soundEnabled);
      this.playbacks.set(senderId, pb);
      pb.play();
    }
    pb.enqueue(payload);
  }

  /** 静音:pause/resume 录音器。静音时若 recorder 未开,则在解除静音时再开(保证 init 段发出) */
  setMuted(muted: boolean): void {
    this.muted = muted;
    const rec = this.recorder;
    if (!rec) {
      if (!muted && this.status === 'connected' && this.stream) this.startRecorder();
      return;
    }
    try {
      if (muted && rec.state !== 'paused') rec.pause();
      else if (!muted && rec.state === 'paused') rec.resume();
    } catch {
      /* ignore */
    }
  }

  /** 禁听:静音所有远端播放器 */
  setDeafened(deafened: boolean): void {
    this.deafened = deafened;
    this.playbacks.forEach((pb) => pb.setMuted(deafened || !this.soundEnabled));
  }

  /** 用户手势:恢复所有远端播放音量(绕过自动播放策略),后续新播放器也默认有声 */
  unmuteAll(): void {
    this.soundEnabled = true;
    this.playbacks.forEach((pb) => pb.setMuted(this.deafened));
  }

  /** 移除已离开频道的远端播放器 */
  removeAbsentUsers(activeUserIds: Set<string>): void {
    this.playbacks.forEach((pb, userId) => {
      if (!activeUserIds.has(userId)) {
        pb.destroy();
        this.playbacks.delete(userId);
      }
    });
  }

  /** 本地说话检测(VAD),驱动说话光环 */
  startVoiceActivityDetection(onSpeaking: (speaking: boolean) => void): void {
    if (!this.stream) return;
    try {
      const ctx = this.audioContext ?? (this.audioContext = new AudioContext());
      const source = ctx.createMediaStreamSource(this.stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const detect = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const speaking = sum / dataArray.length > 20;
        if (speaking !== this.speakingDetected) {
          this.speakingDetected = speaking;
          onSpeaking(speaking);
        }
        this.vadRaf = requestAnimationFrame(detect);
      };
      detect();
    } catch {
      /* ignore */
    }
  }

  private startRecorder(): void {
    if (this.recorder || !this.stream || !this.recorderMime || this.muted) return;
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(this.stream, { mimeType: this.recorderMime, audioBitsPerSecond: 32_000 });
    } catch {
      try {
        rec = new MediaRecorder(this.stream);
      } catch {
        return;
      }
    }
    this.recorder = rec;
    rec.ondataavailable = (e) => {
      if (!e.data || e.data.size === 0) return;
      if (this.ws?.readyState === WebSocket.OPEN && !this.muted) {
        e.data.arrayBuffer().then((buf) => this.ws!.send(buf)).catch(() => {});
      }
    };
    rec.start(50); // timeslice 50ms
  }

  private stopRecorder(): void {
    const rec = this.recorder;
    this.recorder = null;
    if (rec && rec.state !== 'inactive') {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeat != null) return;
    this.lastPing = Date.now();
    this.heartbeat = window.setInterval(() => {
      // 25s 心跳(服务端 idle timeout 300s)
      if (this.ws?.readyState === WebSocket.OPEN && Date.now() - this.lastPing >= 25_000) {
        this.lastPing = Date.now();
        try { this.ws.send('{"type":"ping"}'); } catch { /* ignore */ }
      }
      // 播放维护:跳过积压 + 修剪
      this.playbacks.forEach((pb) => {
        pb.ensureLiveEdge();
        pb.prune();
      });
    }, 1000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeat != null) {
      window.clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
  }

  /** 断开音频中继:关 WS + 停录音 + 销毁所有播放器 */
  disconnectAudio(): void {
    this.stopHeartbeat();
    this.stopRecorder();
    this.playbacks.forEach((pb) => pb.destroy());
    this.playbacks.clear();
    if (this.ws) {
      try { this.ws.close(); } catch { /* ignore */ }
      this.ws = null;
    }
    this.status = 'idle';
  }

  /** 释放麦克风 + 音频上下文(VAD) */
  disconnect(): void {
    this.disconnectAudio();
    if (this.vadRaf != null) cancelAnimationFrame(this.vadRaf);
    this.vadRaf = null;
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.speakingDetected = false;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.status === 'connected';
  }

  get localStream(): MediaStream | null {
    return this.stream;
  }

  onStatus(listener: ((s: VoiceStatus) => void) | null): void {
    this.onStatusChange = listener;
  }
}

export const voiceClient = new VoiceClient();
export default VoiceClient;
