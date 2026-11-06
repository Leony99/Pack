package com.leonycosta.packapi.exception;

import lombok.Getter;

// Tentativas demais de login, cadastro ou cupom → 429. Leva quantos segundos faltam para liberar (cabeçalho Retry-After).
@Getter
public class MuitasTentativasException extends RuntimeException {

    private final long segundosParaLiberar;

    public MuitasTentativasException(long segundosParaLiberar) {
        super("Muitas tentativas. Tente de novo em " + Math.ceilDiv(segundosParaLiberar, 60) + " min");
        this.segundosParaLiberar = segundosParaLiberar;
    }
}
