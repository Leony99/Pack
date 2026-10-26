package com.leonycosta.packapi.auth.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TokenService {

    private final JwtEncoder jwtEncoder;

    @Value("${jwt.expiration-minutes}")
    private long expirationMinutes;

    public TokenResponse gerar(UUID id, String nome, String email, TipoUsuario tipo, List<String> authorities) {
        Instant agora = Instant.now();
        Instant expira = agora.plus(expirationMinutes, ChronoUnit.MINUTES);

        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("pack-api")
                .subject(id.toString())          // quem é: id do cliente ou do funcionário
                .issuedAt(agora)
                .expiresAt(expira)
                .claim("nome", nome)
                .claim("email", email)
                .claim("tipo", tipo.name())
                .claim("authorities", authorities) // o que pode fazer
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();

        return new TokenResponse(token, "Bearer", expira, new UsuarioResponse(id, nome, email, tipo, authorities));
    }
}
