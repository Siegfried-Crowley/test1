package org.discord.service;

import lombok.RequiredArgsConstructor;
import org.discord.entity.Channel;
import org.discord.entity.ChannelOverwrite;
import org.discord.entity.Guild;
import org.discord.entity.GuildMember;
import org.discord.repository.ChannelOverwriteRepository;
import org.discord.repository.ChannelRepository;
import org.discord.repository.DmChannelRepository;
import org.discord.repository.GuildMemberRepository;
import org.discord.util.SnowflakeGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChannelService {
    private final ChannelRepository channelRepository;
    private final ChannelOverwriteRepository overwriteRepository;
    private final DmChannelRepository dmChannelRepository;
    private final GuildMemberRepository memberRepository;
    private final GuildService guildService;
    private final PermissionService permissionService;
    private final SnowflakeGenerator snowflake;
    private final AuditLogService auditLogService;

    // Channel types (matching Discord)
    public static final short TYPE_GUILD_TEXT = 0;
    public static final short TYPE_DM = 1;
    public static final short TYPE_GUILD_VOICE = 2;
    public static final short TYPE_GROUP_DM = 3;
    public static final short TYPE_GUILD_CATEGORY = 4;
    public static final short TYPE_GUILD_ANNOUNCEMENT = 5;
    public static final short TYPE_GUILD_STAGE = 13;
    public static final short TYPE_GUILD_FORUM = 15;

    @Transactional
    public Channel createChannel(Long guildId, String name, short type, Long parentId, Long creatorId) {
        GuildMember member = guildService.getMember(guildId, creatorId);
        if (member == null) throw new RuntimeException("Not a member");

        long perms = permissionService.calculateGuildPermissions(
                guildService.getGuild(guildId), member);
        if (!permissionService.hasPermission(perms, permissionService.MANAGE_CHANNELS)) {
            throw new RuntimeException("Missing MANAGE_CHANNELS permission");
        }

        Channel channel = Channel.builder()
                .id(snowflake.nextId())
                .guildId(guildId)
                .name(name)
                .type(type)
                .position(0)
                .parentId(parentId)
                .nsfw(false)
                .bitrate(type == TYPE_GUILD_VOICE ? 64000 : null)
                .rateLimitPerUser(0)
                .createdAt(Instant.now())
                .build();
        channelRepository.save(channel);
        auditLogService.log(guildId, creatorId, AuditLogService.CHANNEL_CREATE, channel.getId(),
                "Created channel #" + channel.getName());
        return channel;
    }

    public List<Channel> getGuildChannels(Long guildId) {
        return channelRepository.findByGuildIdOrderByPositionAsc(guildId);
    }

    public Channel getChannel(Long channelId) {
        return channelRepository.findById(channelId)
                .orElseThrow(() -> new RuntimeException("Channel not found"));
    }

    @Transactional
    public Channel updateChannel(Long channelId, Long actorId, String name, String topic,
                                 Integer rateLimit, Integer position, Long parentId) {
        Channel channel = getChannel(channelId);
        if (channel.getGuildId() != null) {
            requireManageChannels(channel.getGuildId(), actorId);
        }
        if (name != null) channel.setName(name);
        if (topic != null) channel.setTopic(topic);
        if (rateLimit != null) channel.setRateLimitPerUser(rateLimit);
        if (position != null) channel.setPosition(position);
        if (parentId != null) {
            Channel parent = channelRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("Parent channel not found"));
            if (!parent.getGuildId().equals(channel.getGuildId())) {
                throw new RuntimeException("Parent not in guild");
            }
            channel.setParentId(parentId);
        }
        channelRepository.save(channel);
        auditLogService.log(channel.getGuildId(), actorId, AuditLogService.CHANNEL_UPDATE,
                channelId, "Updated channel #" + channel.getName());
        return channel;
    }

    @Transactional
    public void deleteChannel(Long channelId, Long actorId) {
        Channel channel = getChannel(channelId);
        if (channel.getGuildId() != null) {
            requireManageChannels(channel.getGuildId(), actorId);
        }
        Long guildId = channel.getGuildId();
        String name = channel.getName();
        overwriteRepository.deleteByChannelId(channelId);
        channelRepository.deleteById(channelId);
        if (guildId != null) {
            auditLogService.log(guildId, actorId, AuditLogService.CHANNEL_DELETE, channelId,
                    "Deleted channel #" + name);
        }
    }

    private void requireManageChannels(Long guildId, Long userId) {
        GuildMember member = guildService.getMember(guildId, userId);
        if (member == null) throw new RuntimeException("Not a member");
        long perms = permissionService.calculateGuildPermissions(
                guildService.getGuild(guildId), member);
        if (!permissionService.hasPermission(perms, permissionService.MANAGE_CHANNELS)) {
            throw new RuntimeException("Missing MANAGE_CHANNELS permission");
        }
    }

    // 权限覆盖管理
    @Transactional
    public ChannelOverwrite createOverwrite(Long channelId, short type, Long targetId,
                                             long allow, long deny) {
        ChannelOverwrite ow = ChannelOverwrite.builder()
                .channelId(channelId)
                .type(type)
                .targetId(targetId)
                .allow(allow)
                .deny(deny)
                .build();
        return overwriteRepository.save(ow);
    }

    @Transactional
    public ChannelOverwrite updateOverwrite(Long overwriteId, Long allow, Long deny) {
        ChannelOverwrite ow = overwriteRepository.findById(overwriteId)
                .orElseThrow(() -> new RuntimeException("Overwrite not found"));
        if (allow != null) ow.setAllow(allow);
        if (deny != null) ow.setDeny(deny);
        return overwriteRepository.save(ow);
    }

    @Transactional
    public void deleteOverwrite(Long overwriteId) {
        overwriteRepository.deleteById(overwriteId);
    }

    public List<ChannelOverwrite> getOverwrites(Long channelId) {
        return overwriteRepository.findByChannelId(channelId);
    }

    // 为用户返回有权限查看的频道
    public List<Channel> getAccessibleChannels(Long guildId, Long userId) {
        Guild guild = guildService.getGuild(guildId);
        GuildMember member = guildService.getMember(guildId, userId);
        if (member == null) return List.of();

        long guildPerms = permissionService.calculateGuildPermissions(guild, member);
        List<Channel> channels = getGuildChannels(guildId);
        List<ChannelOverwrite> allOverwrites = channels.stream()
                .flatMap(c -> overwriteRepository.findByChannelId(c.getId()).stream())
                .toList();

        return channels.stream()
                .filter(c -> {
                    long channelPerms = permissionService.calculateChannelPermissions(
                            guild, member, c,
                            overwriteRepository.findByChannelId(c.getId()),
                            guildPerms);
                    return permissionService.canViewChannel(channelPerms, c);
                })
                .toList();
    }
}
