package com.leonycosta.packapi.staff;

import com.leonycosta.packapi.support.IntegrationTest;
import com.leonycosta.packapi.support.Resposta;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// O que o painel da equipe usa: a lista de pedidos, os produtos (ativos e inativos), a edição do funcionário,
// as mensagens do Contato, o resumo da visão geral e o envio de fotos.
class PainelTest extends IntegrationTest {

    // ------------------------------------------------------------------ pedidos

    @Test
    void equipeListaTodosOsPedidosEFiltraPorStatus() {
        Pedido aguardando = novoPedido(novaVariante(50, 5), 1);
        Pedido pago = novoPedidoPago(novaVariante(50, 5));

        List<String> pagos = get("/orders?status=PAGO&tamanho=100", admin()).esperar(200).lista("$.itens[*].id");

        assertThat(pagos).contains(pago.id()).doesNotContain(aguardando.id());
        get("/orders", novoCliente().token()).esperar(403);
        get("/orders", novoFuncionario("ESTOQUISTA")).esperar(403);
    }

    // ------------------------------------------------------------------ produtos do painel

    @Test
    void painelVeAtivosEInativosEBuscaPorTag() {
        String colecao = novaTag("COLECAO");
        String nomeDaColecao = get("/tags/" + colecao, null).str("$.tag");
        String inativo = post("/products", corpo("nome", "Inativo " + unico(), "preco", 10,
                "tagIds", List.of(tagsObrigatorias().get(0), tagsObrigatorias().get(1), colecao)), admin())
                .esperar(201).str("$.id");
        String ativo = novoProduto(10);
        post("/products/" + ativo + "/tags", corpo("tagId", colecao), admin());

        List<String> daColecao = get("/products/painel?tamanho=100&tag=" + nomeDaColecao, admin()).esperar(200)
                .lista("$.itens[*].id");

        assertThat(daColecao).contains(inativo);
        get("/products/painel", null).esperar(401);
        get("/products/painel", novoFuncionario("ATENDENTE")).esperar(403);
    }

    // ------------------------------------------------------------------ equipe

    @Test
    void editaNomeEPapelDoFuncionario() {
        String email = "func-" + unico() + "@teste.com";
        String id = post("/staff", corpo("nome", "Func", "email", email, "senha", "senhaFunc123",
                "roleId", papelId("ESTOQUISTA")), admin()).esperar(201).str("$.id");

        Resposta r = put("/staff/" + id, corpo("nome", "Func Novo", "email", email, "roleId", papelId("ATENDENTE")),
                admin()).esperar(200);

        assertThat(r.str("$.nome")).isEqualTo("Func Novo");
        assertThat(r.str("$.role.nome")).isEqualTo("ATENDENTE");
    }

    @Test
    void adminNaoTiraDeSiOAcessoAEquipe() {
        String eu = get("/auth/me", admin()).str("$.id");
        put("/staff/" + eu, corpo("nome", "Admin", "email", ADMIN_EMAIL, "roleId", papelId("ATENDENTE")), admin())
                .esperar(422);
    }

    // ------------------------------------------------------------------ contato

    @Test
    void contatoChegaNaCaixaDeEntradaEEhRespondido() {
        String email = "contato-" + unico() + "@teste.com";
        post("/contato", corpo("nome", "Ana", "email", email, "assunto", "Troca", "mensagem", "Quero trocar o tamanho"),
                null).esperar(204);

        String atendente = novoFuncionario("ATENDENTE");
        Resposta caixa = get("/contato?status=NOVA&tamanho=100", atendente).esperar(200);
        String id = caixa.<List<String>>ler("$.itens[?(@.email == '" + email + "')].id").getFirst();

        assertThat(patch("/contato/" + id + "?status=RESPONDIDA", atendente).esperar(200).str("$.status"))
                .isEqualTo("RESPONDIDA");
        get("/contato", novoFuncionario("ESTOQUISTA")).esperar(403);
        post("/contato", corpo("nome", "Ana", "email", "nao-e-email", "mensagem", "oi"), null).esperar(400);
    }

