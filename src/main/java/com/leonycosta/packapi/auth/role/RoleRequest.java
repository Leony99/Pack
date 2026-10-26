package com.leonycosta.packapi.auth.role;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RoleRequest {

    @NotBlank(message = "Nome é obrigatório")
    private String nome;
}
