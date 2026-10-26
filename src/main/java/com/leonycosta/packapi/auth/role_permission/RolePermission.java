package com.leonycosta.packapi.auth.role_permission;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

import com.leonycosta.packapi.auth.permission.Permission;
import com.leonycosta.packapi.auth.role.Role;

@Entity
@Table(
    name = "role_permissions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"role_id", "permission_id"})
)
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RolePermission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @ManyToOne
    @JoinColumn(name = "permission_id", nullable = false)
    private Permission permission;
}