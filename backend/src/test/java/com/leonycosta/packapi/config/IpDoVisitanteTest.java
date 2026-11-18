package com.leonycosta.packapi.config;

import com.leonycosta.packapi.support.IntegrationTest;
import com.leonycosta.packapi.support.Resposta;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;

// O IP real do visitante: com a chave certa, o IP que o servidor do frontend informa é o que conta nos limites.
// Sem ela, o cabeçalho é ignorado. O teste usa o limite de 5 senhas erradas por e-mail + IP.
class IpDoVisitanteTest extends IntegrationTest {

    @Test
    void comAChaveCadaVisitanteTemOProprioLimite() {
        String email = novoCliente().email();
        for (int i = 0; i < 5; i++) {
            entrar(email, "203.0.113.10", CHAVE_DO_BFF).esperar(401);
        }
        entrar(email, "203.0.113.10", CHAVE_DO_BFF).esperar(429);

        // outro visitante, pelo mesmo servidor do frontend: o bloqueio do primeiro não o atinge
        entrar(email, "198.51.100.7", CHAVE_DO_BFF).esperar(401);
    }

    @Test
    void semAChaveOIpInformadoNaoVale() {
        String email = novoCliente().email();
        for (int i = 0; i < 5; i++) {
            entrar(email, "203.0.113.20", "chave-errada").esperar(401);
        }
        // trocar o IP informado não adianta: sem a chave, tudo conta pelo IP de quem conectou
        entrar(email, "198.51.100.20", "chave-errada").esperar(429);
        entrar(email, "198.51.100.21", null).esperar(429);
    }

    @Test
    void soAceitaEnderecosDeIp() {
        assertThat(IpDoVisitante.ipValido("203.0.113.10")).isTrue();
        assertThat(IpDoVisitante.ipValido("2001:db8::1")).isTrue();
        assertThat(IpDoVisitante.ipValido("exemplo.com")).isFalse();
        assertThat(IpDoVisitante.ipValido("999.1.1.1")).isFalse();
        assertThat(IpDoVisitante.ipValido("1.2.3.4, 5.6.7.8")).isFalse();
    }

    private Resposta entrar(String email, String ip, String chave) {
        var req = MockMvcRequestBuilders.post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"senha\":\"senha-errada-1\"}")
                .header(IpDoVisitante.CABECALHO_IP, ip);
        if (chave != null) req.header(IpDoVisitante.CABECALHO_CHAVE, chave);
        return executar(req);
    }
}
