package org.discord.repository;

import org.discord.entity.GuildBan;
import org.discord.entity.GuildBanId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface GuildBanRepository extends JpaRepository<GuildBan, GuildBanId> {
    List<GuildBan> findByGuildId(Long guildId);
    Optional<GuildBan> findByGuildIdAndUserId(Long guildId, Long userId);
    void deleteByGuildIdAndUserId(Long guildId, Long userId);
    void deleteByGuildId(Long guildId);
}
