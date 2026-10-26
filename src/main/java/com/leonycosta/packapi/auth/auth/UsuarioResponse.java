package com.leonycosta.packapi.auth.auth;

import lombok.*;
import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UsuarioResponse {
    private UUID id;
    private String nome;
    private String email;
    private TipoUsuario tipo;
    private List<String> permissoes;
}
