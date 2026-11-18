package com.leonycosta.packapi.product.product;

import com.leonycosta.packapi.support.IntegrationTest;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// O catálogo filtrado pela API (GET /products?estilo=&categoria=&colecao=&novidades=&disponiveis=&ordem=),
// o drop em destaque (GET /products/drop-em-destaque), as coleções em ordem de lançamento (GET /tags/colecoes)
// e o lote do Hibernate contra o N+1.
// O banco é o mesmo para todas as classes: cada teste cria tags com nomes únicos e filtra por elas.
class CatalogoTest extends IntegrationTest {

    @Autowired
    EntityManagerFactory emf;

    @Test
    void filtraPorEstiloECategoriaNoBanco() {
        String treino = novaTagComNome("ESTILO");
        String casual = novaTagComNome("ESTILO");
        String camisa = novaTagComNome("CATEGORIA");
        String bermuda = novaTagComNome("CATEGORIA");
        String treinoCamisa = produtoCom(10, treino, camisa);
        String casualCamisa = produtoCom(10, casual, camisa);
        produtoCom(10, treino, bermuda);

        assertThat(ids("?categoria=" + nome(camisa))).containsExactlyInAnyOrder(treinoCamisa, casualCamisa);
        // filtros diferentes valem juntos: treino E camisa
        assertThat(ids("?estilo=" + nome(treino) + "&categoria=" + nome(camisa))).containsExactly(treinoCamisa);
        // dois valores no mesmo filtro valem como "ou"
        assertThat(ids("?estilo=" + nome(treino) + "&estilo=" + nome(casual) + "&categoria=" + nome(camisa)))
                .containsExactlyInAnyOrder(treinoCamisa, casualCamisa);
    }

    @Test
    void filtraPorColecaoEDisponibilidade() {
        String colecao = novaTagComNome("COLECAO");
        String comEstoque = produtoCom(10, colecao);
        novaVariante(comEstoque, 3);
        String semEstoque = produtoCom(10, colecao);
        novaVariante(semEstoque, 0);

        assertThat(ids("?colecao=" + nome(colecao))).containsExactlyInAnyOrder(comEstoque, semEstoque);
        assertThat(ids("?colecao=" + nome(colecao) + "&disponiveis=true")).containsExactly(comEstoque);
    }

    @Test
    void novidadesSaoOsCadastrosRecentes() {
        String colecao = novaTagComNome("COLECAO");
        String novo = produtoCom(10, colecao);

        assertThat(ids("?colecao=" + nome(colecao) + "&novidades=true")).containsExactly(novo);
    }

    @Test
    void ordenaEPagina() {
        String colecao = novaTagComNome("COLECAO");
        String caro = produtoCom(30, colecao);
        String barato = produtoCom(10, colecao);
        String medio = produtoCom(20, colecao);
        String filtro = "?colecao=" + nome(colecao);

        assertThat(ids(filtro + "&ordem=menor-preco")).containsExactly(barato, medio, caro);
        assertThat(ids(filtro + "&ordem=maior-preco")).containsExactly(caro, medio, barato);
        assertThat(ids(filtro + "&ordem=recentes")).containsExactly(medio, barato, caro);

        // só a página pedida sai do banco, com o total para a loja saber quantas há
        var pagina = get("/products" + filtro + "&ordem=menor-preco&pagina=1&tamanho=2", null).esperar(200);
        assertThat(pagina.lista("$.itens[*].id")).containsExactly(caro);
        assertThat(pagina.inteiro("$.totalItens")).isEqualTo(3);
        assertThat(pagina.inteiro("$.totalPaginas")).isEqualTo(2);
    }

    @Test
    void filtroOuOrdemInvalidos() {
        get("/products?ordem=aleatoria", null).esperar(400);
        get("/products?estilo=" + "x".repeat(FiltroDoCatalogo.MAXIMO_DO_NOME + 1), null).esperar(400);
    }

