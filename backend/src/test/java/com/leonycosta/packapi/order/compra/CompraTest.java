package com.leonycosta.packapi.order.compra;

import com.leonycosta.packapi.support.IntegrationTest;
import com.leonycosta.packapi.support.Resposta;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

// A compra pela loja: o frete da tabela (na página do produto e no pedido), a quantidade no carrinho e o cupom
// conferido antes de fechar o pedido.
class CompraTest extends IntegrationTest {

    // ------------------------------------------------------------------ frete

    @Test
    void freteEhPublicoEMaisBaratoPertoDeSaoPaulo() {
        Resposta sp = get("/frete?cep=01310-100&subtotal=50", null).esperar(200);
        Resposta norte = get("/frete?cep=69005000&subtotal=50", null).esperar(200);

        assertThat(sp.lista("$[*].tipo")).containsExactly("PAC", "SEDEX");
        assertThat(sp.decimal("$[0].preco")).isLessThan(norte.decimal("$[0].preco"));
        assertThat(sp.<Integer>ler("$[0].prazoDias")).isLessThan(norte.<Integer>ler("$[0].prazoDias"));
    }

    @Test
    void pacGratisAPartirDe200EmProdutosESedexSempreCobrado() {
        Resposta r = get("/frete?cep=20040020&subtotal=200", null).esperar(200);

        assertThat(r.decimal("$[0].preco")).isEqualByComparingTo("0");
        assertThat(r.decimal("$[1].preco")).isPositive();
    }

    @Test
    void freteComCepInvalido() {
        get("/frete?cep=123&subtotal=50", null).esperar(400);
    }

    @Test
    void pedidoSomaOFreteDaTabelaAoTotal() {
        Cliente ana = novoCliente();
        colocarNoCarrinho(ana, novaVariante(50, 10), 1);
        // endereço do teste: CEP 20040-020 (RJ), SEDEX R$ 39,90
        Resposta r = post("/customers/" + ana.id() + "/orders", corpo("frete", "SEDEX", "addressId", novoEndereco(ana)),
                ana.token()).esperar(201);

        assertThat(r.str("$.freteTipo")).isEqualTo("SEDEX");
        assertThat(r.decimal("$.fretePreco")).isEqualByComparingTo("39.90");
        assertThat(r.decimal("$.total")).isEqualByComparingTo("89.90");
    }

    @Test
    void pedidoSemFreteERecusado() {
        Cliente ana = novoCliente();
        colocarNoCarrinho(ana, novaVariante(50, 10), 1);

        post("/customers/" + ana.id() + "/orders", corpo("addressId", novoEndereco(ana)), ana.token()).esperar(400);
    }

    // ------------------------------------------------------------------ carrinho

    @Test
    void mudaAQuantidadeDeUmItemAteOEstoque() {
        Cliente ana = novoCliente();
        Variante v = novaVariante(30, 3);
        colocarNoCarrinho(ana, v, 1);
        Resposta carrinho = get(ana.carrinho(), ana.token()).esperar(200);
        String item = carrinho.str("$.itens[0].id");
        assertThat(carrinho.str("$.itens[0].produtoId")).isEqualTo(v.produtoId());
        assertThat(carrinho.str("$.itens[0].produtoNome")).isNotBlank();

        assertThat(mudarQuantidade(ana, item, 3).esperar(200).<Integer>ler("$.itens[0].quantidade")).isEqualTo(3);
        mudarQuantidade(ana, item, 4).esperar(422);
        mudarQuantidade(ana, item, 0).esperar(400);
    }

    @Test
    void naoMudaItemDoCarrinhoDeOutro() {
        Cliente ana = novoCliente();
        colocarNoCarrinho(ana, novaVariante(30, 3), 1);
        String item = get(ana.carrinho(), ana.token()).str("$.itens[0].id");
        Cliente bruno = novoCliente();

        // o Bruno usa a rota dele com o item da Ana: não acha
        mudarQuantidade(bruno, item, 2).esperar(404);
    }

    // ------------------------------------------------------------------ cupom

    @Test
    void clienteConfereOCupomAntesDeFechar() {
        String codigo = "CONF" + unico().toUpperCase();
        post("/coupons", corpo("codigo", codigo, "desconto", "10", "tipo", "PERCENTUAL",
                "validade", LocalDateTime.now().plusDays(5).toString()), admin()).esperar(201);
        Cliente ana = novoCliente();

        Resposta r = get("/coupons/validar?codigo=" + codigo.toLowerCase(), ana.token()).esperar(200);

        assertThat(r.str("$.tipo")).isEqualTo("PERCENTUAL");
        get("/coupons/validar?codigo=NAOEXISTE", ana.token()).esperar(404);
    }

    @Test
    void conferirCupomEhSoDoCliente() {
        get("/coupons/validar?codigo=X", null).esperar(401);
        get("/coupons/validar?codigo=X", novoFuncionario("ATENDENTE")).esperar(403);
    }

    @Test
    void cincoCuponsErradosBloqueiamAConferencia() {
        Cliente ana = novoCliente();
        for (int i = 0; i < 5; i++) {
            get("/coupons/validar?codigo=CHUTE" + i, ana.token()).esperar(404);
        }
        get("/coupons/validar?codigo=CHUTE9", ana.token()).esperar(429);
    }

    private Resposta mudarQuantidade(Cliente c, String item, int quantidade) {
        return executar(MockMvcRequestBuilders.patch("/api/v1" + c.carrinho() + "/items/" + item)
                .header("Authorization", "Bearer " + c.token()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"quantidade\":" + quantidade + "}"));
    }
}
