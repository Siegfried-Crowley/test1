package org.discord.controller;

import lombok.RequiredArgsConstructor;
import org.discord.entity.Channel;
import org.discord.entity.ChannelOverwrite;
import org.discord.gateway.GatewayWebSocketHandler;
import org.discord.service.ChannelService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/channels")
@RequiredArgsConstructor
public class ChannelController {
    private final ChannelService channelService;
    private final GatewayWebSocketHandler gatewayHandler;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createChannel(@RequestBody Map<String, Object> body,
                                                              Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        Long guildId = Long.parseLong(body.get("guild_id").toString());
        String name = (String) body.get("name");
        short type = body.containsKey("type") ? ((Number) body.get("type")).shortValue() : 0;
        Long parentId = body.get("parent_id") != null ?
                Long.parseLong(body.get("parent_id").toString()) : null;

        Channel channel = channelService.createChannel(guildId, name, type, parentId, userId);
        Map<String, Object> json = channelToJson(channel);
        gatewayHandler.dispatchToGuild(guildId, "CHANNEL_CREATE", json, null);
        return ResponseEntity.ok(json);
    }

    @GetMapping("/{channelId}")
    public ResponseEntity<Map<String, Object>> getChannel(@PathVariable Long channelId) {
        Channel channel = channelService.getChannel(channelId);
        return ResponseEntity.ok(Map.of(
                "id", channel.getId().toString(),
                "guild_id", channel.getGuildId() != null ? channel.getGuildId().toString() : null,
                "name", channel.getName(),
                "type", (int) channel.getType(),
                "topic", channel.getTopic() != null ? channel.getTopic() : ""
        ));
    }

    @PatchMapping("/{channelId}")
    public ResponseEntity<Map<String, Object>> updateChannel(@PathVariable Long channelId,
                                                              @RequestBody Map<String, Object> body,
                                                              Authentication auth) {
        Long actorId = (Long) auth.getPrincipal();
        String name = (String) body.get("name");
        String topic = (String) body.get("topic");
        Integer rateLimit = body.get("rate_limit_per_user") != null ?
                ((Number) body.get("rate_limit_per_user")).intValue() : null;
        Integer position = body.get("position") != null ?
                ((Number) body.get("position")).intValue() : null;
        Long parentId = body.get("parent_id") != null ?
                Long.parseLong(body.get("parent_id").toString()) : null;
        Channel channel = channelService.updateChannel(channelId, actorId,
                name, topic, rateLimit, position, parentId);
        Map<String, Object> json = channelToJson(channel);
        if (channel.getGuildId() != null) {
            gatewayHandler.dispatchToGuild(channel.getGuildId(), "CHANNEL_UPDATE", json, null);
        }
        return ResponseEntity.ok(json);
    }

    @DeleteMapping("/{channelId}")
    public ResponseEntity<Void> deleteChannel(@PathVariable Long channelId, Authentication auth) {
        Long actorId = (Long) auth.getPrincipal();
        Channel channel = channelService.getChannel(channelId);
        Long guildId = channel.getGuildId();
        channelService.deleteChannel(channelId, actorId);
        if (guildId != null) {
            gatewayHandler.dispatchToGuild(guildId, "CHANNEL_DELETE",
                    Map.<String, Object>of("id", channelId.toString(), "guild_id", guildId.toString()), null);
        }
        return ResponseEntity.ok().build();
    }

    private Map<String, Object> channelToJson(Channel c) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", c.getId().toString());
        m.put("guild_id", c.getGuildId() != null ? c.getGuildId().toString() : null);
        m.put("name", c.getName());
        m.put("type", (int) c.getType());
        m.put("topic", c.getTopic() != null ? c.getTopic() : "");
        m.put("position", c.getPosition());
        m.put("parent_id", c.getParentId() != null ? c.getParentId().toString() : null);
        m.put("nsfw", c.isNsfw());
        m.put("bitrate", c.getBitrate());
        m.put("rate_limit_per_user", c.getRateLimitPerUser());
        return m;
    }

    // 权限覆盖管理
    @GetMapping("/{channelId}/permissions")
    public ResponseEntity<List<Map<String, Object>>> listOverwrites(@PathVariable Long channelId) {
        List<Map<String, Object>> result = channelService.getOverwrites(channelId).stream()
                .map(ow -> Map.<String, Object>of(
                        "id", ow.getId(),
                        "channel_id", ow.getChannelId().toString(),
                        "type", (int) ow.getType(),
                        "target_id", ow.getTargetId().toString(),
                        "allow", ow.getAllow() != null ? ow.getAllow().toString() : "0",
                        "deny", ow.getDeny() != null ? ow.getDeny().toString() : "0"
                ))
                .toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{channelId}/permissions")
    public ResponseEntity<Map<String, Object>> createOverwrite(
            @PathVariable Long channelId,
            @RequestBody Map<String, Object> body) {
        short type = body.get("type") != null ? ((Number) body.get("type")).shortValue() : 0;
        Long targetId = Long.parseLong(body.get("target_id").toString());
        long allow = body.get("allow") != null ? Long.parseLong(body.get("allow").toString()) : 0L;
        long deny = body.get("deny") != null ? Long.parseLong(body.get("deny").toString()) : 0L;
        ChannelOverwrite ow = channelService.createOverwrite(channelId, type, targetId, allow, deny);
        return ResponseEntity.ok(Map.of(
                "id", ow.getId(),
                "channel_id", ow.getChannelId().toString(),
                "type", (int) ow.getType(),
                "target_id", ow.getTargetId().toString(),
                "allow", ow.getAllow() != null ? ow.getAllow().toString() : "0",
                "deny", ow.getDeny() != null ? ow.getDeny().toString() : "0"
        ));
    }

    @PutMapping("/{channelId}/permissions/{overwriteId}")
    public ResponseEntity<Map<String, Object>> updateOverwrite(
            @PathVariable Long channelId,
            @PathVariable Long overwriteId,
            @RequestBody Map<String, Object> body) {
        Long allow = body.get("allow") != null ? Long.parseLong(body.get("allow").toString()) : null;
        Long deny = body.get("deny") != null ? Long.parseLong(body.get("deny").toString()) : null;
        ChannelOverwrite ow = channelService.updateOverwrite(overwriteId, allow, deny);
        return ResponseEntity.ok(Map.of(
                "id", ow.getId(),
                "channel_id", ow.getChannelId().toString(),
                "allow", ow.getAllow() != null ? ow.getAllow().toString() : "0",
                "deny", ow.getDeny() != null ? ow.getDeny().toString() : "0"
        ));
    }

    @DeleteMapping("/{channelId}/permissions/{overwriteId}")
    public ResponseEntity<Void> deleteOverwrite(@PathVariable Long overwriteId) {
        channelService.deleteOverwrite(overwriteId);
        return ResponseEntity.ok().build();
    }
}
