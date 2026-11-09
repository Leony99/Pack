package com.leonycosta.packapi.product;

import com.leonycosta.packapi.support.IntegrationTest;
import com.leonycosta.packapi.support.Resposta;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;

// Catálogo: produtos, variantes, imagens, tags, tamanhos e cores.
class CatalogTest extends IntegrationTest {

    // ------------------------------------------------------------------ tamanhos

    @Test
    void tamanhoSemLabel() {
        post("/sizes", corpo("label", ""), admin()).esperar(400);
    }

    @Test
    void tamanhoRepetidoMesmoEmMinusculo() {
        String label = "P" + unico();
        post("/sizes", corpo("label", label), admin()).esperar(201);

        post("/sizes", corpo("label", label.toLowerCase()), admin()).esperar(409);
    }

    @Test
    void tamanhoEhSalvoEmMaiusculo() {
        String id = novoTamanho();
        String label = "gg" + unico();

        Resposta r = put("/sizes/" + id, corpo("label", label), admin()).esperar(200);

        assertThat(r.str("$.label")).isEqualTo(label.toUpperCase());
    }

    // ------------------------------------------------------------------ produtos

    @Test
    void slugEhGeradoDoNomeSemAcento() {
        String sufixo = unico();

        Resposta r = post("/products", corpo("nome", "Camiseta Básica " + sufixo, "preco", 100), admin()).esperar(201);

        assertThat(r.str("$.slug")).isEqualTo("camiseta-basica-" + sufixo);
        assertThat(r.str("$.nome")).isEqualTo("Camiseta Básica " + sufixo);
    }

    @Test
    void produtoComMesmoNomeGeraSlugRepetido() {
        String nome = "Calça " + unico();
        post("/products", corpo("nome", nome, "preco", 100), admin()).esperar(201);

        post("/products", corpo("nome", nome, "preco", 50), admin()).esperar(409);
    }

    @Test
    void produtoComPrecoNegativo() {
        post("/products", corpo("nome", "Produto " + unico(), "preco", -5), admin()).esperar(400);
    }

    @ParameterizedTest(name = "buscar \"{0} …\" acha \"Básica …\"")
    @ValueSource(strings = {"básica", "basica", "BÁSICA"})
    void buscaPorNomeIgnoraAcentoEMaiusculas(String termo) {
        String sufixo = unico();
        post("/products", corpo("nome", "Camiseta Básica " + sufixo, "preco", 100), admin()).esperar(201);

        // .param() monta o ?nome=... já codificado, com o acento certo
        Resposta r = executar(MockMvcRequestBuilders.get("/api/v1/products").param("nome", termo + " " + sufixo))
                .esperar(200);

        assertThat(r.tamanho("$.itens")).isEqualTo(1);
    }

    @ParameterizedTest(name = "buscar \"{0}\" é recusado")
    @ValueSource(strings = {"a", "ab", "  ab  "})
    void buscaComMenosDe3LetrasEhRecusada(String termo) {
        Resposta r = executar(MockMvcRequestBuilders.get("/api/v1/products").param("nome", termo)).esperar(400);

        assertThat(r.str("$.message")).contains("pelo menos 3 letras");
    }

    @Test
    void buscaComTresLetrasFunciona() {
        executar(MockMvcRequestBuilders.get("/api/v1/products").param("nome", "abc")).esperar(200);
    }

    @Test
    void buscarProdutoPeloSlug() {
        String sufixo = unico();
        post("/products", corpo("nome", "Moletom " + sufixo, "preco", 150), admin()).esperar(201);

        get("/products/slug/moletom-" + sufixo, null).esperar(200);
    }

    @Test
    void produtoInexistente() {
        get("/products/" + UUID_INEXISTENTE, null).esperar(404);
    }

    // ------------------------------------------------------------------ variantes

    @Test
    void varianteSemPrecoUsaODoProduto() {
        Variante v = novaVariante(100, 5);

        Resposta r = get("/variants/" + v.id(), null).esperar(200);

        assertThat(r.decimal("$.precoEfetivo")).isEqualByComparingTo("100");
    }

    @Test
    void varianteComPrecoProprio() {
        String produto = novoProduto(100);

        Resposta r = post("/products/" + produto + "/variants", corpo("sizeId", novoTamanho(), "colorId", novaCor(),
                "sku", "sku-" + unico(), "preco", 120, "quant", 3), admin()).esperar(201);

        assertThat(r.decimal("$.precoEfetivo")).isEqualByComparingTo("120");
    }

