import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import { guildApi } from '../../utils/api';
import { PERMS, computeGuildPerms, isOwnerOf } from '../../utils/permissions';

const ONLINE_STATUS: Record<string, string> = {
  online: 'online',
  idle: 'idle',
  dnd: 'dnd',
};

const MemberList: React.FC = () => {
  const { guilds, members, presences, roles, activeGuildId, currentUser, removeGuildMember } = useStore();
  const [menuUserId, setMenuUserId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const guild = activeGuildId ? guilds[activeGuildId] : null;
  const guildMembers = activeGuildId ? members[activeGuildId] : undefined;
  const roleMap = activeGuildId ? roles[activeGuildId] : undefined;

  // 点击外部关闭菜单
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuUserId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!guild || !guildMembers) return null;

  const memberList = Object.values(guildMembers).sort((a, b) => {
    const ao = a.userId === guild.ownerId;
    const bo = b.userId === guild.ownerId;
    if (ao !== bo) return ao ? -1 : 1;
    return a.joinedAt.localeCompare(b.joinedAt);
  });

  // 当前用户是否有管理权限
  const isOwner = isOwnerOf(guild, currentUser!.id);
  const perms = computeGuildPerms(guild.id, currentUser!.id, roles, members);
  const canKick = isOwner || (perms & PERMS.KICK_MEMBERS) === PERMS.KICK_MEMBERS;
  const canBan = isOwner || (perms & PERMS.BAN_MEMBERS) === PERMS.BAN_MEMBERS;
  const canManageNick = isOwner || (perms & PERMS.MANAGE_NICKNAMES) === PERMS.MANAGE_NICKNAMES;
  const canManageRoles = isOwner || (perms & PERMS.MANAGE_ROLES) === PERMS.MANAGE_ROLES;

  const groups = {
    online: [] as any[],
    offline: [] as any[],
  };
  memberList.forEach((m) => {
    const p = presences[m.userId]?.status;
    if (ONLINE_STATUS[p]) groups.online.push(m);
    else groups.offline.push(m);
  });

  const doKick = async (userId: string) => {
    try {
      await guildApi.kick(guild.id, userId);
      removeGuildMember(guild.id, userId);
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
    setMenuUserId(null);
  };

  const doBan = async (userId: string) => {
    const reason = window.prompt('封禁原因(可留空)') || '';
    try {
      await guildApi.ban(guild.id, userId, reason);
      removeGuildMember(guild.id, userId);
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
    setMenuUserId(null);
  };

  const doNickname = async (userId: string) => {
    const cur = guildMembers[userId]?.nickname || '';
    const nick = window.prompt('修改昵称(留空清除)', cur);
    if (nick === null) { setMenuUserId(null); return; }
    try {
      await guildApi.updateMemberNickname(guild.id, userId, nick);
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
    setMenuUserId(null);
  };

  const toggleRole = async (userId: string, roleId: string, checked: boolean) => {
    const member = guildMembers[userId];
    const next = checked
      ? [...member.roles, roleId]
      : member.roles.filter((r) => r !== roleId);
    try {
      await guildApi.assignRoles(guild.id, userId, next);
    } catch (err: any) {
      alert(err.response?.data?.error || '操作失败');
    }
  };

  const renderRow = (m: any) => {
    const status = presences[m.userId]?.status;
    const isMe = m.userId === currentUser!.id;
    return (
      <div
        key={m.userId}
        className={`member-item ${menuUserId === m.userId ? 'active' : ''}`}
        onClick={() => setMenuUserId(menuUserId === m.userId ? null : m.userId)}
      >
        <span className={`member-avatar`}>
          <span className="member-initial">
            {(m.nickname || m.userId).charAt(0).toUpperCase()}
          </span>
          <span className={`presence-dot ${ONLINE_STATUS[status] ? status : 'offline'}`} />
        </span>
        <span className="member-name">
          {m.userId === guild.ownerId ? <span className="member-crown">👑 </span> : null}
          {m.nickname || (m.userId === currentUser!.id ? currentUser!.username : m.userId)}
        </span>

        {menuUserId === m.userId && !isMe && (
          <div className="member-menu" ref={menuRef} onClick={(e) => e.stopPropagation()}>
            <div className="member-menu-header">成员操作</div>
            {canManageNick && (
              <button className="member-menu-item" onClick={() => doNickname(m.userId)}>✏️ 修改昵称</button>
            )}
            {canManageRoles && roleMap && (
              <div className="member-menu-roles">
                <div className="member-menu-label">分配角色</div>
                {Object.values(roleMap)
                  .filter((r: any) => r.id !== guild.id)
                  .map((r: any) => (
                    <label key={r.id} className="role-check">
                      <input
                        type="checkbox"
                        checked={m.roles.includes(r.id)}
                        onChange={(e) => toggleRole(m.userId, r.id, e.target.checked)}
                      />
                      <span>{r.name}</span>
                    </label>
                  ))}
              </div>
            )}
            {canKick && (
              <button className="member-menu-item danger" onClick={() => doKick(m.userId)}>👢 踢出</button>
            )}
            {canBan && (
              <button className="member-menu-item danger" onClick={() => doBan(m.userId)}>🔨 封禁</button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="member-list">
      <div className="member-list-header">成员 — {memberList.length}</div>
      <div className="member-list-scroll">
        {groups.online.length > 0 && (
          <div className="member-group">
            <div className="member-group-title">在线 — {groups.online.length}</div>
            {groups.online.map(renderRow)}
          </div>
        )}
        {groups.offline.length > 0 && (
          <div className="member-group">
            <div className="member-group-title">离线 — {groups.offline.length}</div>
            {groups.offline.map(renderRow)}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberList;
