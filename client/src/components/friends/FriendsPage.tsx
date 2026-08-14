import React, { useEffect, useState } from 'react';
import { useStore, Relationship } from '../../store';
import { friendApi, dmApi } from '../../utils/api';

const FriendsPage: React.FC = () => {
  const {
    relationships, setRelationships,
    setActiveChannel, setActiveGuild, setSidebar, setActiveDmId, setDmChannels, dmChannels,
  } = useStore();
  const [filter, setFilter] = useState<'all' | 'online' | 'pending' | 'blocked'>('all');
  const [addFriendId, setAddFriendId] = useState('');

  // 打开与某个好友的私信
  const handleOpenDm = async (userId: string) => {
    try {
      const dm = await dmApi.open(userId);
      setActiveDmId(dm.id);
      setActiveGuild(null);
      setActiveChannel(dm.id);
      setSidebar('dms');
      // 把新开的 DM 加进列表
      if (!dmChannels.some((c) => c.id === dm.id)) {
        setDmChannels([dm, ...dmChannels]);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || '无法发起私信');
    }
  };

  useEffect(() => {
    friendApi.list().then(setRelationships).catch(console.error);
  }, [setRelationships]);

  const handleAddFriend = async () => {
    if (!addFriendId.trim()) return;
    try {
      await friendApi.sendRequest(addFriendId.trim());
      setAddFriendId('');
      // 刷新列表
      const rels = await friendApi.list();
      setRelationships(rels);
    } catch (err: any) {
      alert(err.response?.data?.message || '添加失败');
    }
  };

  const filteredRels = relationships.filter((rel) => {
    switch (filter) {
      case 'online': return rel.type === 1; // friend
      case 'pending': return rel.type === 3 || rel.type === 4;
      case 'blocked': return rel.type === 2;
      default: return rel.type === 1;
    }
  });

  const friends = relationships.filter((r) => r.type === 1);
  const incoming = relationships.filter((r) => r.type === 3);
  const outgoing = relationships.filter((r) => r.type === 4);

  return (
    <div className="friends-page">
      <div className="friends-header">
        <div className="friends-tabs">
          <button
            className={`tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            所有好友 ({friends.length})
          </button>
          <button
            className={`tab ${filter === 'online' ? 'active' : ''}`}
            onClick={() => setFilter('online')}
          >
            在线
          </button>
          <button
            className={`tab ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            待处理 ({incoming.length + outgoing.length})
          </button>
          <button
            className={`tab ${filter === 'blocked' ? 'active' : ''}`}
            onClick={() => setFilter('blocked')}
          >
            已屏蔽
          </button>
        </div>

        <div className="add-friend">
          <input
            type="text"
            placeholder="输入用户ID添加好友"
            value={addFriendId}
            onChange={(e) => setAddFriendId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddFriend()}
          />
          <button onClick={handleAddFriend}>添加好友</button>
        </div>
      </div>

      <div className="friends-list">
        {filter === 'pending' && incoming.length > 0 && (
          <div className="friend-section">
            <h4>好友请求</h4>
            {incoming.map((rel) => (
              <div key={rel.id} className="friend-item">
                <div className="friend-avatar">{rel.username.charAt(0).toUpperCase()}</div>
                <div className="friend-info">
                  <span className="friend-name">{rel.username}</span>
                  <span className="friend-status">传入的好友请求</span>
                </div>
                <div className="friend-actions">
                  <button
                    className="btn-accept"
                    onClick={() => friendApi.acceptRequest(rel.id).then(() => {
                      const rels = friendApi.list();
                      rels.then(setRelationships);
                    })}
                  >
                    接受
                  </button>
                  <button
                    className="btn-reject"
                    onClick={() => friendApi.rejectRequest(rel.id).then(() => {
                      friendApi.list().then(setRelationships);
                    })}
                  >
                    拒绝
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredRels.length === 0 ? (
          <div className="no-friends">
            <p>暂无好友</p>
          </div>
        ) : (
          <div className="friend-section">
            <h4>
              {filter === 'all' ? '所有好友' :
               filter === 'online' ? '在线好友' :
               filter === 'blocked' ? '已屏蔽' : '好友请求'} — {filteredRels.length}
            </h4>
            {filteredRels.map((rel) => (
              <div key={rel.id} className="friend-item">
                <div className="friend-avatar">{rel.username.charAt(0).toUpperCase()}</div>
                <div className="friend-info">
                  <span className="friend-name">{rel.username}</span>
                  <span className="friend-discriminator">#{rel.discriminator}</span>
                </div>
                <div className="friend-actions">
                  {filter !== 'blocked' && (
                    <>
                      <button
                        className="btn-dm"
                        onClick={() => handleOpenDm(rel.id)}
                      >
                        私信
                      </button>
                      <button
                        className="btn-remove"
                        onClick={() => {
                          friendApi.remove(rel.id);
                          setRelationships(relationships.filter((r) => r.id !== rel.id));
                        }}
                      >
                        删除好友
                      </button>
                    </>
                  )}
                  {filter === 'blocked' && (
                    <button
                      className="btn-unblock"
                      onClick={() => {
                        friendApi.unblock(rel.id);
                        friendApi.list().then(setRelationships);
                      }}
                    >
                      取消屏蔽
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
