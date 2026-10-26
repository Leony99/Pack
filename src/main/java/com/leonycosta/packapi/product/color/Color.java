package com.leonycosta.packapi.product.color;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "colors")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Color {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String nome;

    @Column(nullable = false)
    private String hex;
}