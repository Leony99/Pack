package com.leonycosta.packapi.exception;

public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }

    // Mesma mensagem para e-mail inexistente e senha errada: não revela quais e-mails estão cadastrados
    public static UnauthorizedException credenciaisInvalidas() {
        return new UnauthorizedException("E-mail ou senha inválidos");
    }
}
