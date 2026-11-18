package com.leonycosta.packapi.customer;

import com.leonycosta.packapi.support.IntegrationTest;
import com.leonycosta.packapi.support.Resposta;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// A área do cliente na loja: endereços com bairro, apelido e principal; o pedido com a foto e o tamanho de cada
// item; o cliente cancelando o próprio pedido; e a newsletter.
class ContaDoClienteTest extends IntegrationTest {

    // ------------------------------------------------------------------ endereços

    @Test
    void primeiroEnderecoEhOPrincipalEOProximoMarcadoToma() {
        Cliente ana = novoCliente();
        String casa = endereco(ana, "Casa", false).esperar(201).str("$.id");
        assertThat(get(enderecos(ana) + "/" + casa, ana.token()).<Boolean>ler("$.principal")).isTrue();

        String trabalho = endereco(ana, "Trabalho", true).esperar(201).str("$.id");

        assertThat(principais(ana)).containsExactly(trabalho);
        Resposta r = get(enderecos(ana) + "/" + trabalho, ana.token());
        assertThat(r.str("$.apelido")).isEqualTo("Trabalho");
        assertThat(r.str("$.bairro")).isEqualTo("Centro");
    }

    @Test
    void apagarOPrincipalPassaParaOutro() {
        Cliente ana = novoCliente();
        String casa = endereco(ana, "Casa", false).esperar(201).str("$.id");
        String trabalho = endereco(ana, "Trabalho", false).esperar(201).str("$.id");

        delete(enderecos(ana) + "/" + casa, ana.token()).esperar(204);

        assertThat(principais(ana)).containsExactly(trabalho);
    }

    @Test
    void desmarcarOPrincipalNaoDeixaOClienteSemNenhum() {
        Cliente ana = novoCliente();
        String casa = endereco(ana, "Casa", false).esperar(201).str("$.id");

        put(enderecos(ana) + "/" + casa, corpoDoEndereco("Casa", false), ana.token()).esperar(200);

        assertThat(principais(ana)).containsExactly(casa);
    }

    @Test
    void enderecoSemBairroERecusado() {
        Cliente ana = novoCliente();
        post(enderecos(ana), corpo("cep", "20040-020", "rua", "Rua", "numero", "1", "cidade", "Rio de Janeiro",
                "estado", "RJ"), ana.token()).esperar(400);
    }

    // ------------------------------------------------------------------ pedido

    @Test
    void pedidoGuardaBairroComplementoEMostraAPecaDeCadaItem() {
        Variante v = novaVariante(50, 5);
        Pedido p = novoPedido(v, 1);

        Resposta pedido = get("/orders/" + p.id(), p.cliente().token()).esperar(200);

        assertThat(pedido.str("$.enderecoBairro")).isEqualTo("Centro");
        assertThat(pedido.str("$.itens[0].produtoId")).isEqualTo(v.produtoId());
        assertThat(pedido.str("$.itens[0].tamanho")).isNotBlank();
        assertThat(pedido.str("$.itens[0].cor")).isNotBlank();
    }

    // ------------------------------------------------------------------ cancelar o próprio pedido

    @Test
    void clienteCancelaOPedidoAguardandoPagamentoEOEstoqueVolta() {
        Variante v = novaVariante(50, 5);
        Pedido p = novoPedido(v, 2);
        assertThat(estoque(v)).isEqualTo(3);

        post("/orders/" + p.id() + "/cancelar", null, p.cliente().token()).esperar(200);

        assertThat(get("/orders/" + p.id(), p.cliente().token()).str("$.status")).isEqualTo("CANCELADO");
        assertThat(estoque(v)).isEqualTo(5);
    }

    @Test
    void clienteCancelaOPedidoPagoEOPagamentoFicaEstornado() {
        Pedido p = novoPedidoPago(novaVariante(50, 5));

        Resposta r = post("/orders/" + p.id() + "/cancelar", null, p.cliente().token()).esperar(200);

        assertThat(r.str("$.payment.status")).isEqualTo("ESTORNADO");
    }

