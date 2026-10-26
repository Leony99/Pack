package com.leonycosta.packapi.auth.role;

import com.leonycosta.packapi.auth.permission.PermissionResponse;
import lombok.*;
import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RoleResponse {
    private UUID id;
    private String nome;
    private List<PermissionResponse> permissoes;
}
