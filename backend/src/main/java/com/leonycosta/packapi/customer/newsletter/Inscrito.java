package com.leonycosta.packapi.customer.newsletter;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

// Um e-mail na lista da newsletter. Sair da lista não apaga: a inscrição fica inativa (dá para voltar)
@Entity
@Table(name = "newsletter_inscritos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Inscrito {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // sempre em minúsculas
    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(nullable = false)
    private boolean ativo;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;
}
