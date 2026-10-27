package com.leonycosta.packapi.staff.staff;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class StaffRequest {

    @NotBlank(message = "Nome é obrigatório")
    private String nome;

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    private String email;

    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 8, message = "Senha deve ter no mínimo 8 caracteres")
    private String senha;

    @NotNull(message = "Role é obrigatória")
    private UUID roleId;
}