    @Test
    void dropEmDestaqueEhAColecaoDaPecaMaisNova() {
        String antiga = novaTagComNome("COLECAO");
        String nova = novaTagComNome("COLECAO");
        produtoCom(10, antiga);
        String primeira = produtoCom(10, nova);
        String segunda = produtoCom(10, nova);

        var drop = get("/products/drop-em-destaque?limite=8", null).esperar(200);

        assertThat(drop.str("$.colecao")).isEqualTo(nome(nova));
        assertThat(drop.lista("$.produtos[*].id")).containsExactly(segunda, primeira);
    }

    @Test
    void limiteDoDropForaDaFaixa() {
        get("/products/drop-em-destaque?limite=0", null).esperar(400);
        get("/products/drop-em-destaque?limite=" + (ProductService.MAXIMO_DO_DROP + 1), null).esperar(400);
    }

    @Test
    void colecoesEmOrdemDeLancamento() {
        String semPecas = novaTagComNome("COLECAO");
        String antiga = novaTagComNome("COLECAO");
        String nova = novaTagComNome("COLECAO");
        produtoCom(10, antiga);
        produtoCom(10, nova);

        List<String> colecoes = get("/tags/colecoes", null).esperar(200).lista("$[*].id");

        // a da peça mais nova primeiro; as sem peças, no fim
        assertThat(colecoes.indexOf(nova)).isLessThan(colecoes.indexOf(antiga));
        assertThat(colecoes.indexOf(antiga)).isLessThan(colecoes.indexOf(semPecas));
    }

    @Test
    void umaPaginaNaoFazUmaConsultaPorProduto() {
        String colecao = novaTagComNome("COLECAO");
        for (int i = 0; i < 6; i++) {
            String produto = produtoCom(10, colecao);
            novaVariante(produto, 1);
            novaVariante(produto, 1);
        }
        Statistics estatisticas = emf.unwrap(SessionFactory.class).getStatistics();
        estatisticas.clear();

        assertThat(ids("?colecao=" + nome(colecao))).hasSize(6);

        // sem o lote (default_batch_fetch_size), seriam 3 consultas por produto (imagens, tags e variantes):
        // mais de 18. Com ele, a página inteira sai em poucas
        assertThat(estatisticas.getPrepareStatementCount()).isLessThan(10);
    }

    // ------------------------------------------------------------------ apoio

    private final java.util.Map<String, String> nomes = new java.util.HashMap<>();

    // Cria uma tag do filtro e guarda o nome dela (o filtro da URL é pelo nome)
    private String novaTagComNome(String filtro) {
        String nome = filtro.toLowerCase() + "-" + unico();
        String id = post("/tags", corpo("tag", nome, "filtro", filtro), admin()).esperar(201).str("$.id");
        nomes.put(id, nome);
        return id;
    }

    private String nome(String tagId) {
        return nomes.get(tagId);
    }

    // Produto com as tags pedidas; sem estilo ou categoria entre elas, leva as obrigatórias do teste
    private String produtoCom(Number preco, String... tagIds) {
        List<String> tags = new java.util.ArrayList<>(List.of(tagIds));
        boolean temEstilo = tags.stream().anyMatch(t -> nome(t).startsWith("estilo-"));
        boolean temCategoria = tags.stream().anyMatch(t -> nome(t).startsWith("categoria-"));
        if (!temEstilo) tags.add(tagsObrigatorias().get(0));
        if (!temCategoria) tags.add(tagsObrigatorias().get(1));
        return ativar(post("/products", corpo("nome", "Produto " + unico(), "preco", preco, "tagIds", tags), admin())
                .esperar(201).str("$.id"));
    }

    private List<String> ids(String filtros) {
        return get("/products" + filtros + (filtros.contains("tamanho=") ? "" : "&tamanho=100"), null)
                .esperar(200).lista("$.itens[*].id");
    }
}
