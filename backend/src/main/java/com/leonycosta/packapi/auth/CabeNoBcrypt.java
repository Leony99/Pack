package com.leonycosta.packapi.auth;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.nio.charset.StandardCharsets;

// O BCrypt só aceita senhas de até 72 BYTES. Letras comuns ocupam 1 byte, mas acentos ocupam 2 e emojis 4,
// então uma senha curta em caracteres pode passar do limite. Sem esta checagem, o BCrypt lança um erro → 500.
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = CabeNoBcrypt.Validador.class)
public @interface CabeNoBcrypt {

    int MAX_BYTES = 72;

    String message() default "Senha ocupa mais de 72 bytes (acentos e emojis contam mais de um)";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    class Validador implements ConstraintValidator<CabeNoBcrypt, String> {
        @Override
        public boolean isValid(String senha, ConstraintValidatorContext ctx) {
            return senha == null || senha.getBytes(StandardCharsets.UTF_8).length <= MAX_BYTES;
        }
    }
}
