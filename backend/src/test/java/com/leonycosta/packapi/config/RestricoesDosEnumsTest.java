package com.leonycosta.packapi.config;

import com.leonycosta.packapi.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

class RestricoesDosEnumsTest extends IntegrationTest {

    @Autowired JdbcTemplate jdbc;
    @Autowired RestricoesDosEnums restricoes;

    @Test
    void bancoAntigoPassaAAceitarOValorNovoDoEnum() {
        // como a produção estava: a regra criada antes de o método OUTRO existir
        // (NOT VALID: outros testes podem já ter gravado pagamentos OUTRO no banco compartilhado)
        jdbc.execute("ALTER TABLE payments DROP CONSTRAINT payments_metodo_check");
        jdbc.execute("ALTER TABLE payments ADD CONSTRAINT payments_metodo_check "
                + "CHECK (metodo IN ('PIX', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO')) NOT VALID");

        restricoes.sincronizar();

        assertThat(regra("payments_metodo_check")).contains("'OUTRO'");
    }

    @Test
    void todaColunaDeEnumDoBancoEstaNaLista() {
        // se o Hibernate criou uma regra que a lista não conhece, um valor novo daquele enum quebraria a produção
        var noBanco = jdbc.queryForList("""
                select conname from pg_constraint
                where contype = 'c' and connamespace = 'public'::regnamespace""", String.class);
        var naLista = RestricoesDosEnums.COLUNAS.stream().map(coluna -> coluna.restricao()).toList();

        assertThat(noBanco).containsExactlyInAnyOrderElementsOf(naLista);
    }

    private String regra(String nome) {
        return jdbc.queryForObject("select pg_get_constraintdef(oid) from pg_constraint where conname = ?",
                String.class, nome);
    }
}
