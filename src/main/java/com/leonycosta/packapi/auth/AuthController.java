package com.leonycosta.packapi.auth;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public TokenResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.loginCustomer(request);
    }

    @PostMapping("/staff/login")
    public TokenResponse loginStaff(@Valid @RequestBody LoginRequest request) {
        return authService.loginStaff(request);
    }

    // Quem sou eu: lê direto do token, sem ir ao banco
    @GetMapping("/me")
    public UsuarioResponse me(@AuthenticationPrincipal Jwt jwt) {
        return new UsuarioResponse(UUID.fromString(jwt.getSubject()),
                jwt.getClaimAsString("nome"), jwt.getClaimAsString("email"),
                TipoUsuario.valueOf(jwt.getClaimAsString("tipo")), jwt.getClaimAsStringList("authorities"));
    }
}
