package com.leonycosta.packapi.staff.staff;

import com.leonycosta.packapi.auth.CabeNoBcrypt;
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
    @Size(min = 8, max = 32, message = "Senha deve ter entre 8 e 32 caracteres")
    @CabeNoBcrypt
    private String senha;

    @NotNull(message = "Role é obrigatória")
    private UUID roleId;
}