    @Test
    void emSeparacaoOClienteNaoCancelaMais() {
        Pedido p = novoPedidoPago(novaVariante(50, 5));
        post("/orders/" + p.id() + "/shipment", corpo("transportadora", "Correios"), admin()).esperar(201);

        post("/orders/" + p.id() + "/cancelar", null, p.cliente().token()).esperar(422);
    }

    @Test
    void soODonoCancelaPorEstaRota() {
        Pedido p = novoPedido(novaVariante(50, 5), 1);

        post("/orders/" + p.id() + "/cancelar", null, novoCliente().token()).esperar(403);
        post("/orders/" + p.id() + "/cancelar", null, admin()).esperar(403);
        post("/orders/" + p.id() + "/cancelar", null, null).esperar(401);
    }

    // ------------------------------------------------------------------ newsletter

    @Test
    void qualquerUmSeInscreveEARespostaEhAMesmaParaQuemJaEstava() {
        String email = "news-" + unico() + "@teste.com";

        post("/newsletter", corpo("email", email), null).esperar(204);
        post("/newsletter", corpo("email", email.toUpperCase()), null).esperar(204);

        List<String> lista = get("/newsletter?tamanho=100", admin()).esperar(200).lista("$.itens[*].email");
        assertThat(lista).containsOnlyOnce(email);
    }

    @Test
    void inscricaoComEmailInvalido() {
        post("/newsletter", corpo("email", "nao-e-email"), null).esperar(400);
    }

    @Test
    void listaENaoServeParaQuemNaoGerenciaAEquipe() {
        get("/newsletter", null).esperar(401);
        get("/newsletter", novoCliente().token()).esperar(403);
        get("/newsletter", novoFuncionario("ATENDENTE")).esperar(403);
    }

    @Test
    void equipeTiraEPoeDeVoltaNaLista() {
        String email = "news-" + unico() + "@teste.com";
        post("/newsletter", corpo("email", email), null).esperar(204);
        String id = get("/newsletter?tamanho=100", admin()).<List<String>>ler("$.itens[?(@.email == '" + email + "')].id")
                .getFirst();

        assertThat(patch("/newsletter/" + id + "?ativo=false", admin()).esperar(200).<Boolean>ler("$.ativo")).isFalse();
        assertThat(patch("/newsletter/" + id + "?ativo=true", admin()).esperar(200).<Boolean>ler("$.ativo")).isTrue();
    }

    @Test
    void clienteEntraESaiPelaAreaDele() {
        Cliente ana = novoCliente();
        String rota = "/customers/" + ana.id() + "/newsletter";
        assertThat(get(rota, ana.token()).esperar(200).<Boolean>ler("$.inscrito")).isFalse();

        put(rota, corpo("inscrito", true), ana.token()).esperar(200);
        assertThat(get(rota, ana.token()).<Boolean>ler("$.inscrito")).isTrue();

        put(rota, corpo("inscrito", false), ana.token()).esperar(200);
        assertThat(get(rota, ana.token()).<Boolean>ler("$.inscrito")).isFalse();
    }

    @Test
    void clienteNaoMexeNaNewsletterDeOutro() {
        Cliente ana = novoCliente();
        put("/customers/" + ana.id() + "/newsletter", corpo("inscrito", true), novoCliente().token()).esperar(403);
    }

    // ------------------------------------------------------------------ apoio

    private static String enderecos(Cliente c) {
        return "/customers/" + c.id() + "/addresses";
    }

    private Resposta endereco(Cliente c, String apelido, boolean principal) {
        return post(enderecos(c), corpoDoEndereco(apelido, principal), c.token());
    }

    private static java.util.Map<String, Object> corpoDoEndereco(String apelido, boolean principal) {
        return corpo("cep", "20040-020", "rua", "Rua " + apelido, "numero", "1", "complemento", "Apto 2",
                "bairro", "Centro", "cidade", "Rio de Janeiro", "estado", "RJ", "apelido", apelido,
                "principal", principal);
    }

    private List<String> principais(Cliente c) {
        return get(enderecos(c), c.token()).esperar(200).lista("$[?(@.principal == true)].id");
    }
}
