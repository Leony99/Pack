package com.leonycosta.packapi.product.inventory;

import com.leonycosta.packapi.enums.MovimentoTipo;
import com.leonycosta.packapi.support.AoMesmoTempo;
import com.leonycosta.packapi.support.IntegrationTest;
import com.leonycosta.packapi.support.Resposta;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;

import static org.assertj.core.api.Assertions.assertThat;

// Movimentos de estoque: ENTRADA soma, SAIDA subtrai e AJUSTE define o valor (com motivo obrigatório).
class InventoryTest extends IntegrationTest {

    @Autowired
    InventoryMovementService inventoryService;

    @Test
    void entradaSomaAoEstoque() {
        Variante v = novaVariante(50, 5);

        movimentar(v, "ENTRADA", 5, "Reposição").esperar(201);

        assertThat(estoque(v)).isEqualTo(10);
    }

    @Test
    void saidaSubtraiDoEstoque() {
        Variante v = novaVariante(50, 5);

        movimentar(v, "SAIDA", 2, "Avaria").esperar(201);

        assertThat(estoque(v)).isEqualTo(3);
    }

    @Test
    void saidaMaiorQueOEstoqueEhRecusada() {
        Variante v = novaVariante(50, 5);

        movimentar(v, "SAIDA", 50, null).esperar(422);

        assertThat(estoque(v)).isEqualTo(5);
    }

    @Test
    void ajusteDefineOValorDoEstoque() {
        Variante v = novaVariante(50, 5);

        movimentar(v, "AJUSTE", 7, "Contagem do inventário").esperar(201);

        assertThat(estoque(v)).isEqualTo(7);
    }

    @Test
    void ajusteSemMotivoEhRecusado() {
        Variante v = novaVariante(50, 5);

        movimentar(v, "AJUSTE", 7, null).esperar(422);
    }

    @Test
    void historicoGuardaCadaMovimento() {
        Variante v = novaVariante(50, 5);
        movimentar(v, "ENTRADA", 5, "Reposição").esperar(201);
        movimentar(v, "AJUSTE", 7, "Contagem do inventário").esperar(201);

        Resposta r = get("/variants/" + v.id() + "/movements", admin()).esperar(200);

        assertThat(r.lista("$[*].tipoMovimentacao")).containsExactlyInAnyOrder("ENTRADA", "AJUSTE");
    }

    @Test
    void estoqueBaixoMostraSoQuemEstaNoLimite() {
        Variante pouco = novaVariante(50, 3);
        Variante bastante = novaVariante(50, 10);

        Resposta r = get("/variants/estoque-baixo?limite=3", admin()).esperar(200);

        assertThat(r.lista("$[*].sku")).contains(pouco.sku()).doesNotContain(bastante.sku());
    }

    @Test
    void entradasAoMesmoTempoNaoSePerdem() throws Exception {
        // três reposições chegando juntas: sem trava, duas podiam ler o mesmo estoque e uma sobrescrever a outra
        Variante v = novaVariante(50, 5);
        List<Callable<Integer>> entradas = List.of(3, 4, 6).stream()
                .<Callable<Integer>>map(quantidade -> () -> {
                    inventoryService.register(new InventoryMovementRequest(
                            UUID.fromString(v.id()), MovimentoTipo.ENTRADA, quantidade, "Reposição"));
                    return quantidade;
                })
                .toList();

        AoMesmoTempo.executar(entradas);

        assertThat(estoque(v)).isEqualTo(5 + 3 + 4 + 6);
    }

    private Resposta movimentar(Variante v, String tipo, int quantidade, String motivo) {
        return post("/inventory/movements", corpo("variantId", v.id(), "tipoMovimentacao", tipo,
                "quantidade", quantidade, "motivo", motivo), admin());
    }
}
