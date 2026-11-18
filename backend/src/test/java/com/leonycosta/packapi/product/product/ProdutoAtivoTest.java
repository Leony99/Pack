package com.leonycosta.packapi.product.product;

import com.leonycosta.packapi.product.inventory.InventoryMovementRepository;
import com.leonycosta.packapi.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;

// Ativar e desativar produtos: todo produto nasce inativo (fora da loja), aparece quando é ativado e sai
// quando é desativado, sem perder nada. Apagar só vale para quem nunca esteve em um pedido.
class ProdutoAtivoTest extends IntegrationTest {

    @Autowired
    ProductService productService;

    @Autowired
    InventoryMovementRepository movementRepository;

    @Test
    void produtoNasceInativoEForaDaLoja() {
        String nome = "Novo " + unico();
        String id = post("/products", corpo("nome", nome, "preco", 10, "tagIds", tagsObrigatorias()), admin())
                .esperar(201).str("$.id");

        assertThat(get("/products/" + id, null).esperar(200).<Boolean>ler("$.ativo")).isFalse();
        assertThat(buscar(nome)).isEmpty();

        ativar(id);
        assertThat(buscar(nome)).containsExactly(id);
    }

    @Test
    void desativadoSaiDaLojaEDosDestaques() {
        Variante v = novaVariante(10, 5);
        String nome = get("/products/" + v.produtoId(), null).esperar(200).str("$.nome");
        productService.esquecerRanking();
        assertThat(get("/products/mais-vendidos?limite=48", null).esperar(200).lista("$[*].id")).contains(v.produtoId());

        patch("/products/" + v.produtoId() + "/desativar", admin()).esperar(200);

        assertThat(buscar(nome)).isEmpty();
        assertThat(get("/products/mais-vendidos?limite=48", null).esperar(200).lista("$[*].id"))
                .doesNotContain(v.produtoId());
        // a página do produto continua respondendo, como indisponível
        assertThat(get("/products/" + v.produtoId(), null).esperar(200).<Boolean>ler("$.ativo")).isFalse();
    }

    @Test
    void inativosSoParaQuemCuidaDoCatalogo() {
        String id = post("/products", corpo("nome", "Inativo " + unico(), "preco", 10, "tagIds", tagsObrigatorias()),
                admin()).esperar(201).str("$.id");

        get("/products/inativos", null).esperar(401);
        get("/products/inativos", novoCliente().token()).esperar(403);
        assertThat(get("/products/inativos?tamanho=100", admin()).esperar(200).lista("$.itens[*].id")).contains(id);
        patch("/products/" + id + "/ativar", novoCliente().token()).esperar(403);
    }

    @Test
    void produtoInativoNaoVaiParaOCarrinho() {
        Variante v = novaVariante(10, 5);
        patch("/products/" + v.produtoId() + "/desativar", admin()).esperar(200);
        Cliente c = novoCliente();

        post(c.carrinho() + "/items", corpo("variantId", v.id(), "quantidade", 1), c.token()).esperar(422);
    }

    @Test
    void desativadoDepoisDeIrParaOCarrinhoNaoPassaNoCheckout() {
        Variante v = novaVariante(10, 5);
        Cliente c = novoCliente();
        String endereco = novoEndereco(c);
        colocarNoCarrinho(c, v, 1);
        patch("/products/" + v.produtoId() + "/desativar", admin()).esperar(200);

        checkout(c, endereco).esperar(422);
        assertThat(estoque(v)).isEqualTo(5);
    }

    @Test
    void pedidoMostraOItemDesativadoComoIndisponivel() {
        Variante v = novaVariante(10, 5);
        String nome = get("/products/" + v.produtoId(), null).esperar(200).str("$.nome");
        Pedido p = novoPedido(v, 1);
        patch("/products/" + v.produtoId() + "/desativar", admin()).esperar(200);

        var pedido = get("/orders/" + p.id(), p.cliente().token()).esperar(200);
        assertThat(pedido.str("$.itens[0].produtoNome")).isEqualTo(nome);
        assertThat(pedido.<Boolean>ler("$.itens[0].disponivel")).isFalse();
    }

    @Test
    void produtoQueJaEsteveEmPedidoNaoPodeSerApagado() {
        Variante v = novaVariante(10, 5);
        Pedido p = novoPedido(v, 1);
        // nem depois de cancelado: o caminho é desativar
        patch("/orders/" + p.id() + "/status?status=CANCELADO", admin()).esperar(200);

        delete("/products/" + v.produtoId(), admin()).esperar(409);
        delete("/variants/" + v.id(), admin()).esperar(409);
    }

    @Test
    void produtoQueNuncaEsteveEmPedidoPodeSerApagadoSemPerderOHistoricoDeEstoque() {
        Variante v = novaVariante(10, 5);
        post("/inventory/movements", corpo("variantId", v.id(), "tipoMovimentacao", "ENTRADA", "quantidade", 3,
                "motivo", "Reposição"), admin()).esperar(201);
        int movimentos = movementRepository.findByVariantSku(v.sku()).size();

        delete("/products/" + v.produtoId(), admin()).esperar(204);

        get("/products/" + v.produtoId(), null).esperar(404);
        assertThat(movimentos).isPositive();
        assertThat(movementRepository.findByVariantSku(v.sku())).hasSize(movimentos)
                .allSatisfy(m -> assertThat(m.getVariant()).isNull());
    }

    // ------------------------------------------------------------------ apoio

    private java.util.List<String> buscar(String nome) {
        return executar(MockMvcRequestBuilders.get("/api/v1/products").param("nome", nome)).esperar(200)
                .lista("$.itens[*].id");
    }
}
