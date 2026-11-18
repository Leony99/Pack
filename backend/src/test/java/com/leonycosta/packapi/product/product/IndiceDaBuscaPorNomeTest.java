package com.leonycosta.packapi.product.product;

import com.leonycosta.packapi.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.function.Supplier;

import static org.assertj.core.api.Assertions.assertThat;

// Confere que a busca por nome usa o índice trigrama. Se alguém mudar a consulta e o índice deixar de
// servir, o banco não avisa: só volta a ler a tabela inteira. Estes testes pegam isso.
// Cada teste roda numa transação desfeita no fim, então os produtos e as configurações não ficam no banco.
class IndiceDaBuscaPorNomeTest extends IntegrationTest {

    // o índice da busca por nome, criado pela migração V1 (db/migration) com a expressão de
    // ProductRepository.NOME_SEM_ACENTO
    static final String NOME = "idx_products_nome_busca_7456385f";

    @Autowired JdbcTemplate jdbc;
    @Autowired TransactionTemplate transacao;

    @Test
    void oIndiceFoiCriadoEEstaValido() {
        List<Boolean> valido = jdbc.queryForList("""
                select i.indisvalid from pg_index i join pg_class c on c.oid = i.indexrelid
                where c.relname = ?""", Boolean.class, NOME);

        assertThat(valido).containsExactly(true);
    }

    @Test
    void aConsultaDaBuscaConsegueUsarOIndice() {
        String plano = naTransacaoDesfeita(() -> {
            // proíbe a leitura da tabela inteira: se o índice não servir para a consulta, o plano mostra outra coisa
            jdbc.execute("SET LOCAL enable_seqscan = off");
            return planoDaBusca("camisa");
        });

        assertThat(plano).contains(NOME);
    }

    @Test
    void comMuitosProdutosOBancoEscolheOIndiceSozinho() {
        String plano = naTransacaoDesfeita(() -> {
            jdbc.update("""
                    insert into products (id, nome, preco, slug, criado_em)
                    select gen_random_uuid(), 'Produto de teste ' || n, 10, 'indice-teste-' || n, now()
                    from generate_series(1, 10000) as n""");
            // As linhas novas entram primeiro na "lista pendente" do índice GIN, que o VACUUM automático integra
            // depois; enquanto ela está cheia, o planejador estima o índice caro e às vezes prefere ler a tabela,
            // e o teste ficava ora verde, ora vermelho. Integra a lista agora, como o banco faria sozinho
            jdbc.queryForObject("SELECT gin_clean_pending_list(?::regclass)", Long.class, NOME);
            // atualiza as estatísticas que o planejador usa para escolher entre ler tudo e usar o índice
            jdbc.execute("ANALYZE products");
            return planoDaBusca("zqxj");
        });

        assertThat(plano).contains(NOME);
    }

    // o plano da consulta exata do repositório, com o termo no lugar do parâmetro
    private String planoDaBusca(String termo) {
        String sql = ProductRepository.BUSCA_POR_NOME.replace(":nome", "'" + termo + "'") + " LIMIT 20";
        return String.join("\n", jdbc.queryForList("EXPLAIN " + sql, String.class));
    }

    private String naTransacaoDesfeita(Supplier<String> passo) {
        return transacao.execute(status -> {
            status.setRollbackOnly();
            return passo.get();
        });
    }
}
