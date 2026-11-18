package com.leonycosta.packapi.customer.contato;

import java.time.LocalDateTime;
import java.util.UUID;

public record MensagemResponse(UUID id, String nome, String email, String assunto, String mensagem,
                               StatusDaMensagem status, LocalDateTime criadoEm) {
}
