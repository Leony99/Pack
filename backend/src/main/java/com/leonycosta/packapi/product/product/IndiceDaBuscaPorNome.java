package com.leonycosta.packapi.product.product;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.DependsOn;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.zip.CRC32;

// Índice da busca de produtos por nome (GET /products?nome=...).
//
// A busca procura o termo em qualquer posição do nome (LIKE '%termo%'). Um índice comum não ajuda nisso,
// porque ele é ordenado como um dicionário e só acha o que COMEÇA com o termo. Sem índice, cada busca lê a
// tabela inteira, o que gastaria a cota de CPU com uma loja grande. O índice trigrama (extensão pg_trgm)
// guarda os pedaços de 3 letras de cada nome ("camisa" → cam, ami, mis, isa), então o banco acha o termo
// em qualquer posição. Por isso a busca exige pelo menos 3 letras.
//
// Quem decide usar o índice é o planejador do PostgreSQL, a cada consulta: com poucos produtos, ler a
// tabela é mais barato e ele ignora o índice; conforme a tabela cresce, passa a usá-lo sozinho.
//
// Roda na partida, depois do Hibernate, e não faz nada se o índice já existe:
//   - CREATE INDEX comum: enquanto cria, as leituras seguem normalmente e as gravações em products esperam
//     terminar (não dão erro). Com a tabela da loja, leva milissegundos. Se falhar, é desfeito por inteiro;
//   - o nome leva um código da expressão: mudou a expressão da busca, nasce um índice novo e o antigo sai;
//   - um erro aqui (ex.: sem permissão para a extensão) só gera um aviso: a busca funciona sem o índice.
// PROVISÓRIO: vira uma migração quando o banco passar a usar o Flyway (ver "Próximos passos" no README).
@Slf4j
@Component
@DependsOn("entityManagerFactory")
public class IndiceDaBuscaPorNome {

    static final String PREFIXO = "idx_products_nome_busca_";
    static final String NOME = PREFIXO + codigo(ProductRepository.NOME_SEM_ACENTO);

    private final JdbcTemplate jdbc;

    public IndiceDaBuscaPorNome(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @PostConstruct
    public void criar() {
        try {
            jdbc.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm");
            jdbc.execute("CREATE INDEX IF NOT EXISTS " + NOME
                    + " ON products USING gin (" + ProductRepository.NOME_SEM_ACENTO + " gin_trgm_ops)");
            apagarVersoesAntigas();
        } catch (DataAccessException e) {
            log.warn("Não foi possível criar o índice da busca por nome; a busca funciona, mas lê a tabela inteira", e);
        }
    }

    // índices de uma expressão antiga da busca: o banco não os usa mais, só gastariam espaço e gravação
    private void apagarVersoesAntigas() {
        List<String> antigos = jdbc.queryForList("""
                select indexname from pg_indexes
                where tablename = 'products' and indexname like ? and indexname <> ?""",
                String.class, PREFIXO + "%", NOME);
        for (String antigo : antigos) {
            jdbc.execute("DROP INDEX IF EXISTS " + antigo);
            log.info("Índice antigo da busca por nome apagado: {}", antigo);
        }
    }

    // 8 caracteres que mudam quando a expressão muda
    private static String codigo(String expressao) {
        CRC32 crc = new CRC32();
        crc.update(expressao.getBytes(StandardCharsets.UTF_8));
        return String.format("%08x", crc.getValue());
    }
}
