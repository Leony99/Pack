package com.leonycosta.packapi.config;

import com.leonycosta.packapi.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

// Regras do SecurityConfig: 401 quando não sabe quem é, 403 quando sabe mas não pode.
class SecurityRulesTest extends IntegrationTest {

    // ------------------------------------------------------------------ sem login

    @ParameterizedTest(name = "GET {0} é público")
    @ValueSource(strings = {"/products", "/sizes", "/colors", "/tags"})
    void catalogoEhPublico(String rota) {
        get(rota, null).esperar(200);
    }

    @ParameterizedTest(name = "{0} é público")
    @ValueSource(strings = {"/swagger-ui/index.html", "/v3/api-docs", "/actuator/health"})
    void documentacaoESaudeSaoPublicas(String rota) {
        // fora do /api/v1, então a chamada é montada direto no MockMvc
        executar(MockMvcRequestBuilders.get(rota)).esperar(200);
    }

    @ParameterizedTest(name = "GET {0} sem token → 401")
    @ValueSource(strings = {"/customers", "/coupons", "/staff", "/roles", "/variants/estoque-baixo", "/auth/me"})
    void rotasProtegidasPedemLogin(String rota) {
        get(rota, null).esperar(401);
    }

    @Test
    void semTokenNaoVeCarrinho() {
        get(novoCliente().carrinho(), null).esperar(401);
    }

    @Test
    void semTokenNaoCriaProduto() {
        post("/products", corpo("nome", "Hack", "preco", 1), null).esperar(401);
    }

    // ------------------------------------------------------------------ cliente

    @Test
    void clienteNaoMexeNoCatalogo() {
        post("/products", corpo("nome", "Hack " + unico(), "preco", 1), novoCliente().token()).esperar(403);
    }

    @Test
    void clienteNaoCriaCupom() {
        post("/coupons", corpo("codigo", "HACK" + unico(), "desconto", 99, "tipo", "PERCENTUAL",
                "validade", VALIDADE_FUTURA), novoCliente().token()).esperar(403);
    }

    @Test
    void clienteNaoListaOsOutrosClientes() {
        get("/customers", novoCliente().token()).esperar(403);
    }

    @Test
    void clienteNaoEntraEmRotaDeFuncionario() {
        get("/staff", novoCliente().token()).esperar(403);
    }

    // ------------------------------------------------------------------ um cliente mexendo nos dados do outro

    @Test
    void naoVeCarrinhoDeOutroCliente() {
        Cliente ana = novoCliente();
        Cliente bruno = novoCliente();

        get(ana.carrinho(), bruno.token()).esperar(403);
    }

    @Test
    void naoColocaItemNoCarrinhoDeOutroCliente() {
        Cliente ana = novoCliente();
        Cliente bruno = novoCliente();
        Variante v = novaVariante(50, 5);

        post(ana.carrinho() + "/items", corpo("variantId", v.id(), "quantidade", 1), bruno.token()).esperar(403);
    }

    @Test
    void naoFazCheckoutPorOutroCliente() {
        Cliente ana = novoCliente();
        String enderecoDaAna = novoEndereco(ana);
        Cliente bruno = novoCliente();

        post("/customers/" + ana.id() + "/orders", corpo("addressId", enderecoDaAna), bruno.token()).esperar(403);
    }

    @Test
    void naoVeNemPagaPedidoDeOutroCliente() {
        Pedido daAna = novoPedido(novaVariante(50, 5), 1);
        Cliente bruno = novoCliente();

        get("/orders/" + daAna.id(), bruno.token()).esperar(403);
        post("/orders/" + daAna.id() + "/payment", corpo("metodo", "PIX", "valor", daAna.total()), bruno.token())
                .esperar(403);
    }

    @Test
    void pagarPedidoInexistenteDa403E404Nao() {
        // 403 e não 404: assim ninguém descobre quais ids de pedido existem
        post("/orders/" + UUID_INEXISTENTE + "/payment", corpo("metodo", "PIX", "valor", 1), novoCliente().token())
                .esperar(403);
    }

    @Test
    void clienteNaoAprovaOProprioPagamento() {
        Pedido p = novoPedido(novaVariante(50, 5), 1);
        String pagamento = post("/orders/" + p.id() + "/payment", corpo("metodo", "PIX", "valor", p.total()),
                p.cliente().token()).esperar(201).str("$.id");

        patch("/payments/" + pagamento + "/status?status=APROVADO", p.cliente().token()).esperar(403);
    }

    // ------------------------------------------------------------------ admin

    @Test
    void adminConsultaPedidoDeQualquerCliente() {
        Pedido p = novoPedido(novaVariante(50, 5), 1);

        get("/orders/" + p.id(), admin()).esperar(200);
    }

    @Test
    void adminNaoFazCheckoutPeloCliente() {
        // fechar pedido é só do próprio cliente, nem o admin faz por ele
        Cliente ana = novoCliente();
        String endereco = novoEndereco(ana);

        post("/customers/" + ana.id() + "/orders", corpo("addressId", endereco), admin()).esperar(403);
    }
}
