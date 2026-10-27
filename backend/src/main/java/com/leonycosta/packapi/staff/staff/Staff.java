package com.leonycosta.packapi.staff.staff;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

import com.leonycosta.packapi.staff.role.Role;

@Entity
@Table(name = "staff")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;

    @ManyToOne
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;
}