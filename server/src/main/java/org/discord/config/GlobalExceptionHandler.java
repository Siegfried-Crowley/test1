package org.discord.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * 全局异常处理 — 让业务异常返回正确 HTTP 状态码
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException e) {
        String msg = e.getMessage();
        log.warn("Business error: {}", msg);
        String lower = msg != null ? msg.toLowerCase() : null;
        HttpStatus status;

        if (lower != null && (
                lower.contains("invalid credentials") ||
                lower.contains("invalid 2fa code") ||
                lower.contains("invalid mfa token") ||
                lower.contains("invalid verification code") ||
                lower.contains("not found") ||
                lower.contains("no permission") ||
                lower.contains("cannot add yourself") ||
                lower.contains("not a member"))) {
            status = HttpStatus.UNAUTHORIZED;
        } else if (lower != null && (
                lower.contains("verify your email") ||
                lower.contains("2fa required") ||
                lower.contains("mfa enabled"))) {
            status = HttpStatus.FORBIDDEN;
        } else if (lower != null && (
                lower.contains("missing") ||
                lower.contains("already") ||
                lower.contains("expired") ||
                lower.contains("reached") ||
                lower.contains("banned from") ||
                lower.contains("cannot delete") ||
                lower.contains("cannot kick") ||
                lower.contains("cannot ban") ||
                lower.contains("owner cannot") ||
                lower.contains("not in guild") ||
                lower.contains("is fixed") ||
                lower.contains("parent not") ||
                lower.contains("no channels in guild"))) {
            status = HttpStatus.BAD_REQUEST;
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
        }

        return ResponseEntity.status(status)
                .body(Map.of("error", msg != null ? msg : "Unknown error"));
    }
}
