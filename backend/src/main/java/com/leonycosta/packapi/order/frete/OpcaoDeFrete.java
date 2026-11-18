package com.leonycosta.packapi.order.frete;

import java.math.BigDecimal;

// Uma opção de entrega para o CEP: o preço já com o frete grátis aplicado (PAC acima de R$ 200)
public record OpcaoDeFrete(TipoFrete tipo, String nome, BigDecimal preco, int prazoDias) {
}
