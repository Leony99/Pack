package com.leonycosta.packapi.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// PATCH /auth/senha: a nova senha segue as mesmas regras do cadastro
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TrocaDeSenhaRequest {

    @NotBlank(message = "Senha atual é obrigatória")
    @Size(max = 128, message = "Senha deve ter no máximo 128 caracteres")
    private String senhaAtual;

    @NotBlank(message = "Nova senha é obrigatória")
    @Size(min = 8, max = 32, message = "Senha deve ter entre 8 e 32 caracteres")
    @CabeNoBcrypt
    private String novaSenha;
}