    @Test
    void skuRepetidoMesmoEmMinusculo() {
        Variante v = novaVariante(100, 5);

        post("/products/" + v.produtoId() + "/variants", corpo("sizeId", novoTamanho(), "colorId", novaCor(),
                "sku", v.sku().toLowerCase(), "quant", 1), admin()).esperar(409);
    }

    @Test
    void varianteComEstoqueNegativo() {
        String produto = novoProduto(100);

        post("/products/" + produto + "/variants", corpo("sizeId", novoTamanho(), "colorId", novaCor(),
                "sku", "neg-" + unico(), "quant", -3), admin()).esperar(400);
    }

    @Test
    void varianteComPrecoNegativoZeroOuAbsurdo() {
        // antes, -100 era aceito e o checkout criava um pedido de -R$ 100
        String produto = novoProduto(100);
        for (String preco : new String[]{"-100", "0", "1000000.01", "10.123"}) {
            post("/products/" + produto + "/variants", corpo("sizeId", novoTamanho(), "colorId", novaCor(),
                    "sku", "p-" + unico(), "preco", preco, "quant", 1), admin()).esperar(400);
        }
        post("/products", corpo("nome", "Caro " + unico(), "preco", "1e30"), admin()).esperar(400);
    }

    @Test
    void editarAVarianteNaoMexeNoEstoque() {
        // o estoque só muda por movimento: com permissão de estoque, com trava e com registro no histórico
        Variante v = novaVariante(100, 10);
        Resposta atual = get("/variants/" + v.id(), null).esperar(200);

        put("/variants/" + v.id(), corpo("sizeId", atual.str("$.size.id"), "colorId", atual.str("$.color.id"),
                "sku", v.sku(), "preco", 150, "quant", 9999), admin()).esperar(200);

        assertThat(estoque(v)).isEqualTo(10);
        assertThat(get("/variants/" + v.id(), null).decimal("$.precoEfetivo")).isEqualByComparingTo("150");
    }

    @Test
    void apagarVarianteTiraElaDosCarrinhos() {
        // antes, bastava um cliente deixar a variante no carrinho para ela não poder mais ser apagada (409)
        Variante v = novaVariante(100, 10);
        Cliente ana = novoCliente();
        colocarNoCarrinho(ana, v, 1);

        delete("/variants/" + v.id(), admin()).esperar(204);

        assertThat(get(ana.carrinho(), ana.token()).tamanho("$.itens")).isZero();
    }

    @Test
    void varianteJaVendidaNaoPodeSerApagada() {
        Variante v = novaVariante(100, 10);
        novoPedido(v, 1);

        delete("/variants/" + v.id(), admin()).esperar(409);
        assertThat(estoque(v)).isEqualTo(9);
    }

    // ------------------------------------------------------------------ imagens

    @Test
    void imagemSoComHttps() {
        String produto = novoProduto(100);
        for (String url : new String[]{"javascript:alert(document.cookie)", "http://cdn.teste/1.jpg",
                "data:text/html,<script>alert(1)</script>", "https://cdn.teste/com espaco.jpg"}) {
            post("/products/" + produto + "/images", corpo("url", url, "ordem", 0), admin()).esperar(400);
        }
    }

    @Test
    void imagensVoltamNaOrdemDeExibicao() {
        String produto = novoProduto(100);
        post("/products/" + produto + "/images", corpo("url", "https://cdn.teste/2.jpg", "ordem", 2), admin()).esperar(201);
        post("/products/" + produto + "/images", corpo("url", "https://cdn.teste/1.jpg", "ordem", 1), admin()).esperar(201);

        Resposta r = get("/products/" + produto + "/images", null).esperar(200);

        assertThat(r.lista("$[*].ordem")).containsExactly("1", "2");
    }

    @Test
    void imagemComOrdemNegativa() {
        post("/products/" + novoProduto(100) + "/images", corpo("url", "https://cdn.teste/z.jpg", "ordem", -1), admin())
                .esperar(400);
    }

    @Test
    void removerImagem() {
        String produto = novoProduto(100);
        String imagem = post("/products/" + produto + "/images", corpo("url", "https://cdn.teste/1.jpg", "ordem", 1),
                admin()).esperar(201).str("$.id");

        delete("/images/" + imagem, admin()).esperar(204);
        assertThat(get("/products/" + produto + "/images", null).tamanho()).isZero();
    }

    // ------------------------------------------------------------------ tags

