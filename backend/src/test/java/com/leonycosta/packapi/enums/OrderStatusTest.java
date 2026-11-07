package com.leonycosta.packapi.enums;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;

import static com.leonycosta.packapi.enums.OrderStatus.*;
import static org.assertj.core.api.Assertions.assertThat;

// Teste de unidade: só a regra do enum, sem Spring nem banco. Roda em milissegundos.
// @ParameterizedTest roda o mesmo teste uma vez para cada linha do @CsvSource (ou cada valor do @EnumSource).
class OrderStatusTest {

    @ParameterizedTest(name = "{0} → {1} é permitido")
    @CsvSource({
            "AGUARDANDO_PAGAMENTO, PAGO",
            "AGUARDANDO_PAGAMENTO, CANCELADO",
            "PAGO, EM_SEPARACAO",
            "PAGO, CANCELADO",
            "EM_SEPARACAO, ENVIADO",
            "EM_SEPARACAO, CANCELADO",
            "ENVIADO, ENTREGUE",
            "ENVIADO, DEVOLVIDO",               // a transportadora trouxe de volta
            "ENTREGUE, DEVOLVIDO"               // o cliente devolveu
    })
    void caminhoNormalDoPedido(OrderStatus atual, OrderStatus novo) {
        assertThat(atual.podeMudarPara(novo)).isTrue();
    }

    @ParameterizedTest(name = "{0} → {1} é proibido")
    @CsvSource({
            "AGUARDANDO_PAGAMENTO, ENTREGUE",   // pular etapas
            "AGUARDANDO_PAGAMENTO, ENVIADO",
            "PAGO, AGUARDANDO_PAGAMENTO",       // voltar
            "ENVIADO, EM_SEPARACAO",
            "ENVIADO, CANCELADO",               // já saiu do estoque: só volta como DEVOLVIDO, pelo envio
            "EM_SEPARACAO, DEVOLVIDO",          // ainda não saiu: é cancelamento
            "ENTREGUE, CANCELADO"
    })
    void naoPulaEtapasNemVolta(OrderStatus atual, OrderStatus novo) {
        assertThat(atual.podeMudarPara(novo)).isFalse();
    }

    @ParameterizedTest(name = "CANCELADO e DEVOLVIDO não mudam para {0}")
    @EnumSource(OrderStatus.class)
    void canceladoEDevolvidoSaoFinais(OrderStatus novo) {
        assertThat(CANCELADO.podeMudarPara(novo)).isFalse();
        assertThat(DEVOLVIDO.podeMudarPara(novo)).isFalse();
    }

    @ParameterizedTest(name = "{0} não muda para ele mesmo")
    @EnumSource(OrderStatus.class)
    void naoMudaParaOMesmoStatus(OrderStatus status) {
        assertThat(status.podeMudarPara(status)).isFalse();
    }
}
