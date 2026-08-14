import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store';
import { gatewayClient } from '../../gateway/GatewayClient';
import ProfileModal from './ProfileModal';

const STATUS_LABELS: Record<string, string> = {
  online: '在线',
  idle: '离开',
  dnd: '请勿打扰',
  offline: '离线',
};

const UserPanel: React.FC = () => {
  const { currentUser, isVoiceConnected, isMuted, isDeafened, setMuted, setDeafened,
    setToken, setCurrentUser, setPresence, status } = useStore();
  const [showStatus, setShowStatus] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setShowStatus(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    gatewayClient.destroy();
    setToken(null);
    setCurrentUser(null);
  };

  const setStatus = (status: string) => {
    gatewayClient.updatePresence(status);
    setPresence(status);
    setShowStatus(false);
  };

  if (!currentUser) return null;

  return (
    <div className="user-panel">
      <div className="user-avatar-wrap" onClick={() => setShowProfile(true)} title="我的资料">
        <div className="user-avatar">
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt="avatar" />
          ) : (
            currentUser.username.charAt(0).toUpperCase()
          )}
        </div>
        <span className={`presence-dot ${status}`} />
      </div>
      <div className="user-info">
        <span className="user-name">{currentUser.username}</span>
        <span className="user-tag">#{currentUser.discriminator}</span>
      </div>
      <div className="user-actions">
        <div className="status-switch" ref={statusRef}>
          <button
            className={`user-action-btn status-btn`}
            onClick={() => setShowStatus(!showStatus)}
            title="设置状态"
          >
            <span className={`presence-dot ${status} status-inline`} />
          </button>
          {showStatus && (
            <div className="status-menu">
              {Object.keys(STATUS_LABELS).map((s) => (
                <button
                  key={s}
                  className={`status-menu-item ${status === s ? 'active' : ''}`}
                  onClick={() => setStatus(s)}
                >
                  <span className={`presence-dot ${s}`} />
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </div>

        {isVoiceConnected && (
          <>
            <button
              className={`user-action-btn ${isMuted ? 'active' : ''}`}
              onClick={() => setMuted(!isMuted)}
              title={isMuted ? '取消静音' : '静音'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                {isMuted ? (
                  <path d="M19 11h-2c0 1.5-.52 2.87-1.38 3.96l1.41 1.41C18.18 15.08 19 13.12 19 11zM12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zM2.81 2.81L1.39 4.22l5.14 5.14C6.2 9.89 6 10.42 6 11c0 1.66 1.34 3 3 3 .59 0 1.13-.16 1.61-.41l2.32 2.32C12.25 16.64 11.64 17 11 17c-2.76 0-5-2.24-5-5H4c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c1.11-.16 2.14-.56 3.05-1.12l4.16 4.16 1.41-1.41L2.81 2.81z"/>
                ) : (
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H4c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                )}
              </svg>
            </button>
            <button
              className={`user-action-btn ${isDeafened ? 'active' : ''}`}
              onClick={() => setDeafened(!isDeafened)}
              title={isDeafened ? '取消禁听' : '禁听'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                {isDeafened ? (
                  <path d="M16.41 14.99l-1.41-1.41c.44-.44.71-1.05.71-1.58 0-1.66-1.34-3-3-3-.53 0-1.14.27-1.58.71L9.72 9.3C10.37 8.48 11.14 8 12 8c2.21 0 4 1.79 4 4 0 .86-.48 1.63-1.3 2.28l.71.71zm2.83-2.83c0 1.49-.45 2.87-1.22 4.02l1.42 1.42C20.78 16.07 21.5 14.12 21.5 12c0-5.25-4.25-9.5-9.5-9.5-2.12 0-4.07.72-5.61 1.92l1.42 1.42c1.15-.77 2.53-1.22 4.02-1.22 4.14 0 7.5 3.36 7.5 7.5z"/>
                ) : (
                  <path d="M12 1C7.58 1 4.01 4.58 4.01 9v5c0 1.66 1.34 3 3 3h2v-8h-2v-.01C7.01 5.92 9.79 3 12 3s4.99 2.92 4.99 5.99V9h-2v8h2c1.66 0 3-1.34 3-3V9c0-4.42-3.58-8-8-8z"/>
                )}
              </svg>
            </button>
          </>
        )}

        <button className="user-action-btn" onClick={handleLogout} title="登出">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
        </button>
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
};

export default UserPanel;
