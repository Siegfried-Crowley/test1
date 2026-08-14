package org.discord.repository;

import org.discord.entity.ChannelOverwrite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChannelOverwriteRepository extends JpaRepository<ChannelOverwrite, Long> {
    List<ChannelOverwrite> findByChannelId(Long channelId);
    void deleteByChannelId(Long channelId);
}
