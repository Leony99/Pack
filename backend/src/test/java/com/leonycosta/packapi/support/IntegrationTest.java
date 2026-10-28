package com.leonycosta.packapi.support;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.json.JsonMapper;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;

// Base dos testes de integração: sobe a aplicação inteira (controllers, segurança, services, JPA)
// ligada ao PostgreSQL descartável do TestcontainersConfig.
// O Spring guarda a aplicação montada e reaproveita entre as classes de teste, então ela sobe uma vez só.
//
// Os testes não apagam o banco entre um e outro: cada teste cria os próprios dados com nomes únicos
// (e-mail, SKU, slug...), então um teste nunca enxerga nem atrapalha os dados de outro.
@SpringBootTest(properties = {
        // valores só dos testes: não dependem do .env, que não existe no GitHub
        "jwt.secret=" + IntegrationTest.JWT_SECRET,
        "app.admin.email=" + IntegrationTest.ADMIN_EMAIL,
        "app.admin.senha=" + IntegrationTest.ADMIN_SENHA,
        "spring.datasource.password=definida-pelo-testcontainers",
        "spring.jpa.show-sql=false",
        // saída limpa: só avisos e erros da aplicação. O Hibernate avisa que não achou restrições para
        // apagar no banco vazio e o springdoc lembra de desligar o Swagger em produção, nada útil aqui.
        "logging.level.root=WARN",
        "logging.level.org.hibernate.orm.jdbc.warn=ERROR",
        "logging.level.org.springdoc=ERROR"
})
@AutoConfigureMockMvc
@Import(TestcontainersConfig.class)
public abstract class IntegrationTest {

    protected static final String JWT_SECRET = "chave-usada-so-nos-testes-com-mais-de-32-caracteres";
    protected static final String ADMIN_EMAIL = "admin@teste.com";
    protected static final String ADMIN_SENHA = "senha-do-admin-de-teste";
    protected static final String UUID_INEXISTENTE = "00000000-0000-0000-0000-000000000000";
    protected static final String VALIDADE_FUTURA = "2099-12-31T23:59:00";

    private static String tokenAdmin;

    // MockMvc: faz requisições HTTP direto no Spring, sem abrir porta. Passa pelos mesmos filtros
    // de segurança, controllers e tratamento de erro que uma requisição de verdade.
    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected JsonMapper json;

    // ------------------------------------------------------------------ chamadas HTTP

