package com.leonycosta.packapi.staff.role;

import jakarta.persistence.*;
import lombok.*;
import java.util.*;

import com.leonycosta.packapi.staff.role_permission.RolePermission;

@Entity
@Table(name = "roles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String nome;

    @OneToMany(mappedBy = "role", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RolePermission> permissoes = new ArrayList<>();
}