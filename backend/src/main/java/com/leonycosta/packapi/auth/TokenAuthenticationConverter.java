package com.leonycosta.packapi.auth;

import com.leonycosta.packapi.staff.staff.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.server.resource.InvalidBearerTokenException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

// Transforma o token já conferido (assinatura e validade) no usuário logado da requisição.
// - Cliente: as permissões vêm do próprio token (é sempre só "CUSTOMER").
// - Funcionário: as permissões vêm do BANCO, numa consulta a cada requisição. Assim, quem foi excluído
//   perde o acesso na hora (401), e trocar o papel ou tirar uma permissão do papel vale na próxima requisição,
//   sem esperar o token vencer.
@Component
@RequiredArgsConstructor
public class TokenAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final StaffRepository staffRepository;

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        List<String> authorities = TipoUsuario.STAFF.name().equals(jwt.getClaimAsString("tipo"))
                ? permissoesAtuais(jwt.getSubject())
                : Objects.requireNonNullElse(jwt.getClaimAsStringList("authorities"), List.of());
        return new JwtAuthenticationToken(jwt, AuthorityUtils.createAuthorityList(authorities), jwt.getSubject());
    }

    private List<String> permissoesAtuais(String staffId) {
        List<String> nomes = staffRepository.findPermissoesAtuais(UUID.fromString(staffId));
        if (nomes.isEmpty()) {
            throw new InvalidBearerTokenException("O funcionário deste token não existe mais");
        }
        // um papel sem permissões vem como uma linha com null
        return nomes.stream().filter(Objects::nonNull).toList();
    }
}
