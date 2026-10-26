package com.leonycosta.packapi.staff.permission;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PermissionRequest {

    @NotBlank(message = "Nome é obrigatório")
    private String nome;
}
