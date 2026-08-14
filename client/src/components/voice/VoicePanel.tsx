import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store';
import { voiceApi } from '../../utils/api';
import { voiceClient } from '../../voice/VoiceClient';
import { gatewayClient } from '../../gateway/GatewayClient';

/**
 * 语音控制面板(真实音频)
 * 加入顺序:Gateway OP4(广播 VOICE_STATE_UPDATE,他人可见)→ 本地麦克风 init(失败仅收听)
 *   → REST /voice/join 拿分配 token → /ws/voice connectAudio(MediaRecorder → WS 中继 → MediaSource)
 * 离开:OP4 leave(服务端 leaveVoice)+ disconnectAudio。
 */
const VoicePanel: React.FC = () => {
  const {
    activeGuildId, activeChannelId, channels, currentUser,
    isVoiceConnected, isMuted, isDeafened, speakingUsers, voiceStates,
    setVoiceConnected, setMuted, setDeafened, setSpeaking,
  } = useStore();

  // 用 ref 记录当前状态,避免 effect 依赖闭包旧值
  const mutedRef = useRef(false);
  const deafenedRef = useRef(false);
  mutedRef.current = isMuted;
  deafenedRef.current = isDeafened;

  // "点击启用声音"横幅:远端播放以 muted 起播(自动播放策略),手势后恢复
  const [needsUnmute, setNeedsUnmute] = useState(false);

  const channel = activeChannelId ? channels[activeChannelId] : null;

  // 加入/离开语音频道(真实音频全链路)
  useEffect(() => {
    if (!activeChannelId || !activeGuildId || !currentUser) return;
    if (!channel || channel.type !== 2) return;

    let cancelled = false;

    // 1) Gateway OP4 加入:服务端 joinVoice + 广播 VOICE_STATE_UPDATE
    gatewayClient.updateVoiceState(activeGuildId, activeChannelId, mutedRef.current, deafenedRef.current);
    setVoiceConnected(true);

    (async () => {
      // 2) 本地麦克风(拿不到则仅收听,不阻断)
      try {
        await voiceClient.init(currentUser.id);
      } catch (err) {
        console.warn('[Voice] 麦克风不可用,仅收听模式', err);
      }
      if (cancelled) return;

      // 3) 本地说话检测(VAD)(拿到流才生效,拿不到静默跳过)
      voiceClient.startVoiceActivityDetection((speaking) => {
        if (!cancelled) setSpeaking(currentUser.id, speaking);
      });

      // 4) REST join 拿分配 token → 连接音频中继
      const sessionId = gatewayClient.getSessionId() || `gw-${currentUser.id}`;
      try {
        const { token } = await voiceApi.join(activeGuildId, activeChannelId, sessionId);
        if (cancelled) return;
        await voiceClient.connectAudio(activeChannelId, token, sessionId);
        if (cancelled) return;
        voiceClient.setMuted(mutedRef.current);
        voiceClient.setDeafened(deafenedRef.current);
        // 禁听时不提示;否则远端播放以静音起播,提示用户点一下启用声音
        setNeedsUnmute(!deafenedRef.current);
      } catch (err) {
        console.warn('[Voice] 音频中继连接失败', err);
      }
    })();

    return () => {
      cancelled = true;
      setNeedsUnmute(false);
      // Gateway OP4 离开:服务端 leaveVoice + 广播移除
      if (activeGuildId) {
        gatewayClient.updateVoiceState(activeGuildId, null);
      }
      voiceClient.disconnectAudio();
      voiceClient.disconnect();
      setVoiceConnected(false);
      setSpeaking(currentUser.id, false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannelId, activeGuildId, currentUser, setVoiceConnected, setSpeaking]);

  // 频道内成员变化 → 剔除已离开用户的远端播放器
  useEffect(() => {
    if (!activeChannelId) return;
    const active = new Set(
      Object.values(voiceStates)
        .filter((vs) => vs.channelId === activeChannelId)
        .map((vs) => vs.userId),
    );
    voiceClient.removeAbsentUsers(active);
  }, [voiceStates, activeChannelId]);

  const toggleMute = () => {
    const newMute = !isMuted;
    voiceClient.setMuted(newMute);
    setMuted(newMute);
    if (activeGuildId) {
      voiceApi.mute(activeGuildId, newMute).catch(console.error);
    }
  };

  const toggleDeaf = () => {
    const newDeaf = !isDeafened;
    voiceClient.setDeafened(newDeaf);
    setDeafened(newDeaf);
    if (newDeaf) {
      voiceClient.setMuted(true);
      setMuted(true);
    }
    if (activeGuildId) {
      voiceApi.deaf(activeGuildId, newDeaf).catch(console.error);
    }
  };

  const handleEnableSound = () => {
    voiceClient.unmuteAll();
    setNeedsUnmute(false);
  };

  // 频道内用户列表(从 store 的 voiceStates 过滤)
  const channelUsers = Object.values(voiceStates)
    .filter((vs) => vs.channelId === activeChannelId);

  return (
    <div className="voice-panel">
      <div className="voice-panel-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#43b581">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
        <span>{channel?.name || '语音频道'}</span>
      </div>

      {needsUnmute && (
        <button className="voice-unmute-banner" onClick={handleEnableSound}>
          🔇 点击启用声音
        </button>
      )}

      <div className="voice-users">
        {channelUsers.length === 0 ? (
          <div className="voice-empty">频道中暂无其他人</div>
        ) : (
          channelUsers.map((vs) => (
            <div key={vs.userId} className="voice-user">
              <div className={`voice-user-avatar ${speakingUsers.has(vs.userId) ? 'speaking' : ''}`}>
                {vs.userId.charAt(0)}
              </div>
              <span className="voice-user-name">
                {vs.userId === currentUser?.id ? '我' : `用户${vs.userId.slice(-4)}`}
              </span>
              {vs.selfMute && <span className="voice-user-muted">🔇</span>}
            </div>
          ))
        )}
      </div>

      <div className="voice-controls">
        <button className={`voice-btn ${isMuted ? 'danger' : ''}`} onClick={toggleMute} title="麦克风">
          {isMuted ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 11h-2c0 1.5-.52 2.87-1.38 3.96l1.41 1.41C18.18 15.08 19 13.12 19 11z"/>
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v1.17l5.45 5.45c.35-.49.55-1.08.55-1.62zM2.81 2.81L1.39 4.22l5.14 5.14C6.2 9.89 6 10.42 6 11c0 1.66 1.34 3 3 3 .59 0 1.13-.16 1.61-.41l2.32 2.32C12.25 16.64 11.64 17 11 17c-2.76 0-5-2.24-5-5H4c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c1.11-.16 2.14-.56 3.05-1.12l4.16 4.16 1.41-1.41L2.81 2.81z"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          )}
        </button>

        <button className={`voice-btn ${isDeafened ? 'danger' : ''}`} onClick={toggleDeaf} title="耳机">
          {isDeafened ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.41 14.99l-1.41-1.41c.44-.44.71-1.05.71-1.58 0-1.66-1.34-3-3-3-.53 0-1.14.27-1.58.71L9.72 9.3C10.37 8.48 11.14 8 12 8c2.21 0 4 1.79 4 4 0 .86-.48 1.63-1.3 2.28l.71.71zm2.83-2.83c0 1.49-.45 2.87-1.22 4.02l1.42 1.42C20.78 16.07 21.5 14.12 21.5 12c0-5.25-4.25-9.5-9.5-9.5-2.12 0-4.07.72-5.61 1.92l1.42 1.42c1.15-.77 2.53-1.22 4.02-1.22 4.14 0 7.5 3.36 7.5 7.5z"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1C7.58 1 4.01 4.58 4.01 9v5c0 1.66 1.34 3 3 3h2v-8h-2v-.01C7.01 5.92 9.79 3 12 3s4.99 2.92 4.99 5.99V9h-2v8h2c1.66 0 3-1.34 3-3V9c0-4.42-3.58-8-8-8z"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default VoicePanel;
