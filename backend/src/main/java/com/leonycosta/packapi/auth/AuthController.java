package com.leonycosta.packapi.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Autenticação", description = "Cadastro e login de clientes e funcionários. O token devolvido vai no botão Authorize.")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Cadastra um cliente e já devolve o token")
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public TokenResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @Operation(summary = "Login de cliente")
    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.loginCustomer(request);
    }

    @Operation(summary = "Login de funcionário")
    @PostMapping("/staff/login")
    public TokenResponse loginStaff(@Valid @RequestBody LoginRequest request) {
        return authService.loginStaff(request);
    }

    // Quem sou eu: lê direto do token, sem ir ao banco
    @Operation(summary = "Dados do usuário dono do token")
    @GetMapping("/me")
    public UsuarioResponse me(@AuthenticationPrincipal Jwt jwt) {
        return new UsuarioResponse(UUID.fromString(jwt.getSubject()),
                jwt.getClaimAsString("nome"), jwt.getClaimAsString("email"),
                TipoUsuario.valueOf(jwt.getClaimAsString("tipo")), jwt.getClaimAsStringList("authorities"));
    }
}
