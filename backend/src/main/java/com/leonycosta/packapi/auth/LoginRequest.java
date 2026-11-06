package com.leonycosta.packapi.auth;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    @Size(max = 254, message = "Email deve ter no máximo 254 caracteres")
    private String email;

    @NotBlank(message = "Senha é obrigatória")
    @Size(max = 128, message = "Senha deve ter no máximo 128 caracteres")
    private String senha;
}
