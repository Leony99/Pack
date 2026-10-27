package com.leonycosta.packapi.staff.staff;

import com.leonycosta.packapi.staff.role.RoleResponse;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class StaffResponse {
    private UUID id;
    private String nome;
    private String email;
    // senhaHash deliberadamente ausente — nunca exposta na API
    private RoleResponse role;
}
