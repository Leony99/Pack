package com.leonycosta.packapi.customer;

import com.leonycosta.packapi.support.IntegrationTest;
import com.leonycosta.packapi.support.Resposta;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

// Cadastro e endereços do cliente.
class CustomerAreaTest extends IntegrationTest {

    @Test
    void cadastroJaCriaUmCarrinhoVazio() {
        Cliente ana = novoCliente();

        Resposta r = get(ana.carrinho(), ana.token()).esperar(200);

        assertThat(r.tamanho("$.itens")).isZero();
    }

    @Test
    void clienteAtualizaOProprioCadastro() {
        Cliente ana = novoCliente();

        Resposta r = put("/customers/" + ana.id(), corpo("nome", "Ana Maria", "email", ana.email(),
                "telefone", "21988887777"), ana.token()).esperar(200);

        assertThat(r.str("$.nome")).isEqualTo("Ana Maria");
    }

    @Test
    void clienteSemPedidosPodeApagarAConta() {
        Cliente ana = novoCliente();

        delete("/customers/" + ana.id(), ana.token()).esperar(204);
    }

    @Test
    void clienteComPedidosNaoApagaAConta() {
        // os pedidos são histórico da loja: apagar o cliente quebraria esse histórico
        Pedido p = novoPedido(novaVariante(50, 5), 1);

        delete("/customers/" + p.cliente().id(), p.cliente().token()).esperar(409);
    }

    // ------------------------------------------------------------------ endereços

    @Test
    void atualizarEndereco() {
        Cliente ana = novoCliente();
        String endereco = novoEndereco(ana);

        Resposta r = put("/customers/" + ana.id() + "/addresses/" + endereco, corpo("cep", "20040-020",
                "rua", "Rua Nova", "numero", "10", "cidade", "Rio de Janeiro", "estado", "RJ"), ana.token())
                .esperar(200);

        assertThat(r.str("$.rua")).isEqualTo("Rua Nova");
    }

    @Test
    void enderecoDeOutroClientePelaPropriaRota() {
        // a Ana usa a rota dela, mas com o id de um endereço do Bruno
        Cliente ana = novoCliente();
        String doBruno = novoEndereco(novoCliente());

        get("/customers/" + ana.id() + "/addresses/" + doBruno, ana.token()).esperar(422);
    }

    @Test
    void atendenteConsultaMasNaoAlteraEnderecos() {
        Cliente ana = novoCliente();
        String endereco = novoEndereco(ana);
        String atendente = novoFuncionario("ATENDENTE");
        String rota = "/customers/" + ana.id() + "/addresses/" + endereco;

        get(rota, atendente).esperar(200);
        delete(rota, atendente).esperar(403);
    }
}