    protected Resposta chamar(HttpMethod metodo, String caminho, Object corpo, String token) {
        MockHttpServletRequestBuilder req = request(metodo, "/api/v1" + caminho);
        if (token != null) {
            req.header("Authorization", "Bearer " + token);
        }
        if (corpo != null) {
            req.contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corpo));
        }
        return executar(req);
    }

    protected Resposta executar(MockHttpServletRequestBuilder req) {
        try {
            MvcResult r = mvc.perform(req).andReturn();
            return new Resposta(r.getResponse().getStatus(), r.getResponse().getContentAsString(StandardCharsets.UTF_8));
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao chamar " + req, e);
        }
    }

    protected Resposta get(String caminho, String token) {
        return chamar(HttpMethod.GET, caminho, null, token);
    }

    protected Resposta post(String caminho, Object corpo, String token) {
        return chamar(HttpMethod.POST, caminho, corpo, token);
    }

    protected Resposta put(String caminho, Object corpo, String token) {
        return chamar(HttpMethod.PUT, caminho, corpo, token);
    }

    protected Resposta patch(String caminho, String token) {
        return chamar(HttpMethod.PATCH, caminho, null, token);
    }

    protected Resposta delete(String caminho, String token) {
        return chamar(HttpMethod.DELETE, caminho, null, token);
    }

    // Monta um corpo JSON: corpo("nome", "Ana", "preco", 10) vira {"nome":"Ana","preco":10}
    protected static Map<String, Object> corpo(Object... chavesEValores) {
        Map<String, Object> mapa = new HashMap<>();
        for (int i = 0; i < chavesEValores.length; i += 2) {
            mapa.put((String) chavesEValores[i], chavesEValores[i + 1]);
        }
        return mapa;
    }

    // Texto curto e aleatório para nomes únicos
    protected static String unico() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    // ------------------------------------------------------------------ quem faz a chamada

    // admin criado pelo AuthDataSeeder quando a aplicação sobe
    protected String admin() {
        if (tokenAdmin == null) {
            tokenAdmin = login("/auth/staff/login", ADMIN_EMAIL, ADMIN_SENHA);
        }
        return tokenAdmin;
    }

    protected String login(String rota, String email, String senha) {
        return post(rota, corpo("email", email, "senha", senha), null).esperar(200).str("$.token");
    }

    protected record Cliente(String id, String email, String senha, String token) {
        public String carrinho() {
            return "/customers/" + id + "/cart";
        }
    }

    protected Cliente novoCliente() {
        String email = "cliente-" + unico() + "@teste.com";
        String senha = "senha-" + unico();
        Resposta r = post("/auth/register",
                corpo("nome", "Cliente Teste", "email", email, "telefone", "21999990000", "senha", senha), null)
                .esperar(201);
        return new Cliente(r.str("$.usuario.id"), email, senha, r.str("$.token"));
    }

    // Funcionário com um dos papéis criados pelo seeder (ESTOQUISTA, ATENDENTE, SUPERVISOR...); devolve o token
    protected String novoFuncionario(String papel) {
        String email = "func-" + unico() + "@teste.com";
        post("/staff", corpo("nome", "Funcionário " + papel, "email", email, "senha", "senha-func-1",
                "roleId", papelId(papel)), admin()).esperar(201);
        return login("/auth/staff/login", email, "senha-func-1");
    }

    protected String papelId(String nome) {
        // filtro do JsonPath: os ids dos papéis cujo nome é igual ao procurado
        List<String> ids = get("/roles", admin()).esperar(200).ler("$[?(@.nome == '" + nome + "')].id");
        return ids.getFirst();
    }

    // ------------------------------------------------------------------ catálogo

    protected record Variante(String id, String sku, String produtoId) {
    }

    protected String novoTamanho() {
        return post("/sizes", corpo("label", "T" + unico()), admin()).esperar(201).str("$.id");
    }

    protected String novaCor() {
        return post("/colors", corpo("nome", "Cor " + unico(), "hex", "#123456"), admin()).esperar(201).str("$.id");
    }

    protected String novoProduto(Number preco) {
        return post("/products", corpo("nome", "Produto " + unico(), "preco", preco), admin()).esperar(201).str("$.id");
    }

    // Produto novo com uma variante: preço do produto e estoque inicial informados
    protected Variante novaVariante(Number precoProduto, int estoque) {
        String produtoId = novoProduto(precoProduto);
        return novaVariante(produtoId, estoque);
    }

    protected Variante novaVariante(String produtoId, int estoque) {
        String sku = "sku-" + unico();
        String id = post("/products/" + produtoId + "/variants",
                corpo("sizeId", novoTamanho(), "colorId", novaCor(), "sku", sku, "quant", estoque), admin())
                .esperar(201).str("$.id");
        return new Variante(id, sku.toUpperCase(), produtoId);
    }

    protected int estoque(Variante v) {
        return get("/variants/" + v.id(), null).esperar(200).inteiro("$.quant");
    }

    // ------------------------------------------------------------------ cliente comprando

    protected String novoEndereco(Cliente c) {
        return post("/customers/" + c.id() + "/addresses",
                corpo("cep", "20040-020", "rua", "Rua Teste", "numero", "1", "cidade", "Rio de Janeiro", "estado", "RJ"),
                c.token()).esperar(201).str("$.id");
    }

    protected void colocarNoCarrinho(Cliente c, Variante v, int quantidade) {
        post(c.carrinho() + "/items", corpo("variantId", v.id(), "quantidade", quantidade), c.token()).esperar(200);
    }

    protected Resposta checkout(Cliente c, String enderecoId) {
        return post("/customers/" + c.id() + "/orders", corpo("addressId", enderecoId), c.token());
    }

    // Pedido pronto: cliente novo compra `quantidade` da variante
    protected record Pedido(String id, Cliente cliente, BigDecimal total) {
    }

    protected Pedido novoPedido(Variante v, int quantidade) {
        Cliente c = novoCliente();
        String endereco = novoEndereco(c);
        colocarNoCarrinho(c, v, quantidade);
        Resposta r = checkout(c, endereco).esperar(201);
        return new Pedido(r.str("$.id"), c, r.decimal("$.total"));
    }

    // Pedido que já foi pago (pagamento registrado pelo cliente e aprovado pelo admin)
    protected Pedido novoPedidoPago(Variante v) {
        Pedido p = novoPedido(v, 1);
        String pagamento = post("/orders/" + p.id() + "/payment", corpo("metodo", "PIX", "valor", p.total()),
                p.cliente().token()).esperar(201).str("$.id");
        patch("/payments/" + pagamento + "/status?status=APROVADO", admin()).esperar(200);
        return p;
    }
}
