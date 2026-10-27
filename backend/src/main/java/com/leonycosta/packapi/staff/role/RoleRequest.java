package com.leonycosta.packapi.staff.role;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RoleRequest {

    @NotBlank(message = "Nome é obrigatório")
    private String nome;
}
