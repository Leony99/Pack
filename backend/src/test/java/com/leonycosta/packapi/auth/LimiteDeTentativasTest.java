package com.leonycosta.packapi.auth;

import com.leonycosta.packapi.exception.MuitasTentativasException;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Teste de unidade do limitador: sem Spring nem banco, com um relógio que o teste avança na mão.
class LimiteDeTentativasTest {

    // relógio parado que só anda quando o teste manda
    static class RelogioDeTeste extends Clock {
        Instant agora = Instant.parse("2026-11-06T12:00:00Z");

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
    private final LimiteDeTentativas limite = new LimiteDeTentativas(5, 20, 5, Duration.ofMinutes(15), relogio);

    private void errar(String ip, String email, int vezes) {
        for (int i = 0; i < vezes; i++) {
            limite.verificarLogin(ip, email);
            limite.loginFalhou(ip, email);
        }
    }

    @Test
    void quintaSenhaErradaBloqueiaOParPor15Minutos() {
        errar("1.1.1.1", "ana@x.com", 5);

        assertThatThrownBy(() -> limite.verificarLogin("1.1.1.1", "ana@x.com"))
                .isInstanceOf(MuitasTentativasException.class)
                .extracting("segundosParaLiberar").isEqualTo(15L * 60);

        // 14 min depois ainda está bloqueado; com 15 min, libera
        relogio.avancar(Duration.ofMinutes(14));
        assertThatThrownBy(() -> limite.verificarLogin("1.1.1.1", "ana@x.com")).isInstanceOf(MuitasTentativasException.class);
        relogio.avancar(Duration.ofMinutes(1));
        assertThatCode(() -> limite.verificarLogin("1.1.1.1", "ana@x.com")).doesNotThrowAnyException();
    }

    @Test
    void bloqueioDoParNaoAtingeOutroEmailNemOutroIp() {
        errar("1.1.1.1", "ana@x.com", 5);

        assertThatCode(() -> limite.verificarLogin("1.1.1.1", "bia@x.com")).doesNotThrowAnyException();
        assertThatCode(() -> limite.verificarLogin("2.2.2.2", "ana@x.com")).doesNotThrowAnyException();
    }

    @Test
    void vinteFalhasDoMesmoIpBloqueiamQualquerEmail() {
        // 20 e-mails diferentes, uma senha errada em cada (o contador do par nunca chega a 5)
        for (int i = 0; i < 20; i++) {
            errar("3.3.3.3", "pessoa" + i + "@x.com", 1);
        }

        assertThatThrownBy(() -> limite.verificarLogin("3.3.3.3", "nova@x.com")).isInstanceOf(MuitasTentativasException.class);
        assertThatCode(() -> limite.verificarLogin("4.4.4.4", "nova@x.com")).doesNotThrowAnyException();
    }

    @Test
    void loginCertoZeraSoOParNaoOIp() {
        errar("5.5.5.5", "ana@x.com", 4);
        limite.loginCerto("5.5.5.5", "ana@x.com");

        // o par recomeçou: mais 4 erros ainda não bloqueiam
        errar("5.5.5.5", "ana@x.com", 4);
        assertThatCode(() -> limite.verificarLogin("5.5.5.5", "ana@x.com")).doesNotThrowAnyException();

        // mas o IP guardou as 8 falhas: mais 12 (de outros e-mails) chegam a 20
        for (int i = 0; i < 12; i++) {
            errar("5.5.5.5", "outro" + i + "@x.com", 1);
        }
        assertThatThrownBy(() -> limite.verificarLogin("5.5.5.5", "ana@x.com")).isInstanceOf(MuitasTentativasException.class);
    }

    @Test
    void errosEspalhadosNoTempoNaoAcumulam() {
        // 4 erros, 15 min de pausa, mais 4: a janela recomeçou, não chega a 5
        errar("6.6.6.6", "ana@x.com", 4);
        relogio.avancar(Duration.ofMinutes(15));
        errar("6.6.6.6", "ana@x.com", 4);

        assertThatCode(() -> limite.verificarLogin("6.6.6.6", "ana@x.com")).doesNotThrowAnyException();
    }

    @Test
    void cadastrosContamNoIp() {
        for (int i = 0; i < 20; i++) {
            limite.verificarECadastrar("7.7.7.7");
        }

        assertThatThrownBy(() -> limite.verificarECadastrar("7.7.7.7")).isInstanceOf(MuitasTentativasException.class);
        assertThatThrownBy(() -> limite.verificarLogin("7.7.7.7", "ana@x.com")).isInstanceOf(MuitasTentativasException.class);
    }

    @Test
    void emailComMaiusculasEOMesmoEmail() {
        errar("8.8.8.8", "Ana@X.com", 5);

        assertThatThrownBy(() -> limite.verificarLogin("8.8.8.8", "ana@x.com")).isInstanceOf(MuitasTentativasException.class);
    }

    @Test
    void quintoCupomErradoBloqueiaSoAqueleCliente() {
        UUID ana = UUID.randomUUID();
        UUID bia = UUID.randomUUID();
        for (int i = 0; i < 5; i++) {
            limite.verificarCupom(ana);
            limite.cupomErrado(ana);
        }

        assertThatThrownBy(() -> limite.verificarCupom(ana)).isInstanceOf(MuitasTentativasException.class);
        assertThatCode(() -> limite.verificarCupom(bia)).doesNotThrowAnyException();
        relogio.avancar(Duration.ofMinutes(15));
        assertThatCode(() -> limite.verificarCupom(ana)).doesNotThrowAnyException();
    }
}
