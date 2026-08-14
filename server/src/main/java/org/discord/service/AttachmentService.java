package org.discord.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 附件存储 — 保存上传文件到本地磁盘，返回可访问 URL
 */
@Service
@RequiredArgsConstructor
public class AttachmentService {

    @Value("${app.storage.local-path:./data/uploads}")
    private String storagePath;

    /** 保存上传文件，返回附件元数据（url 为相对路径，前端经 /uploads 代理访问） */
    public Map<String, Object> store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Empty file");
        }
        try {
            Path dir = Paths.get(storagePath).toAbsolutePath().normalize();
            Files.createDirectories(dir);

            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
            // 防目录穿越：只取文件名部分
            String safeBase = Paths.get(originalName).getFileName().toString();
            String storedName = UUID.randomUUID().toString().replace("-", "") + "_" + safeBase;
            Path target = dir.resolve(storedName);
            file.transferTo(target);

            Map<String, Object> res = new HashMap<>();
            res.put("url", "/uploads/" + storedName);
            res.put("filename", safeBase);
            res.put("content_type", file.getContentType());
            res.put("size", file.getSize());
            return res;
        } catch (IOException e) {
            throw new RuntimeException("Upload failed");
        }
    }
}
