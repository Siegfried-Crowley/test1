package org.discord.repository;

import org.discord.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoleRepository extends JpaRepository<Role, Long> {
    List<Role> findByGuildIdOrderByPositionAsc(Long guildId);
    List<Role> findByIdIn(List<Long> ids);
    void deleteByGuildId(Long guildId);
}
