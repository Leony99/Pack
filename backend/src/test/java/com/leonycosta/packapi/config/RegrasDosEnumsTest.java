package com.leonycosta.packapi.config;

import com.leonycosta.packapi.customer.contato.StatusDaMensagem;
import com.leonycosta.packapi.enums.CouponTipo;
import com.leonycosta.packapi.enums.MovimentoTipo;
import com.leonycosta.packapi.enums.OrderStatus;
import com.leonycosta.packapi.enums.PaymentMetodo;
import com.leonycosta.packapi.enums.PaymentStatus;
import com.leonycosta.packapi.enums.ShipmentStatus;
import com.leonycosta.packapi.enums.TagFiltro;
import com.leonycosta.packapi.order.frete.TipoFrete;
import com.leonycosta.packapi.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Arrays;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

// As regras do banco que limitam os valores de cada enum (CHECK ... IN (...)) vêm das migrações (Flyway), e
// não do Java: um valor novo num enum precisa de uma migração que mude a regra, senão o banco o recusa em
// produção. Este teste pega o esquecimento: compara cada regra do banco com os valores do enum.
class RegrasDosEnumsTest extends IntegrationTest {

    // cada regra do banco e o enum que ela tem de aceitar
    static final Map<String, Class<? extends Enum<?>>> REGRAS = Map.of(
            "coupons_tipo_check", CouponTipo.class,
            "inventory_movements_tipo_movimentacao_check", MovimentoTipo.class,
            "orders_status_check", OrderStatus.class,
            "orders_frete_tipo_check", TipoFrete.class,
            "contato_mensagens_status_check", StatusDaMensagem.class,
            "payments_metodo_check", PaymentMetodo.class,
            "payments_status_check", PaymentStatus.class,
            "product_tags_filtro_check", TagFiltro.class,
            "shipments_status_check", ShipmentStatus.class);

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void cadaRegraDoBancoAceitaExatamenteOsValoresDoEnum() {
        REGRAS.forEach((regra, tipo) -> {
            String definicao = jdbc.queryForObject(
                    "select pg_get_constraintdef(oid) from pg_constraint where conname = ?", String.class, regra);
            var noBanco = java.util.regex.Pattern.compile("'([A-Z_]+)'").matcher(definicao).results()
                    .map(m -> m.group(1)).toList();
            var noJava = Arrays.stream(tipo.getEnumConstants()).map(e -> e.name()).toList();

            assertThat(noBanco).as("regra %s (enum %s): falta uma migração?", regra, tipo.getSimpleName())
                    .containsExactlyInAnyOrderElementsOf(noJava);
        });
    }

    @Test
    void todaRegraDoBancoEstaNaLista() {
        // uma coluna de enum nova precisa entrar em REGRAS, para o teste de cima cuidar dela
        var noBanco = jdbc.queryForList("""
                select conname from pg_constraint
                where contype = 'c' and connamespace = 'public'::regnamespace""", String.class);

        assertThat(noBanco).containsExactlyInAnyOrderElementsOf(REGRAS.keySet());
    }

    @Test
    void oFlywayRegistrouAEstruturaInicial() {
        // o banco dos testes nasce vazio: o Flyway roda a V1 e a registra no histórico
        var versoes = jdbc.queryForList(
                "select version from flyway_schema_history where success order by installed_rank", String.class);

        assertThat(versoes).contains("1");
    }
}
