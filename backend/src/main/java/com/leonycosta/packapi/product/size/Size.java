package com.leonycosta.packapi.product.size;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "sizes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Size {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String label;
}