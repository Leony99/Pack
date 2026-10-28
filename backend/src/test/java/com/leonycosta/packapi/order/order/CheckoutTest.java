package com.leonycosta.packapi.order.order;

import com.leonycosta.packapi.exception.BusinessException;
import com.leonycosta.packapi.support.AoMesmoTempo;
import com.leonycosta.packapi.support.IntegrationTest;
import com.leonycosta.packapi.support.Resposta;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;

import static org.assertj.core.api.Assertions.assertThat;

// Checkout: carrinho → pedido. Snapshot de preço e endereço, cupons, estoque e rollback.
class CheckoutTest extends IntegrationTest {

    @Autowired
    OrderService orderService;

    // ------------------------------------------------------------------ o caminho feliz

    @Test
    void checkoutCalculaOTotalELimpaOCarrinho() {
        Cliente ana = novoCliente();
        String endereco = novoEndereco(ana);
        colocarNoCarrinho(ana, novaVariante(110, 10), 2);

        Resposta pedido = checkout(ana, endereco).esperar(201);

        assertThat(pedido.decimal("$.total")).isEqualByComparingTo("220");
        assertThat(pedido.str("$.status")).isEqualTo("AGUARDANDO_PAGAMENTO");
        assertThat(get(ana.carrinho(), ana.token()).tamanho("$.itens")).isZero();
    }

    @Test
    void checkoutBaixaOEstoqueERegistraOMovimento() {
        Variante v = novaVariante(50, 10);

        novoPedido(v, 3);

        assertThat(estoque(v)).isEqualTo(7);
        Resposta movimentos = get("/variants/" + v.id() + "/movements", admin()).esperar(200);
        assertThat(movimentos.lista("$[*].tipoMovimentacao")).containsExactly("SAIDA");
    }

    @Test
    void listarOsPropriosPedidos() {
        Cliente ana = novoCliente();
        String endereco = novoEndereco(ana);
        Variante v = novaVariante(50, 10);
        for (int i = 0; i < 2; i++) {
            colocarNoCarrinho(ana, v, 1);
            checkout(ana, endereco).esperar(201);
        }

        assertThat(get("/customers/" + ana.id() + "/orders", ana.token()).esperar(200).tamanho()).isEqualTo(2);
    }

    // ------------------------------------------------------------------ snapshot: o pedido guarda o momento da compra

    @Test
    void pedidoGuardaOPrecoDoMomentoDaCompra() {
        Variante v = novaVariante(110, 10);
        Pedido p = novoPedido(v, 2);

        // depois da compra, o preço do produto sobe
        put("/products/" + v.produtoId(), corpo("nome", "Produto " + unico(), "preco", 150), admin()).esperar(200);

        Resposta pedido = get("/orders/" + p.id(), p.cliente().token()).esperar(200);
        assertThat(pedido.decimal("$.itens[0].precoUnit")).isEqualByComparingTo("110");
        assertThat(pedido.decimal("$.total")).isEqualByComparingTo("220");
    }

    @Test
    void pedidoGuardaOEnderecoDoMomentoDaCompra() {
        Cliente ana = novoCliente();
        String endereco = novoEndereco(ana);
        colocarNoCarrinho(ana, novaVariante(50, 10), 1);
        String pedido = checkout(ana, endereco).esperar(201).str("$.id");

        // a Ana muda o endereço depois de comprar
        put("/customers/" + ana.id() + "/addresses/" + endereco, corpo("cep", "99999-999", "rua", "Nova",
                "numero", "9", "cidade", "Rio de Janeiro", "estado", "RJ"), ana.token()).esperar(200);

        assertThat(get("/orders/" + pedido, ana.token()).str("$.enderecoCep")).isEqualTo("20040-020");
    }

    // ------------------------------------------------------------------ o que impede o checkout

    @Test
    void carrinhoVazio() {
        Cliente ana = novoCliente();

        checkout(ana, novoEndereco(ana)).esperar(422);
    }

    @Test
    void enderecoDeOutroCliente() {
        Cliente bruno = novoCliente();
        String enderecoDaAna = novoEndereco(novoCliente());
        colocarNoCarrinho(bruno, novaVariante(50, 10), 1);

        checkout(bruno, enderecoDaAna).esperar(422);
    }

    @Test
    void segundoClienteNaoLevaEstoqueQueJaAcabou() {
        Variante v = novaVariante(50, 3);
        Cliente ana = novoCliente();
        Cliente bruno = novoCliente();
        String enderecoDaAna = novoEndereco(ana);
        String enderecoDoBruno = novoEndereco(bruno);
        colocarNoCarrinho(ana, v, 2);
        colocarNoCarrinho(bruno, v, 2);

        checkout(ana, enderecoDaAna).esperar(201);   // sobra 1
        checkout(bruno, enderecoDoBruno).esperar(422);

        assertThat(estoque(v)).isEqualTo(1);
        // o carrinho do Bruno não é apagado: ele pode diminuir a quantidade e tentar de novo
        assertThat(get(bruno.carrinho(), bruno.token()).tamanho("$.itens")).isEqualTo(1);
    }

