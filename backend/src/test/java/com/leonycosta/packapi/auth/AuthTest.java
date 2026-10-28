package com.leonycosta.packapi.auth;

import com.leonycosta.packapi.customer.customer.CustomerRepository;
import com.leonycosta.packapi.support.IntegrationTest;
import com.leonycosta.packapi.support.Resposta;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

// Cadastro, login e senhas. Cada teste segue o formato: prepara os dados → faz a chamada → confere.
class AuthTest extends IntegrationTest {

    @Autowired
    CustomerRepository customerRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    // ------------------------------------------------------------------ cadastro

    @Test
    void cadastroDevolveTokenDeCliente() {
        Resposta r = post("/auth/register", corpo("nome", "Ana", "email", "ana-" + unico() + "@teste.com",
                "telefone", "21999990001", "senha", "senhaDaAna1"), null);

        r.esperar(201);
        assertThat(r.str("$.token")).isNotBlank();
        assertThat(r.str("$.tipo")).isEqualTo("Bearer");
        assertThat(r.str("$.usuario.tipo")).isEqualTo("CUSTOMER");
    }

    @Test
    void cadastroComSenhaCurta() {
        Resposta r = post("/auth/register", corpo("nome", "X", "email", "x-" + unico() + "@teste.com",
                "telefone", "1", "senha", "123"), null);

        r.esperar(400);
        // o erro de validação diz qual campo está errado
        assertThat(r.lista("$.fieldErrors[*].field")).contains("senha");
    }

    @Test
    void cadastroComEmailInvalido() {
        post("/auth/register", corpo("nome", "X", "email", "nao-e-email", "telefone", "1", "senha", "senha1234"), null)
                .esperar(400);
    }

    @Test
    void cadastroComEmailRepetidoMesmoEmMaiusculo() {
        Cliente ana = novoCliente();

        post("/auth/register", corpo("nome", "Outra", "email", ana.email().toUpperCase(), "telefone", "1",
                "senha", "senha1234"), null).esperar(409);
    }

    // ------------------------------------------------------------------ login

    @Test
    void adminFazLogin() {
        Resposta r = post("/auth/staff/login", corpo("email", ADMIN_EMAIL, "senha", ADMIN_SENHA), null);

        r.esperar(200);
        assertThat(r.str("$.usuario.tipo")).isEqualTo("STAFF");
    }

    @Test
    void loginDoClienteIgnoraMaiusculasNoEmail() {
        Cliente ana = novoCliente();

        post("/auth/login", corpo("email", ana.email().toUpperCase(), "senha", ana.senha()), null).esperar(200);
    }

    @Test
    void loginComSenhaErrada() {
        Cliente ana = novoCliente();

        post("/auth/login", corpo("email", ana.email(), "senha", "errada123"), null).esperar(401);
    }

    @Test
    void loginComEmailInexistente() {
        post("/auth/login", corpo("email", "ninguem-" + unico() + "@teste.com", "senha", "qualquer1"), null)
                .esperar(401);
    }

    @Test
    void mesmaMensagemParaSenhaErradaEEmailInexistente() {
        // se as mensagens fossem diferentes, daria para descobrir quais e-mails têm conta na loja
        Cliente ana = novoCliente();

        Resposta senhaErrada = post("/auth/login", corpo("email", ana.email(), "senha", "errada123"), null);
        Resposta emailInexistente = post("/auth/login",
                corpo("email", "ninguem-" + unico() + "@teste.com", "senha", "qualquer1"), null);

        assertThat(senhaErrada.str("$.message")).isEqualTo(emailInexistente.str("$.message"));
    }

    @Test
    void clienteNaoEntraPeloLoginDeFuncionario() {
        Cliente ana = novoCliente();

        post("/auth/staff/login", corpo("email", ana.email(), "senha", ana.senha()), null).esperar(401);
    }

    @Test
    void funcionarioNaoEntraPeloLoginDeCliente() {
        post("/auth/login", corpo("email", ADMIN_EMAIL, "senha", ADMIN_SENHA), null).esperar(401);
    }

    @Test
    void funcionarioComSenhaErrada() {
        post("/auth/staff/login", corpo("email", ADMIN_EMAIL, "senha", "errada123"), null).esperar(401);
    }

    // ------------------------------------------------------------------ /auth/me

    @Test
    void meMostraQuemEstaLogado() {
        Cliente ana = novoCliente();

        Resposta r = get("/auth/me", ana.token()).esperar(200);

        assertThat(r.str("$.email")).isEqualTo(ana.email());
        assertThat(r.str("$.tipo")).isEqualTo("CUSTOMER");
    }

    @Test
    void meDoAdminTrazAsSeisPermissoes() {
        Resposta r = get("/auth/me", admin()).esperar(200);

        assertThat(r.str("$.tipo")).isEqualTo("STAFF");
        assertThat(r.lista("$.permissoes")).containsExactlyInAnyOrder(
                "CATALOG_WRITE", "INVENTORY_MANAGE", "ORDER_MANAGE", "COUPON_MANAGE", "CUSTOMER_READ", "STAFF_MANAGE");
    }

    @Test
    void meSemToken() {
        get("/auth/me", null).esperar(401);
    }

    // ------------------------------------------------------------------ senhas

    @Test
    void senhaFicaNoBancoComoHashBCrypt() {
        Cliente ana = novoCliente();

        // aqui o teste olha direto no banco, pelo repository
        String hash = customerRepository.findByEmail(ana.email()).orElseThrow().getSenhaHash();

        assertThat(hash).startsWith("$2a$10$").doesNotContain(ana.senha());
        // o hash não volta a ser senha, mas dá para conferir se uma senha bate com ele
        assertThat(passwordEncoder.matches(ana.senha(), hash)).isTrue();
    }

    @Test
    void respostasDaApiNaoMostramASenha() {
        Cliente ana = novoCliente();

        Resposta r = get("/customers/" + ana.id(), ana.token()).esperar(200);

        assertThat(r.corpo()).doesNotContainIgnoringCase("senha");
    }
}
