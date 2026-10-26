package com.leonycosta.packapi.auth.permission;

import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PermissionResponse {
    private UUID id;
    private String nome;
}
