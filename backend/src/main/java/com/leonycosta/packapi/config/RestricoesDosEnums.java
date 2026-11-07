package com.leonycosta.packapi.config;

import com.leonycosta.packapi.enums.*;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.DependsOn;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

// Mantém a regra CHECK de cada coluna de enum igual aos valores do enum no Java.
// O Hibernate cria a regra (ex.: payments_metodo_check) junto com a tabela, mas o ddl-auto=update nunca
// a atualiza: um valor novo no enum (PaymentMetodo.OUTRO, OrderStatus.DEVOLVIDO) seria recusado pelo banco
// de produção, que já existia. Roda na partida, depois do Hibernate e antes de a API receber requisições.
// Coluna nova com @Enumerated? Inclua aqui; o RestricoesDosEnumsTest avisa se faltar.
// o @DependsOn faz este bean nascer depois de o Hibernate criar/atualizar as tabelas
@Component
@DependsOn("entityManagerFactory")
public class RestricoesDosEnums {

    record ColunaDeEnum(String tabela, String coluna, Class<? extends Enum<?>> tipo) {
        String restricao() {
            return tabela + "_" + coluna + "_check";
        }
    }

    static final List<ColunaDeEnum> COLUNAS = List.of(
            new ColunaDeEnum("coupons", "tipo", CouponTipo.class),
            new ColunaDeEnum("inventory_movements", "tipo_movimentacao", MovimentoTipo.class),
            new ColunaDeEnum("orders", "status", OrderStatus.class),
            new ColunaDeEnum("payments", "metodo", PaymentMetodo.class),
            new ColunaDeEnum("payments", "status", PaymentStatus.class),
            new ColunaDeEnum("shipments", "status", ShipmentStatus.class));

    private final JdbcTemplate jdbc;
    private final TransactionTemplate transacao;

    public RestricoesDosEnums(JdbcTemplate jdbc, TransactionTemplate transacao) {
        this.jdbc = jdbc;
        this.transacao = transacao;
    }

    @PostConstruct
    public void sincronizar() {
        for (ColunaDeEnum c : COLUNAS) {
            // os valores vêm do próprio enum, nunca de quem usa a API
            String valores = Arrays.stream(c.tipo().getEnumConstants())
                    .map(v -> "'" + v.name() + "'")
                    .collect(Collectors.joining(", "));
            // apagar e recriar na mesma transação: não existe um instante sem a regra
            transacao.executeWithoutResult(t -> {
                jdbc.execute("ALTER TABLE " + c.tabela() + " DROP CONSTRAINT IF EXISTS " + c.restricao());
                jdbc.execute("ALTER TABLE " + c.tabela() + " ADD CONSTRAINT " + c.restricao()
                        + " CHECK (" + c.coluna() + " IN (" + valores + "))");
            });
        }
    }
}
