package com.leonycosta.packapi.staff.permission;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "permissions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String nome;
}