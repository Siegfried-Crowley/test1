package org.discord.repository;

import org.discord.entity.DmChannel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DmChannelRepository extends JpaRepository<DmChannel, Long> {
}
