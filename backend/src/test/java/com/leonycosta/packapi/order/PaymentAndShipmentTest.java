package com.leonycosta.packapi.order;

import com.leonycosta.packapi.support.IntegrationTest;
import com.leonycosta.packapi.support.Resposta;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

// Pagamento e envio, e como eles mudam o status do pedido:
// AGUARDANDO_PAGAMENTO → PAGO (pagamento aprovado) → EM_SEPARACAO (envio criado)
//   → ENVIADO (despachado) → ENTREGUE (entregue)
class PaymentAndShipmentTest extends IntegrationTest {

    // ------------------------------------------------------------------ pagamento

    @Test
    void pagamentoRegistradoComecaPendente() {
        Pedido p = novoPedido(novaVariante(80, 10), 1);

        Resposta pagamento = pagar(p).esperar(201);

        assertThat(pagamento.str("$.status")).isEqualTo("PENDENTE");
        // o pedido só vira PAGO quando o pagamento for aprovado
        assertThat(statusDoPedido(p)).isEqualTo("AGUARDANDO_PAGAMENTO");
    }

    @Test
    void pagamentoAprovadoMarcaOPedidoComoPago() {
        Pedido p = novoPedido(novaVariante(80, 10), 1);
        String pagamento = pagar(p).esperar(201).str("$.id");

        patch("/payments/" + pagamento + "/status?status=APROVADO", admin()).esperar(200);

        assertThat(statusDoPedido(p)).isEqualTo("PAGO");
    }

    @Test
    void segundoPagamentoNoMesmoPedido() {
        Pedido p = novoPedido(novaVariante(80, 10), 1);
        pagar(p).esperar(201);

        post("/orders/" + p.id() + "/payment", corpo("metodo", "PIX", "valor", 1), p.cliente().token()).esperar(422);
    }

    @Test
    void pagamentoComValorDiferenteDoPedido() {
        Pedido p = novoPedido(novaVariante(80, 10), 1);

        post("/orders/" + p.id() + "/payment", corpo("metodo", "PIX", "valor", 1), p.cliente().token()).esperar(422);
    }

    @Test
    void pagamentoRecusadoCancelaOPedidoEDevolveOEstoque() {
        Variante v = novaVariante(80, 10);
        Pedido p = novoPedido(v, 2);
        String pagamento = pagar(p).esperar(201).str("$.id");
        assertThat(estoque(v)).isEqualTo(8);

        patch("/payments/" + pagamento + "/status?status=RECUSADO", admin()).esperar(200);

        assertThat(statusDoPedido(p)).isEqualTo("CANCELADO");
        assertThat(estoque(v)).isEqualTo(10);
    }

    @Test
    void naoAprovaPagamentoDePedidoCancelado() {
        Pedido p = novoPedido(novaVariante(80, 10), 1);
        String pagamento = pagar(p).esperar(201).str("$.id");
        patch("/payments/" + pagamento + "/status?status=RECUSADO", admin()).esperar(200);

        patch("/payments/" + pagamento + "/status?status=APROVADO", admin()).esperar(422);
    }

    @Test
    void cancelarOPedidoDevolveOEstoque() {
        Variante v = novaVariante(80, 10);
        Pedido p = novoPedido(v, 3);

        patch("/orders/" + p.id() + "/status?status=CANCELADO", admin()).esperar(200);

        assertThat(estoque(v)).isEqualTo(10);
    }

    // ------------------------------------------------------------------ envio

    @Test
    void naoEnviaPedidoQueNaoFoiPago() {
        Pedido p = novoPedido(novaVariante(80, 10), 1);

        post("/orders/" + p.id() + "/shipment", corpo("transportadora", "Correios"), admin()).esperar(422);
    }

    @Test
    void envioDePedidoPagoColocaEmSeparacao() {
        Pedido p = novoPedidoPago(novaVariante(80, 10));

        Resposta envio = post("/orders/" + p.id() + "/shipment", corpo("transportadora", "Correios"), admin())
                .esperar(201);

        assertThat(envio.str("$.status")).isEqualTo("PREPARANDO");
        assertThat(statusDoPedido(p)).isEqualTo("EM_SEPARACAO");
    }

    @Test
    void segundoEnvioNoMesmoPedido() {
        Pedido p = novoPedidoPago(novaVariante(80, 10));
        post("/orders/" + p.id() + "/shipment", corpo("transportadora", "Correios"), admin()).esperar(201);

        post("/orders/" + p.id() + "/shipment", corpo("transportadora", "Outra"), admin()).esperar(422);
    }

    @Test
    void codigoDeRastreioEClienteAcompanhando() {
        Pedido p = novoPedidoPago(novaVariante(80, 10));
        String envio = criarEnvio(p);
        String codigo = "BR" + unico().toUpperCase();

        patch("/shipments/" + envio + "/rastreio?codigo=" + codigo, admin()).esperar(200);

        Resposta visto = get("/orders/" + p.id() + "/shipment", p.cliente().token()).esperar(200);
        assertThat(visto.str("$.codigoRastreio")).isEqualTo(codigo);
    }

    @Test
    void pedidoChegaAteEntregue() {
        Pedido p = novoPedidoPago(novaVariante(80, 10));
        String envio = criarEnvio(p);

        patch("/shipments/" + envio + "/status?status=DESPACHADO", admin()).esperar(200);
        assertThat(statusDoPedido(p)).isEqualTo("ENVIADO");

        patch("/shipments/" + envio + "/status?status=ENTREGUE", admin()).esperar(200);
        assertThat(statusDoPedido(p)).isEqualTo("ENTREGUE");
    }

    @Test
    void pedidoEntregueNaoVoltaNemCancela() {
        Pedido p = novoPedidoPago(novaVariante(80, 10));
        String envio = criarEnvio(p);
        patch("/shipments/" + envio + "/status?status=DESPACHADO", admin()).esperar(200);
        patch("/shipments/" + envio + "/status?status=ENTREGUE", admin()).esperar(200);

        patch("/orders/" + p.id() + "/status?status=AGUARDANDO_PAGAMENTO", admin()).esperar(422);
        patch("/orders/" + p.id() + "/status?status=CANCELADO", admin()).esperar(422);
    }

    // ------------------------------------------------------------------ atalhos

    private Resposta pagar(Pedido p) {
        return post("/orders/" + p.id() + "/payment", corpo("metodo", "CARTAO_CREDITO", "valor", p.total()),
                p.cliente().token());
    }

    private String criarEnvio(Pedido p) {
        return post("/orders/" + p.id() + "/shipment", corpo("transportadora", "Correios"), admin())
                .esperar(201).str("$.id");
    }

    private String statusDoPedido(Pedido p) {
        return get("/orders/" + p.id(), admin()).esperar(200).str("$.status");
    }
}
