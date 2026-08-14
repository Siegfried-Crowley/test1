package org.discord.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * 缓存服务 — 统一的 KV 缓存层
 *
 * 开发模式: 内存 ConcurrentHashMap (无需安装 Redis)
 * 生产模式: 可通过扩展切换为 Redis 实现
 *
 * 支持: KV 存储、过期时间、Pub/Sub 模拟
 */
@Service
public class CacheService {
    private static final Logger log = LoggerFactory.getLogger(CacheService.class);

    private final Map<String, String> store = new ConcurrentHashMap<>();
    private final Map<String, Long> expiresAt = new ConcurrentHashMap<>();
    private final List<CacheMessage> messages = Collections.synchronizedList(new ArrayList<>());
    private final ScheduledExecutorService cleaner = Executors.newSingleThreadScheduledExecutor();

    @PostConstruct
    public void init() {
        // 每分钟清理过期键
        cleaner.scheduleAtFixedRate(this::cleanExpired, 1, 1, TimeUnit.MINUTES);
        log.info("CacheService started (memory mode, no Redis required)");
    }

    // ===== KV 操作 =====
    public void set(String key, String value) {
        store.put(key, value);
        expiresAt.remove(key);
    }

    public void set(String key, String value, Duration ttl) {
        store.put(key, value);
        expiresAt.put(key, System.currentTimeMillis() + ttl.toMillis());
    }

    public String get(String key) {
        cleanExpired();
        return store.get(key);
    }

    public void delete(String key) {
        store.remove(key);
        expiresAt.remove(key);
    }

    public void expire(String key, Duration ttl) {
        String val = store.get(key);
        if (val != null) {
            expiresAt.put(key, System.currentTimeMillis() + ttl.toMillis());
        }
    }

    public boolean hasKey(String key) {
        cleanExpired();
        return store.containsKey(key);
    }

    // ===== Pub/Sub 模拟 =====
    public void publish(String channel, String message) {
        messages.add(new CacheMessage(channel, message, System.currentTimeMillis()));
        // 保留最近 1000 条
        while (messages.size() > 1000) messages.remove(0);
    }

    public List<String> getChannelMessages(String channel) {
        return messages.stream()
                .filter(m -> m.channel.equals(channel))
                .map(m -> m.message)
                .toList();
    }

    // ===== 批量操作 =====
    public Map<String, String> getAllWithPrefix(String prefix) {
        cleanExpired();
        Map<String, String> result = new HashMap<>();
        store.forEach((k, v) -> {
            if (k.startsWith(prefix)) result.put(k, v);
        });
        return result;
    }

    // ===== 统计 =====
    public int size() {
        cleanExpired();
        return store.size();
    }

    private void cleanExpired() {
        long now = System.currentTimeMillis();
        expiresAt.entrySet().removeIf(e -> e.getValue() < now);
        // 同步清理 store 中已过期的键
        Set<String> expiredKeys = new HashSet<>(expiresAt.keySet());
        store.keySet().removeIf(k -> !expiresAt.containsKey(k) && !store.containsKey(k));
    }

    private record CacheMessage(String channel, String message, long timestamp) {}
}
