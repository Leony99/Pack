package com.leonycosta.packapi.customer.contato;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MensagemRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
        String nome,
        @NotBlank(message = "Email é obrigatório")
        @Email(message = "Email inválido")
        @Size(max = 254, message = "Email deve ter no máximo 254 caracteres")
        String email,
        @Size(max = 120, message = "Assunto deve ter no máximo 120 caracteres")
        String assunto,
        @NotBlank(message = "Mensagem é obrigatória")
        @Size(max = 2000, message = "Mensagem deve ter no máximo 2000 caracteres")
        String mensagem) {
}
