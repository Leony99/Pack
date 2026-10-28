package com.leonycosta.packapi.support;

import com.jayway.jsonpath.JsonPath;

import java.math.BigDecimal;
import java.util.List;

// Resposta de uma chamada à API nos testes: o status HTTP e o corpo em JSON.
// Os campos são lidos com JsonPath: "$.nome" é o campo nome, "$.itens[0].id" o id do primeiro item,
// "$.length()" o tamanho de uma lista.
public record Resposta(int status, String corpo) {

    // Confere o status e devolve a própria resposta, para encadear: post(...).esperar(201).str("$.id")
    public Resposta esperar(int esperado) {
        if (status != esperado) {
            throw new AssertionError("Status esperado " + esperado + ", veio " + status + ". Corpo: " + corpo);
        }
        return this;
    }

    public <T> T ler(String caminho) {
        return JsonPath.read(corpo, caminho);
    }

    public String str(String caminho) {
        Object valor = ler(caminho);
        return valor == null ? null : valor.toString();
    }

    public int inteiro(String caminho) {
        return ((Number) ler(caminho)).intValue();
    }

    // Valores em dinheiro: compara com compareTo/isEqualByComparingTo, porque 110 e 110.00 são o mesmo preço
    public BigDecimal decimal(String caminho) {
        return new BigDecimal(ler(caminho).toString());
    }

    public List<String> lista(String caminho) {
        List<Object> valores = ler(caminho);
        return valores.stream().map(String::valueOf).toList();
    }

    public int tamanho() {
        return ler("$.length()");
    }

    // tamanho de uma lista dentro da resposta, como tamanho("$.itens")
    public int tamanho(String caminhoDaLista) {
        return ler(caminhoDaLista + ".length()");
    }
}
