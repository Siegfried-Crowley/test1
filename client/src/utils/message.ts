import { Message, useStore } from '../store';

/**
 * 后端 REST/网关消息 JSON(snake_case) → store Message(camelCase)
 */
export const toMessage = (data: any): Message => ({
  id: data.id,
  channelId: data.channel_id,
  guildId: data.guild_id ?? undefined,
  authorId: data.author_id,
  content: data.content || '',
  timestamp: data.timestamp,
  editedTimestamp: data.edited_timestamp ?? undefined,
  type: data.type || 0,
  nonce: data.nonce ?? undefined,
  flags: data.flags || 0,
  attachments: data.attachments || [],
  embeds: data.embeds || [],
  reactions: data.reactions || {},
  mentions: data.mentions || { everyone: false, user_ids: [] },
  mentionEveryone: !!data.mention_everyone,
  pinned: !!data.pinned,
  messageReference: data.message_reference || null,
});

/** 用户显示名：当前用户→用户名；公会成员→昵称；否则 用户+id 尾4位 */
export const displayName = (userId: string): string => {
  const st = useStore.getState();
  if (userId === st.currentUser?.id) return st.currentUser.username;
  const member = st.activeGuildId ? st.members[st.activeGuildId]?.[userId] : null;
  return member?.nickname || `用户 ${userId.slice(-4)}`;
};
