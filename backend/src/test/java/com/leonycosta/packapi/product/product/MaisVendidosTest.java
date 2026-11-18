package com.leonycosta.packapi.product.product;

import com.leonycosta.packapi.order.order.Order;
import com.leonycosta.packapi.order.order.OrderRepository;
import com.leonycosta.packapi.support.IntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

// Mais vendidos (GET /products/mais-vendidos), a linha DESTAQUES da loja, e a data de cadastro das variantes.
// O banco dos testes é o mesmo para todas as classes, então outros testes também têm pedidos pagos: as
// vendas daqui usam quantidades grandes e os testes comparam a posição de um produto com a de outro.
class MaisVendidosTest extends IntegrationTest {

    @Autowired
    OrderRepository orderRepository;

    @Autowired
    ProductService productService;

    // o ranking fica guardado por 3 dias: cada teste começa com ele recalculado, para ver as próprias vendas
    @BeforeEach
    void recalcularRanking() {
        productService.esquecerRanking();
    }

    @Test
    void quemVendeuMaisVemPrimeiro() {
        Variante menos = novaVariante(10, 2000);
        Variante mais = novaVariante(10, 2000);
        pedidoPago(menos, 80);
        pedidoPago(mais, 90);

        List<String> ranking = maisVendidos(48);

        assertThat(ranking).contains(mais.produtoId(), menos.produtoId());
        assertThat(ranking.indexOf(mais.produtoId())).isLessThan(ranking.indexOf(menos.produtoId()));
    }

    @Test
    void pedidoSemPagamentoNaoContaComoVenda() {
        Variante paga = novaVariante(10, 2000);
        Variante naoPaga = novaVariante(10, 2000);
        pedidoPago(paga, 1);
        novoPedido(naoPaga, 99);

        List<String> ranking = maisVendidos(48);

        // a peça não paga só pode aparecer depois, na parte completada pelas mais novas
        assertThat(ranking).contains(paga.produtoId());
        int posicaoDaNaoPaga = ranking.indexOf(naoPaga.produtoId());
        assertThat(posicaoDaNaoPaga == -1 || posicaoDaNaoPaga > ranking.indexOf(paga.produtoId())).isTrue();
    }

    @Test
    void vendaDeMaisDe90DiasVemDepoisDasVendasRecentes() {
        Variante antiga = novaVariante(10, 2000);
        Variante recente = novaVariante(10, 2000);
        Pedido pedidoAntigo = pedidoPago(antiga, 99);
        voltarNoTempo(pedidoAntigo, 100);
        pedidoPago(recente, 1);

        List<String> ranking = maisVendidos(48);

        // mesmo vendendo muito mais, a venda antiga só entra depois das dos últimos 90 dias
        assertThat(ranking).contains(antiga.produtoId(), recente.produtoId());
        assertThat(ranking.indexOf(recente.produtoId())).isLessThan(ranking.indexOf(antiga.produtoId()));
    }

    @Test
    void semVendasSuficientesCompletaComOsMaisNovos() {
        String novo = novoProduto(10);

        // o produto acabou de ser criado: sem vendas, entra pela parte das mais novas
        assertThat(maisVendidos(48)).contains(novo);
    }

    @Test
    void devolveOLimitePedidoSemRepetir() {
        novoProduto(10);
        novoProduto(10);

        List<String> ranking = maisVendidos(2);

        assertThat(ranking).hasSize(2).doesNotHaveDuplicates();
    }

    @Test
    void rankingFicaGuardadoAteSerRecalculado() {
        // o produto é criado antes de a lista ser guardada
        Variante nova = novaVariante(10, 2000);
        List<String> antes = maisVendidos(48);
        pedidoPago(nova, 99);

        // a venda nova só conta quando o ranking for refeito (passados os 3 dias)
        assertThat(maisVendidos(48)).isEqualTo(antes);
        productService.esquecerRanking();
        List<String> depois = maisVendidos(48);
        assertThat(depois).isNotEqualTo(antes).contains(nova.produtoId());
    }

    @Test
    void produtoApagadoSaiDoRankingSemDiminuirALista() {
        novoProduto(10);
        String apagado = novoProduto(10);
        // as duas peças mais novas, sem venda, entram pela parte que completa o ranking
        assertThat(maisVendidos(48)).contains(apagado);
        int tamanho = maisVendidos(2).size();

        delete("/products/" + apagado, admin()).esperar(204);

        // o ranking guardado é refeito: o apagado sai e outro produto ocupa o lugar dele
        assertThat(maisVendidos(48)).doesNotContain(apagado);
        assertThat(maisVendidos(2)).hasSize(tamanho);
    }

    @Test
    void limiteForaDaFaixa() {
        get("/products/mais-vendidos?limite=0", null).esperar(400);
        get("/products/mais-vendidos?limite=" + (ProductService.MAXIMO_DOS_MAIS_VENDIDOS + 1), null).esperar(400);
    }

    @Test
    void varianteGuardaADataDeCadastro() {
        Variante v = novaVariante(10, 5);

        String data = get("/variants/" + v.id(), null).esperar(200).str("$.criadoEm");

        assertThat(data).isNotBlank();
    }

    // ------------------------------------------------------------------ apoio

    private List<String> maisVendidos(int limite) {
        return get("/products/mais-vendidos?limite=" + limite, null).esperar(200).lista("$[*].id");
    }

    // Pedido de `quantidade` unidades, pago e aprovado
    private Pedido pedidoPago(Variante v, int quantidade) {
        Pedido p = novoPedido(v, quantidade);
        String pagamento = post("/orders/" + p.id() + "/payment", corpo("metodo", "PIX", "valor", p.total()),
                p.cliente().token()).esperar(201).str("$.id");
        patch("/payments/" + pagamento + "/status?status=APROVADO", admin()).esperar(200);
        return p;
    }

    private void voltarNoTempo(Pedido p, int dias) {
        Order pedido = orderRepository.findById(UUID.fromString(p.id())).orElseThrow();
        pedido.setCriadoEm(LocalDateTime.now().minusDays(dias));
        orderRepository.save(pedido);
    }
}
