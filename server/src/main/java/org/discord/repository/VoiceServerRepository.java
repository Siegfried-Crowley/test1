package org.discord.repository;

import org.discord.entity.VoiceServer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VoiceServerRepository extends JpaRepository<VoiceServer, String> {
    List<VoiceServer> findByRegionAndStatus(String region, String status);
}
