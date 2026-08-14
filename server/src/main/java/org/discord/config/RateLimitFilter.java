package org.discord.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.discord.service.RateLimitService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;

/**
 * 限流过滤器(在 JwtAuthFilter 之后执行):
 * - POST /api/auth/login    → 按 IP,10 次/分
 * - POST .../messages       → 按用户,20 次/秒
 * 超限返回 429。
 */
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Duration LOGIN_WINDOW = Duration.ofMinutes(1);
    private static final Duration MESSAGE_WINDOW = Duration.ofSeconds(1);

    private final RateLimitService rateLimitService;
    private final ObjectMapper objectMapper;

    /** 登录按 IP 的窗口次数(测试环境可调大) */
    @Value("${app.rate-limit.login-per-minute:10}")
    private int loginLimit;

    /** 发消息按用户的窗口次数 */
    @Value("${app.rate-limit.message-per-second:20}")
    private int messageLimit;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String method = request.getMethod();
        String path = request.getRequestURI();

        if ("POST".equalsIgnoreCase(method) && path.equals("/api/auth/login")) {
            String ip = clientIp(request);
            if (!rateLimitService.tryAcquire("login:" + ip, loginLimit, LOGIN_WINDOW)) {
                reject(response, "Too many login attempts, slow down");
                return;
            }
        } else if ("POST".equalsIgnoreCase(method) && path.endsWith("/messages")) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof Long userId) {
                if (!rateLimitService.tryAcquire("msg:" + userId, messageLimit, MESSAGE_WINDOW)) {
                    reject(response, "Slow down, sending messages too fast");
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void reject(HttpServletResponse response, String message) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json;charset=UTF-8");
        objectMapper.writeValue(response.getWriter(), Map.of("error", message));
    }
}
