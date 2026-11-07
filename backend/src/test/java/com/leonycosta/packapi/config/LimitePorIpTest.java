package com.leonycosta.packapi.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

// Teste de unidade do limite geral por IP: o filtro sozinho, sem Spring nem banco, com um relógio
// que o teste avança na mão. (Nos testes de integração o limite fica altíssimo, porque todas as
// requisições do MockMvc vêm do mesmo IP.)
class LimitePorIpTest {

    static class RelogioDeTeste extends Clock {
        Instant agora = Instant.parse("2026-11-07T12:00:00Z");

        void avancar(Duration d) {
            agora = agora.plus(d);
        }

        @Override
        public Instant instant() {
            return agora;
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }
    }

    private final RelogioDeTeste relogio = new RelogioDeTeste();
    private final LimitePorIp limite = new LimitePorIp(3, Duration.ofSeconds(60), relogio);

    @Test
    void passaAteOLimiteEDepoisRecusaCom429() throws Exception {
        for (int i = 0; i < 3; i++) {
            assertThat(requisicao("8.8.8.8").getStatus()).isEqualTo(200);
        }
        relogio.avancar(Duration.ofSeconds(20));

        MockHttpServletResponse recusada = requisicao("8.8.8.8");

        assertThat(recusada.getStatus()).isEqualTo(429);
        // faltam 40 segundos para o minuto acabar
        assertThat(recusada.getHeader("Retry-After")).isEqualTo("40");
        assertThat(recusada.getContentAsString())
                .contains("\"status\":429", "\"error\":\"Too Many Requests\"", "\"path\":\"/api/v1/products\"");
    }

    @Test
    void requisicaoRecusadaNaoChegaNaAplicacao() throws Exception {
        for (int i = 0; i < 3; i++) {
            requisicao("8.8.8.8");
        }
        MockFilterChain cadeia = new MockFilterChain();

        limite.doFilter(pedido("8.8.8.8"), new MockHttpServletResponse(), cadeia);

        // a cadeia guarda a requisição só se o filtro a deixou seguir
        assertThat(cadeia.getRequest()).isNull();
    }

    @Test
    void depoisDoMinutoLiberaDeNovo() throws Exception {
        for (int i = 0; i < 4; i++) {
            requisicao("8.8.8.8");
        }
        relogio.avancar(Duration.ofSeconds(60));

        assertThat(requisicao("8.8.8.8").getStatus()).isEqualTo(200);
    }

    @Test
    void cadaIpTemOProprioLimite() throws Exception {
        for (int i = 0; i < 4; i++) {
            requisicao("8.8.8.8");
        }

        assertThat(requisicao("8.8.4.4").getStatus()).isEqualTo(200);
    }

    @Test
    void ipv6ContaPeloBloco64() throws Exception {
        // trocar só o final do endereço (a parte que cada casa escolhe à vontade) não dribla o limite
        requisicao("2001:db8:1:2::1");
        requisicao("2001:db8:1:2::2");
        requisicao("2001:db8:1:2:aaaa:bbbb:cccc:dddd");

        assertThat(requisicao("2001:db8:1:2::ffff").getStatus()).isEqualTo(429);
        assertThat(requisicao("2001:db8:1:3::1").getStatus()).isEqualTo(200);
    }

    private MockHttpServletResponse requisicao(String ip) throws Exception {
        MockHttpServletResponse res = new MockHttpServletResponse();
        limite.doFilter(pedido(ip), res, new MockFilterChain());
        return res;
    }

    private static MockHttpServletRequest pedido(String ip) {
        MockHttpServletRequest req = new MockHttpServletRequest("GET", "/api/v1/products");
        req.setRemoteAddr(ip);
        return req;
    }
}
