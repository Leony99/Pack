package com.leonycosta.packapi.customer.contato;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

// Uma mensagem do formulário de Contato da loja (dúvidas, trocas, devoluções). A equipe responde por e-mail
// e marca como respondida no painel
@Entity
@Table(name = "contato_mensagens")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class MensagemDeContato {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, length = 254)
    private String email;

    @Column(length = 120)
    private String assunto;

    @Column(nullable = false, length = 2000)
    private String mensagem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusDaMensagem status;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;
}