    // ------------------------------------------------------------------ resumo

    @Test
    void resumoMostraSoAsAreasDoPapel() {
        Resposta doAdmin = get("/painel/resumo", admin()).esperar(200);
        assertThat(doAdmin.<Object>ler("$.pedidos.vendasDoMes")).isNotNull();
        assertThat(doAdmin.<Object>ler("$.estoque.variantesComEstoqueBaixo")).isNotNull();

        String estoquista = novoFuncionario("ESTOQUISTA");
        String json = get("/painel/resumo", estoquista).esperar(200).corpo();
        assertThat(json).contains("estoque").contains("catalogo").doesNotContain("pedidos").doesNotContain("clientes");

        get("/painel/resumo", novoCliente().token()).esperar(403);
    }

    // ------------------------------------------------------------------ fotos

    // os primeiros bytes de um WebP (a API confere o tipo por eles)
    private static final byte[] WEBP = {'R', 'I', 'F', 'F', 0, 0, 0, 0, 'W', 'E', 'B', 'P', 'V', 'P', '8', ' '};

    @Test
    void fotoEnviadaFicaGuardadaEApareceNoProduto() throws Exception {
        String produto = novoProduto(10);

        Resposta r = enviarFoto(produto, "foto.webp", WEBP, admin()).esperar(201);
        String url = r.str("$.url");

        assertThat(url).contains("/imagens/" + produto + "/").endsWith(".webp");
        assertThat(get("/products/" + produto, null).lista("$.imagens[*].url")).contains(url);
        // a pasta local é servida pela própria API, com o tipo certo
        MvcResult foto = mvc.perform(MockMvcRequestBuilders.get(url.substring(url.indexOf("/imagens/")))).andReturn();
        assertThat(foto.getResponse().getStatus()).isEqualTo(200);
        assertThat(foto.getResponse().getContentType()).isEqualTo("image/webp");
    }

    @Test
    void arquivoQueNaoEhFotoERecusado() throws Exception {
        String produto = novoProduto(10);

        // o nome diz .jpg, mas o conteúdo é HTML
        enviarFoto(produto, "foto.jpg", "<html><script>alert(1)</script></html>".getBytes(), admin()).esperar(400);
        enviarFoto(produto, "foto.webp", WEBP, novoFuncionario("ATENDENTE")).esperar(403);
    }

    @Test
    void apagarAImagemApagaOArquivo() throws Exception {
        String produto = novoProduto(10);
        Resposta r = enviarFoto(produto, "foto.webp", WEBP, admin()).esperar(201);
        String caminho = r.str("$.url").substring(r.str("$.url").indexOf("/imagens/"));

        delete("/images/" + r.str("$.id"), admin()).esperar(204);

        assertThat(mvc.perform(MockMvcRequestBuilders.get(caminho)).andReturn().getResponse().getStatus()).isEqualTo(404);
    }

    @Test
    void apagarOProdutoApagaAsFotosEnviadas() throws Exception {
        String produto = novoProduto(10);
        Resposta r = enviarFoto(produto, "foto.webp", WEBP, admin()).esperar(201);
        String caminho = r.str("$.url").substring(r.str("$.url").indexOf("/imagens/"));

        delete("/products/" + produto, admin()).esperar(204);

        assertThat(mvc.perform(MockMvcRequestBuilders.get(caminho)).andReturn().getResponse().getStatus()).isEqualTo(404);
    }

    private Resposta enviarFoto(String produto, String nome, byte[] dados, String token) {
        return executar(MockMvcRequestBuilders.multipart("/api/v1/products/" + produto + "/images/upload")
                .file(new MockMultipartFile("arquivo", nome, "image/webp", dados))
                .header("Authorization", "Bearer " + token));
    }
}
