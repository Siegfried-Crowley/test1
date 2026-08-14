import React, { useState } from 'react';
import { useStore } from '../../store';
import { channelApi } from '../../utils/api';

interface Props {
  guildId: string;
  defaultType?: number;
  defaultParentId?: string;
  onClose: () => void;
}

const CreateChannelModal: React.FC<Props> = ({ guildId, defaultType = 0, defaultParentId, onClose }) => {
  const { channels, addChannel, setActiveChannel } = useStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<number>(defaultType);
  const [parentId, setParentId] = useState<string>(defaultParentId || '');
  const [loading, setLoading] = useState(false);

  const categories = Object.values(channels).filter(
    (c) => c.guildId === guildId && c.type === 4
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || loading) return;
    setLoading(true);
    try {
      const ch = await channelApi.create({
        guild_id: guildId,
        name: name.trim(),
        type,
        parent_id: type === 4 ? undefined : parentId || undefined,
      });
      addChannel(ch);
      if (type !== 4) setActiveChannel(ch.id);
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.error || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>创建频道</h2>
          <p>为服务器添加一个新的频道</p>
        </div>

        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>频道类型</label>
            <select
              className="modal-select"
              value={type}
              onChange={(e) => setType(Number(e.target.value))}
            >
              <option value={0}>📝 文字频道</option>
              <option value={2}>🔊 语音频道</option>
              <option value={4}>📁 分类</option>
            </select>
          </div>

          {type !== 4 && (
            <div className="form-group">
              <label>所属分类</label>
              <select
                className="modal-select"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
              >
                <option value="">无</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>{type === 4 ? '分类名称' : '频道名称'}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 4 ? '例如: 学习资料' : '例如: 闲聊'}
              maxLength={100}
              required
              autoFocus
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>取消</button>
            <button type="submit" className="btn-create" disabled={loading || !name.trim()}>
              {loading ? '创建中...' : '创建频道'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannelModal;
