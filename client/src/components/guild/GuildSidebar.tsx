import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store';
import { guildApi } from '../../utils/api';
import GuildSettingsModal from './GuildSettingsModal';
import JoinGuildModal from './JoinGuildModal';

interface Props {
  onCreateGuild: () => void;
}

const GuildSidebar: React.FC<Props> = ({ onCreateGuild }) => {
  const { guilds, activeGuildId, sidebar, setActiveGuild, setActiveChannel, setSidebar, setActiveDmId,
    currentUser, removeGuild } = useStore();
  const [settingsGuildId, setSettingsGuildId] = useState<string | null>(null);
  const [showJoin, setShowJoin] = useState(false);
  const [menu, setMenu] = useState<{ guildId: string; x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleGuildClick = (guildId: string) => {
    setActiveGuild(guildId);
    setActiveChannel(null);
    setSidebar('guilds');
  };

  const handleFriendsClick = () => {
    setActiveGuild(null);
    setActiveChannel(null);
    setActiveDmId(null);
    setSidebar('friends');
  };

  const handleDmsClick = () => {
    setActiveGuild(null);
    setActiveChannel(null);
    setSidebar('dms');
  };

  const openMenu = (e: React.MouseEvent, guildId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ guildId, x: e.clientX, y: e.clientY });
  };

  const leaveGuild = async (guildId: string) => {
    const guild = guilds[guildId];
    if (!guild) return;
    const isOwner = guild.ownerId === currentUser?.id;
    if (isOwner) {
      alert('你是该服务器的所有者，不能离开。可以在服务器设置中删除服务器。');
      setMenu(null);
      return;
    }
    if (!window.confirm(`确定离开服务器「${guild.name}」?`)) { setMenu(null); return; }
    try {
      await guildApi.leave(guildId);
      removeGuild(guildId);
      setActiveGuild(null);
      setActiveChannel(null);
      setSidebar('friends');
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
    setMenu(null);
  };

  return (
    <div className="guild-sidebar">
      {/* 首页/好友按钮 */}
      <div
        className={`guild-item ${sidebar === 'friends' ? 'active' : ''}`}
        onClick={handleFriendsClick}
        title="好友"
      >
        <div className="guild-icon home-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1 15v-4H7l5-6 5 6h-4v4h-2z"/>
          </svg>
        </div>
      </div>

      {/* 私信按钮 */}
      <div
        className={`guild-item ${sidebar === 'dms' ? 'active' : ''}`}
        onClick={handleDmsClick}
        title="私信"
      >
        <div className="guild-icon dm-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </div>
      </div>

      {/* 分隔线 */}
      <div className="guild-separator" />

      {/* 服务器列表 */}
      <div className="guild-list">
        {Object.values(guilds).map((guild) => (
          <div
            key={guild.id}
            className={`guild-item ${activeGuildId === guild.id ? 'active' : ''}`}
            onClick={() => handleGuildClick(guild.id)}
            onContextMenu={(e) => openMenu(e, guild.id)}
            title={guild.name}
          >
            <div className="guild-icon">
              {guild.icon ? (
                <img src={guild.icon} alt={guild.name} />
              ) : (
                <span className="guild-acronym">
                  {guild.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="guild-tooltip">{guild.name}</div>
          </div>
        ))}
      </div>

      {/* 添加服务器 */}
      <div className="guild-item add-guild" onClick={onCreateGuild} title="添加服务器">
        <div className="guild-icon add-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </div>
      </div>

      {/* 通过邀请码加入 */}
      <div className="guild-item add-guild" onClick={() => setShowJoin(true)} title="通过邀请码加入">
        <div className="guild-icon add-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 17l1.5-4 4-1.5-4-1.5L11 6 9.5 10l-4 1.5 4 1.5L11 17zm8-1.5l.75 2 2 .75-2 .75-.75 2-.75-2-2-.75 2-.75.75-2zM19 3l.75 2 2 .75-2 .75L19 8.5 18.25 6.5l-2-.75 2-.75L19 3zM5 1l.9 2.4L8.3 4.3 5.9 5.2 5 7.6 4.1 5.2 1.7 4.3l2.4-.9L5 1z"/>
          </svg>
        </div>
      </div>

      {menu && (
        <div className="context-menu" ref={menuRef} style={{ top: menu.y, left: menu.x }}>
          <button className="context-menu-item" onClick={() => { setSettingsGuildId(menu.guildId); setMenu(null); }}>
            ⚙️ 服务器设置
          </button>
          <button className="context-menu-item danger" onClick={() => leaveGuild(menu.guildId)}>
            🚪 离开服务器
          </button>
        </div>
      )}

      {settingsGuildId && (
        <GuildSettingsModal guildId={settingsGuildId} onClose={() => setSettingsGuildId(null)} />
      )}

      {showJoin && <JoinGuildModal onClose={() => setShowJoin(false)} />}
    </div>
  );
};

export default GuildSidebar;
