package com.leonycosta.packapi.exception;

// Parâmetro da URL com valor que não serve (ex.: busca com menos de 3 letras) → 400
public class ParametroInvalidoException extends RuntimeException {

    public ParametroInvalidoException(String message) {
        super(message);
    }
}
