package com.leonycosta.packapi.staff.role_permission;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RolePermissionRepository extends JpaRepository<RolePermission, UUID> {
    List<RolePermission> findByRoleId(UUID roleId);
    Optional<RolePermission> findByRoleIdAndPermissionId(UUID roleId, UUID permissionId);
    boolean existsByRoleIdAndPermissionId(UUID roleId, UUID permissionId);
}