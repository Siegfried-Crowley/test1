/**
 * 音频中继协议纯函数(无副作用,可单测)。
 *
 * 线协议:每帧 = 8 字节大端 senderUserId(服务端写入)+ WebM Opus 分块。
 * 控制帧是 JSON 文本,二进制帧是上述音频块。
 */

export interface RelayedFrame {
  /** 发送者 userId(字符串形式) */
  senderId: string;
  /** 去掉前缀后的原始音频字节(WebM Opus chunk) */
  payload: Uint8Array;
}

/** 解析中继帧:[8 字节大端 userId][payload] */
export function parseRelayedFrame(data: ArrayBuffer | ArrayBufferView): RelayedFrame {
  const bytes =
    data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const senderId = view.getBigUint64(0, false).toString(); // 大端
  const payload = bytes.slice(8);
  return { senderId, payload };
}

/** 构造 join 控制帧 */
export function buildJoinFrame(token: string, channelId: string, sessionId: string): string {
  return JSON.stringify({ type: 'join', token, channelId, sessionId });
}

/** 录音端可选 MIME:只支持 WebM(服务端中继单一编码);都不支持 → null = 本端仅收听 */
export function pickRecorderMime(): string | null {
  if (typeof MediaRecorder === 'undefined') return null;
  for (const m of ['audio/webm;codecs=opus', 'audio/webm']) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      /* 忽略 */
    }
  }
  return null;
}

/** 播放端可选 MIME:WebM 不支持则该端无法解码 → 收到的帧被忽略 */
export function pickMseMime(): string | null {
  if (typeof MediaSource === 'undefined') return null;
  for (const m of ['audio/webm;codecs=opus', 'audio/webm']) {
    try {
      if (MediaSource.isTypeSupported(m)) return m;
    } catch {
      /* 忽略 */
    }
  }
  return null;
}

/** 音频 WS 地址:优先 .env 的 VITE_VOICE_URL,否则按当前页派生(Vite 代理 /ws 到后端) */
export function wsUrlFromLocation(path: string, envUrl?: string): string {
  const configured = envUrl ?? (import.meta.env?.VITE_VOICE_URL as string | undefined);
  if (configured) return configured;
  // 非浏览器环境(如 vitest node)没有宿主地址,返回空串由调用方判定
  if (typeof location === 'undefined') return '';
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}${path}`;
}
