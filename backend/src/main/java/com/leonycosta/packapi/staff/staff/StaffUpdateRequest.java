package com.leonycosta.packapi.staff.staff;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

// PUT /staff/{id}: nome, e-mail e papel (a senha é de cada um: PATCH /auth/senha)
public record StaffUpdateRequest(
        @NotBlank(message = "Nome é obrigatório")
        @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
        String nome,
        @NotBlank(message = "Email é obrigatório")
        @Email(message = "Email inválido")
        @Size(max = 254, message = "Email deve ter no máximo 254 caracteres")
        String email,
        @NotNull(message = "Role é obrigatória")
        UUID roleId) {
}
