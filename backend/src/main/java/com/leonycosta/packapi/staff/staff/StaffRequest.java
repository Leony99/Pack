package com.leonycosta.packapi.staff.staff;

import com.leonycosta.packapi.auth.CabeNoBcrypt;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class StaffRequest {

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
    private String nome;

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    @Size(max = 254, message = "Email deve ter no máximo 254 caracteres")
    private String email;

    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 8, max = 32, message = "Senha deve ter entre 8 e 32 caracteres")
    @CabeNoBcrypt
    private String senha;

    @NotNull(message = "Role é obrigatória")
    private UUID roleId;
}
