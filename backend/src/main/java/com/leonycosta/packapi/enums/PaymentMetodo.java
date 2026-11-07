package com.leonycosta.packapi.enums;

public enum PaymentMetodo {
    PIX,
    CARTAO_CREDITO,
    CARTAO_DEBITO,
    BOLETO,
    // recebido por fora (dinheiro, transferência...), registrado por um funcionário com ORDER_MANAGE
    OUTRO
}
