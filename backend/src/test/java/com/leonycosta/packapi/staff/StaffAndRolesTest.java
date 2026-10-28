package com.leonycosta.packapi.staff;

import com.leonycosta.packapi.support.IntegrationTest;
import com.leonycosta.packapi.support.Resposta;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// Funcionários, papéis e permissões: o que cada papel criado pelo AuthDataSeeder consegue fazer.
class StaffAndRolesTest extends IntegrationTest {

    // ------------------------------------------------------------------ o que o seeder cria

    @Test
    void papeisPadraoExistem() {
        Resposta r = get("/roles", admin()).esperar(200);

        assertThat(r.lista("$[*].nome")).contains("ADMIN", "ESTOQUISTA", "ATENDENTE", "SUPERVISOR");
    }

    @Test
    void existemSeisPermissoes() {
        Resposta r = get("/permissions", admin()).esperar(200);

        assertThat(r.tamanho()).isEqualTo(6);
    }

    @Test
    void supervisorJuntaAsPermissoesDoEstoquistaEDoAtendente() {
        Resposta r = get("/roles", admin()).esperar(200);

        List<String> doSupervisor = r.ler("$[?(@.nome == 'SUPERVISOR')].permissoes[*].nome");

        assertThat(doSupervisor).containsExactlyInAnyOrder(
                "CATALOG_WRITE", "INVENTORY_MANAGE", "ORDER_MANAGE", "CUSTOMER_READ");
    }

    // ------------------------------------------------------------------ cadastro de funcionário

    @Test
    void funcionarioComEmailRepetido() {
        String email = "eva-" + unico() + "@teste.com";
        post("/staff", corpo("nome", "Eva", "email", email, "senha", "estoque123", "roleId", papelId("ESTOQUISTA")),
                admin()).esperar(201);

        post("/staff", corpo("nome", "Eva 2", "email", email.toUpperCase(), "senha", "estoque123",
                "roleId", papelId("ESTOQUISTA")), admin()).esperar(409);
    }

    @Test
    void loginDoFuncionarioTrazAsPermissoesDoPapel() {
        String email = "lia-" + unico() + "@teste.com";
        post("/staff", corpo("nome", "Lia", "email", email, "senha", "supervisor1", "roleId", papelId("SUPERVISOR")),
                admin()).esperar(201);

        Resposta login = post("/auth/staff/login", corpo("email", email, "senha", "supervisor1"), null).esperar(200);

        assertThat(login.lista("$.usuario.permissoes")).hasSize(4);
    }

    @Test
    void adminNaoApagaAPropriaConta() {
        String meuId = get("/auth/me", admin()).esperar(200).str("$.id");

        delete("/staff/" + meuId, admin()).esperar(422);
    }

    // ------------------------------------------------------------------ estoquista

    @Test
    void estoquistaCuidaDoCatalogoEDoEstoque() {
        String estoquista = novoFuncionario("ESTOQUISTA");
        Variante v = novaVariante(50, 5);

        post("/products", corpo("nome", "Bermuda " + unico(), "preco", 80), estoquista).esperar(201);
        post("/inventory/movements", corpo("variantId", v.id(), "tipoMovimentacao", "ENTRADA", "quantidade", 1),
                estoquista).esperar(201);
    }

    @Test
    void estoquistaNaoMexeEmPedidosNemFuncionarios() {
        String estoquista = novoFuncionario("ESTOQUISTA");
        Pedido p = novoPedido(novaVariante(50, 5), 1);

        patch("/orders/" + p.id() + "/status?status=CANCELADO", estoquista).esperar(403);
        get("/staff", estoquista).esperar(403);
    }

    // ------------------------------------------------------------------ atendente

    @Test
    void atendenteConsultaClientes() {
        String atendente = novoFuncionario("ATENDENTE");
        Cliente ana = novoCliente();

        get("/customers", atendente).esperar(200);
        get(ana.carrinho(), atendente).esperar(200);
    }

    @Test
    void atendenteNaoMexeNoCatalogoNemEmCupons() {
        String atendente = novoFuncionario("ATENDENTE");

        post("/products", corpo("nome", "Não " + unico(), "preco", 1), atendente).esperar(403);
        post("/coupons", corpo("codigo", "AT" + unico(), "desconto", 5, "tipo", "FIXO", "validade", VALIDADE_FUTURA),
                atendente).esperar(403);
    }

    // ------------------------------------------------------------------ supervisor (estoquista + atendente)

    @Test
    void supervisorFazOQueOsDoisFazem() {
        String supervisor = novoFuncionario("SUPERVISOR");
        Variante v = novaVariante(50, 5);
        Pedido p = novoPedido(v, 1);

        post("/products", corpo("nome", "Jaqueta " + unico(), "preco", 200), supervisor).esperar(201);
        post("/inventory/movements", corpo("variantId", v.id(), "tipoMovimentacao", "ENTRADA", "quantidade", 1),
                supervisor).esperar(201);
        get("/variants/estoque-baixo", supervisor).esperar(200);
        get("/customers", supervisor).esperar(200);
        get("/orders/" + p.id(), supervisor).esperar(200);
        patch("/orders/" + p.id() + "/status?status=CANCELADO", supervisor).esperar(200);
    }

    @Test
    void supervisorNaoMexeEmCuponsNemFuncionarios() {
        String supervisor = novoFuncionario("SUPERVISOR");

        post("/coupons", corpo("codigo", "SUP" + unico(), "desconto", 5, "tipo", "FIXO", "validade", VALIDADE_FUTURA),
                supervisor).esperar(403);
        get("/staff", supervisor).esperar(403);
    }

    @Test
    void supervisorNaoFazCheckoutPeloCliente() {
        String supervisor = novoFuncionario("SUPERVISOR");
        Cliente ana = novoCliente();
        String endereco = novoEndereco(ana);

        post("/customers/" + ana.id() + "/orders", corpo("addressId", endereco), supervisor).esperar(403);
    }

    // ------------------------------------------------------------------ permissão muda só no próximo login

    @Test
    void permissaoNovaOuRemovidaSoValeNoProximoLogin() {
        // papel novo com COUPON_MANAGE e um funcionário nele
        String papel = post("/roles", corpo("nome", "TESTE_" + unico()), admin()).esperar(201).str("$.id");
        List<String> ids = get("/permissions", admin()).ler("$[?(@.nome == 'COUPON_MANAGE')].id");
        String cupons = ids.getFirst();
        post("/roles/" + papel + "/permissions/" + cupons, null, admin()).esperar(200);

        String email = "teo-" + unico() + "@teste.com";
        post("/staff", corpo("nome", "Teo", "email", email, "senha", "teste1234", "roleId", papel), admin())
                .esperar(201);
        String tokenAntigo = login("/auth/staff/login", email, "teste1234");
        get("/coupons", tokenAntigo).esperar(200);

        // tira a permissão do papel
        delete("/roles/" + papel + "/permissions/" + cupons, admin()).esperar(200);

        // o token antigo continua valendo: as permissões estão escritas dentro dele (a API não guarda sessão)
        get("/coupons", tokenAntigo).esperar(200);

        // num login novo, o token já sai sem a permissão
        String tokenNovo = login("/auth/staff/login", email, "teste1234");
        get("/coupons", tokenNovo).esperar(403);
    }
}
