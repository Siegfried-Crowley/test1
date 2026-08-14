package org.discord.service;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 进程内限流 — 固定窗口计数(单实例适用;多实例需换 Redis 等共享实现)
 */
@Service
public class RateLimitService {

    private final Map<String, Window> buckets = new ConcurrentHashMap<>();

    /**
     * 尝试获取一次配额。
     *
     * @param key      限流标识(如 "login:"+ip / "msg:"+userId)
     * @param limit    窗口内允许的最大次数
     * @param window   窗口时长
     * @return true=放行; false=超限
     */
    public boolean tryAcquire(String key, int limit, Duration window) {
        long now = System.currentTimeMillis();
        long windowMillis = window.toMillis();

        Window w = buckets.compute(key, (k, cur) -> {
            if (cur == null || now - cur.windowStart >= windowMillis) {
                return new Window(now, 1);
            }
            cur.count++;
            return cur;
        });
        return w.count <= limit;
    }

    private static final class Window {
        final long windowStart;
        int count;

        Window(long windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
