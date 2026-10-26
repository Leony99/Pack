package com.leonycosta.packapi.auth.role_permission;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RolePermissionRequest {

    @NotNull(message = "Role é obrigatória")
    private UUID roleId;

    @NotNull(message = "Permission é obrigatória")
    private UUID permissionId;
}
