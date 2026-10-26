package com.leonycosta.packapi.staff.permission;

import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PermissionResponse {
    private UUID id;
    private String nome;
}
