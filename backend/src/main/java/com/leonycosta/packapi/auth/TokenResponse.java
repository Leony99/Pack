package com.leonycosta.packapi.auth;

import lombok.*;
import java.time.Instant;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TokenResponse {
    private String token;
    private String tipo;       // sempre "Bearer": vai no cabeçalho Authorization: Bearer <token>
    private Instant expiraEm;
    private UsuarioResponse usuario;
}
