package com.leonycosta.packapi.auth;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
    private String nome;

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    @Size(max = 254, message = "Email deve ter no máximo 254 caracteres")
    private String email;

    @NotBlank(message = "Telefone é obrigatório")
    @Size(max = 20, message = "Telefone deve ter no máximo 20 caracteres")
    private String telefone;

    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 8, max = 32, message = "Senha deve ter entre 8 e 32 caracteres")
    @CabeNoBcrypt
    private String senha;
}
