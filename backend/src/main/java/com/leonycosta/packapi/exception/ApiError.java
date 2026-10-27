package com.leonycosta.packapi.exception;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ApiError {

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    private int status;
    private String error;
    private String message;
    private String path;

    // Usado só em erros de validação (@Valid), para listar campo a campo
    private List<FieldError> fieldErrors;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class FieldError {
        private String field;
        private String message;
    }
}