    @Test
    void vincularEDesvincularTag() {
        String produto = novoProduto(100);
        String tag = post("/tags", corpo("tag", "inverno-" + unico()), admin()).esperar(201).str("$.id");
        String rota = "/products/" + produto + "/tags";

        post(rota, corpo("tagId", tag), admin()).esperar(200);
        post(rota, corpo("tagId", tag), admin()).esperar(409);         // já vinculada
        delete(rota + "/" + tag, admin()).esperar(200);
        delete(rota + "/" + tag, admin()).esperar(404);                // não está mais vinculada
    }

    @Test
    void filtrarProdutosPorTag() {
        String nomeDaTag = "verao-" + unico();
        String tag = post("/tags", corpo("tag", nomeDaTag), admin()).esperar(201).str("$.id");
        String comTag = novoProduto(100);
        novoProduto(100); // um produto sem a tag, que não pode aparecer
        post("/products/" + comTag + "/tags", corpo("tagId", tag), admin()).esperar(200);

        Resposta r = executar(MockMvcRequestBuilders.get("/api/v1/products").param("tag", nomeDaTag)).esperar(200);

        assertThat(r.lista("$.itens[*].id")).containsExactly(comTag);
    }

    // ------------------------------------------------------------------ paginação

    @Test
    void listagemVemEmPaginasNaOrdemDoNome() {
        String sufixo = unico();
        for (String letra : new String[]{"C", "A", "B"}) {
            post("/products", corpo("nome", "Paginado " + sufixo + " " + letra, "preco", 10), admin()).esperar(201);
        }

        Resposta primeira = executar(MockMvcRequestBuilders.get("/api/v1/products")
                .param("nome", "Paginado " + sufixo).param("tamanho", "2")).esperar(200);
        Resposta segunda = executar(MockMvcRequestBuilders.get("/api/v1/products")
                .param("nome", "Paginado " + sufixo).param("tamanho", "2").param("pagina", "1")).esperar(200);

        assertThat(primeira.lista("$.itens[*].nome")).containsExactly("Paginado " + sufixo + " A", "Paginado " + sufixo + " B");
        assertThat(primeira.inteiro("$.totalItens")).isEqualTo(3);
        assertThat(primeira.inteiro("$.totalPaginas")).isEqualTo(2);
        assertThat(segunda.lista("$.itens[*].nome")).containsExactly("Paginado " + sufixo + " C");
    }

    @Test
    void tamanhoDaPaginaTemTetoDe100EPaginaNegativaViraZero() {
        Resposta r = executar(MockMvcRequestBuilders.get("/api/v1/products")
                .param("tamanho", "1000000").param("pagina", "-5")).esperar(200);

        assertThat(r.inteiro("$.tamanho")).isEqualTo(100);
        assertThat(r.inteiro("$.pagina")).isZero();
    }

    @Test
    void paginaEnormeVoltaVaziaSemErro() {
        // antes dava 500: o deslocamento (página × tamanho) passava do maior int
        for (String tamanho : new String[]{"1", "20", "100"}) {
            Resposta r = executar(MockMvcRequestBuilders.get("/api/v1/products")
                    .param("pagina", "2147483647").param("tamanho", tamanho)).esperar(200);
            assertThat(r.tamanho("$.itens")).isZero();
        }
    }

    @Test
    void paginaComTextoNoLugarDoNumeroDa400() {
        executar(MockMvcRequestBuilders.get("/api/v1/products").param("pagina", "abc")).esperar(400);
    }

    // ------------------------------------------------------------------ exclusões que deixariam o histórico quebrado

    @Test
    void naoApagaProdutoQueJaFoiVendido() {
        Variante v = novaVariante(100, 5);
        novoPedido(v, 1);

        delete("/products/" + v.produtoId(), admin()).esperar(409);
    }

    @Test
    void naoApagaTamanhoEmUso() {
        String tamanho = novoTamanho();
        post("/products/" + novoProduto(100) + "/variants", corpo("sizeId", tamanho, "colorId", novaCor(),
                "sku", "sku-" + unico(), "quant", 1), admin()).esperar(201);

        delete("/sizes/" + tamanho, admin()).esperar(409);
    }

    @Test
    void apagarTagEmUsoNaoQuebraOProduto() {
        String produto = novoProduto(100);
        String tag = post("/tags", corpo("tag", "promo-" + unico()), admin()).esperar(201).str("$.id");
        post("/products/" + produto + "/tags", corpo("tagId", tag), admin()).esperar(200);

        delete("/tags/" + tag, admin()).esperar(204);

        get("/products/" + produto, null).esperar(200);
    }
}
