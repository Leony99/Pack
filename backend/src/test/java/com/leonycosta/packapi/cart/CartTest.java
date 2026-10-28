package com.leonycosta.packapi.cart;

import com.leonycosta.packapi.support.IntegrationTest;
import com.leonycosta.packapi.support.Resposta;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

// Carrinho: adicionar, somar, remover, esvaziar e preço sempre atual.
class CartTest extends IntegrationTest {

    @Test
    void mesmoItemDuasVezesSomaAQuantidade() {
        Cliente ana = novoCliente();
        Variante v = novaVariante(50, 10);

        colocarNoCarrinho(ana, v, 1);
        colocarNoCarrinho(ana, v, 2);

        Resposta r = get(ana.carrinho(), ana.token()).esperar(200);
        assertThat(r.tamanho("$.itens")).isEqualTo(1);
        assertThat(r.inteiro("$.itens[0].quantidade")).isEqualTo(3);
        assertThat(r.decimal("$.total")).isEqualByComparingTo("150");
    }

    @Test
    void quantidadeZero() {
        Cliente ana = novoCliente();
        Variante v = novaVariante(50, 10);

        post(ana.carrinho() + "/items", corpo("variantId", v.id(), "quantidade", 0), ana.token()).esperar(400);
    }

    @Test
    void varianteInexistente() {
        Cliente ana = novoCliente();

        post(ana.carrinho() + "/items", corpo("variantId", UUID_INEXISTENTE, "quantidade", 1), ana.token())
                .esperar(404);
    }

    @Test
    void removerItemDoProprioCarrinho() {
        Cliente ana = novoCliente();
        colocarNoCarrinho(ana, novaVariante(50, 10), 1);
        String item = get(ana.carrinho(), ana.token()).str("$.itens[0].id");

        Resposta r = delete(ana.carrinho() + "/items/" + item, ana.token()).esperar(200);

        assertThat(r.tamanho("$.itens")).isZero();
    }

    @Test
    void naoRemoveItemDeOutroCarrinhoPelaPropriaRota() {
        // o Bruno usa a rota do carrinho dele, mas com o id de um item da Ana
        Cliente ana = novoCliente();
        Cliente bruno = novoCliente();
        colocarNoCarrinho(ana, novaVariante(50, 10), 1);
        String itemDaAna = get(ana.carrinho(), ana.token()).str("$.itens[0].id");

        delete(bruno.carrinho() + "/items/" + itemDaAna, bruno.token()).esperar(404);

        assertThat(get(ana.carrinho(), ana.token()).tamanho("$.itens")).isEqualTo(1);
    }

    @Test
    void esvaziarCarrinho() {
        Cliente ana = novoCliente();
        colocarNoCarrinho(ana, novaVariante(50, 10), 1);
        colocarNoCarrinho(ana, novaVariante(80, 10), 2);

        delete(ana.carrinho(), ana.token()).esperar(204);

        assertThat(get(ana.carrinho(), ana.token()).tamanho("$.itens")).isZero();
    }

    @Test
    void carrinhoMostraSempreOPrecoAtual() {
        // o carrinho não congela o preço: só o pedido guarda o preço do momento da compra
        Cliente ana = novoCliente();
        Variante v = novaVariante(100, 10);
        colocarNoCarrinho(ana, v, 2);

        put("/products/" + v.produtoId(), corpo("nome", "Produto " + unico(), "preco", 110), admin()).esperar(200);

        assertThat(get(ana.carrinho(), ana.token()).decimal("$.total")).isEqualByComparingTo("220");
    }
}