    // Dois clientes clicam em "finalizar" no mesmo instante pelo último item.
    // Repete algumas vezes porque a disputa depende do tempo: numa rodada pode não haver choque.
    // O checkout é chamado direto no OrderService (sem HTTP), uma thread por cliente.
    @RepeatedTest(value = 5, name = "rodada {currentRepetition} de {totalRepetitions}")
    void doisCheckoutsAoMesmoTempoPeloUltimoItem() throws Exception {
        Variante v = novaVariante(50, 1);
        List<Callable<Boolean>> compras = new ArrayList<>();
        for (int i = 0; i < 2; i++) {
            Cliente c = novoCliente();
            String endereco = novoEndereco(c);
            colocarNoCarrinho(c, v, 1);
            compras.add(() -> tentarCheckout(c, endereco));
        }

        List<Boolean> resultados = AoMesmoTempo.executar(compras);

        assertThat(resultados).as("só uma das duas compras pode passar").containsOnlyOnce(true);
        assertThat(estoque(v)).isZero();
    }

    @Test
    void cincoClientesDisputandoTresUnidades() throws Exception {
        Variante v = novaVariante(50, 3);
        List<Callable<Boolean>> compras = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            Cliente c = novoCliente();
            String endereco = novoEndereco(c);
            colocarNoCarrinho(c, v, 1);
            compras.add(() -> tentarCheckout(c, endereco));
        }

        List<Boolean> resultados = AoMesmoTempo.executar(compras);

        assertThat(resultados).filteredOn(passou -> passou).hasSize(3);
        assertThat(estoque(v)).isZero();
    }

    @Test
    void pedidosComOsMesmosItensEmOrdemDiferenteNaoTravam() throws Exception {
        // a Ana coloca A e depois B no carrinho; o Bruno coloca B e depois A.
        // Se cada um travasse o estoque na ordem do próprio carrinho, um esperaria o outro (deadlock).
        Variante a = novaVariante(50, 10);
        Variante b = novaVariante(50, 10);
        Cliente ana = novoCliente();
        Cliente bruno = novoCliente();
        String enderecoDaAna = novoEndereco(ana);
        String enderecoDoBruno = novoEndereco(bruno);
        colocarNoCarrinho(ana, a, 1);
        colocarNoCarrinho(ana, b, 1);
        colocarNoCarrinho(bruno, b, 1);
        colocarNoCarrinho(bruno, a, 1);

        List<Boolean> resultados = AoMesmoTempo.executar(List.of(
                () -> tentarCheckout(ana, enderecoDaAna),
                () -> tentarCheckout(bruno, enderecoDoBruno)));

        assertThat(resultados).containsExactly(true, true);
        assertThat(estoque(a)).isEqualTo(8);
        assertThat(estoque(b)).isEqualTo(8);
    }

    private boolean tentarCheckout(Cliente c, String enderecoId) {
        try {
            orderService.checkout(UUID.fromString(c.id()), new OrderRequest(UUID.fromString(enderecoId), null));
            return true;
        } catch (BusinessException semEstoque) {
            return false;
        }
    }

    // ------------------------------------------------------------------ cupons

    @Test
    void cupomPercentual() {
        String codigo = novoCupom("10", "PERCENTUAL");
        Cliente ana = novoCliente();
        colocarNoCarrinho(ana, novaVariante(100, 10), 2);

        Resposta r = post("/customers/" + ana.id() + "/orders",
                corpo("addressId", novoEndereco(ana), "codigoCupom", codigo), ana.token()).esperar(201);

        assertThat(r.decimal("$.total")).isEqualByComparingTo("180");
    }

    @Test
    void cupomFixoMaiorQueOPedidoDeixaOTotalEmZero() {
        String codigo = novoCupom("500", "FIXO");
        Cliente ana = novoCliente();
        colocarNoCarrinho(ana, novaVariante(100, 10), 1);

        // o código vai em minúsculo: o cupom é encontrado do mesmo jeito
        Resposta r = post("/customers/" + ana.id() + "/orders",
                corpo("addressId", novoEndereco(ana), "codigoCupom", codigo.toLowerCase()), ana.token()).esperar(201);

        assertThat(r.decimal("$.total")).isEqualByComparingTo("0");
    }

    @Test
    void cupomInexistenteDesfazTudo() {
        Cliente ana = novoCliente();
        Variante v = novaVariante(100, 10);
        colocarNoCarrinho(ana, v, 1);

        post("/customers/" + ana.id() + "/orders", corpo("addressId", novoEndereco(ana), "codigoCupom", "NAOEXISTE"),
                ana.token()).esperar(404);

        // rollback: o erro aconteceu no meio do checkout, mas nada ficou pela metade
        assertThat(estoque(v)).isEqualTo(10);
        assertThat(get(ana.carrinho(), ana.token()).tamanho("$.itens")).isEqualTo(1);
        assertThat(get("/customers/" + ana.id() + "/orders", ana.token()).tamanho()).isZero();
    }

    @Test
    void cupomComValidadeNoPassado() {
        post("/coupons", corpo("codigo", "VELHO" + unico(), "desconto", 10, "tipo", "PERCENTUAL",
                "validade", "2020-01-01T00:00:00"), admin()).esperar(422);
    }

    @Test
    void cupomPercentualAcimaDe100() {
        post("/coupons", corpo("codigo", "MAIS" + unico(), "desconto", 150, "tipo", "PERCENTUAL",
                "validade", VALIDADE_FUTURA), admin()).esperar(422);
    }

    private String novoCupom(String desconto, String tipo) {
        String codigo = "CUPOM" + unico().toUpperCase();
        post("/coupons", corpo("codigo", codigo, "desconto", desconto, "tipo", tipo, "validade", VALIDADE_FUTURA),
                admin()).esperar(201);
        return codigo;
    }
}
