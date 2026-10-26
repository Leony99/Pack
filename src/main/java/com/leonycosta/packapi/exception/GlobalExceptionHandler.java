package com.leonycosta.packapi.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Recurso não encontrado no banco → 404
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex, HttpServletRequest req) {
        return build(404, "Not Found", ex.getMessage(), req.getRequestURI());
    }

    // Login com e-mail ou senha errados → 401
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiError> handleUnauthorized(UnauthorizedException ex, HttpServletRequest req) {
        return build(401, "Unauthorized", ex.getMessage(), req.getRequestURI());
    }

    // Regra de negócio violada (estoque, cupom expirado etc.) → 422
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> handleBusiness(BusinessException ex, HttpServletRequest req) {
        return build(422, "Unprocessable Entity", ex.getMessage(), req.getRequestURI());
    }

    // Conflito de unicidade (email duplicado etc.) → 409
    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiError> handleConflict(ConflictException ex, HttpServletRequest req) {
        return build(409, "Conflict", ex.getMessage(), req.getRequestURI());
    }

    // Falha de validação do @Valid nos DTOs → 400, lista campo a campo
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<ApiError.FieldError> fieldErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fe -> new ApiError.FieldError(fe.getField(), fe.getDefaultMessage()))
                .toList();

        ApiError error = new ApiError(
                LocalDateTime.now(),
                400,
                "Bad Request",
                "Erro de validação nos campos enviados",
                req.getRequestURI(),
                fieldErrors
        );
        return ResponseEntity.badRequest().body(error);
    }

    // UUID/enum inválido na URL, JSON malformado ou parâmetro obrigatório ausente → 400
    @ExceptionHandler({
            MethodArgumentTypeMismatchException.class,
            HttpMessageNotReadableException.class,
            MissingServletRequestParameterException.class
    })
    public ResponseEntity<ApiError> handleBadRequest(Exception ex, HttpServletRequest req) {
        String message = switch (ex) {
            case MethodArgumentTypeMismatchException e ->
                    "Valor inválido para o parâmetro '" + e.getName() + "': " + e.getValue();
            case MissingServletRequestParameterException e ->
                    "Parâmetro obrigatório ausente: " + e.getParameterName();
            default -> "Corpo da requisição inválido ou malformado";
        };
        return build(400, "Bad Request", message, req.getRequestURI());
    }

    // Rota inexistente → 404
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> handleNoRoute(NoResourceFoundException ex, HttpServletRequest req) {
        return build(404, "Not Found", "Rota não encontrada", req.getRequestURI());
    }

    // Método HTTP não suportado na rota → 405
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> handleMethod(HttpRequestMethodNotSupportedException ex, HttpServletRequest req) {
        return build(405, "Method Not Allowed", "Método " + ex.getMethod() + " não suportado nesta rota", req.getRequestURI());
    }

    // O banco recusou por chave estrangeira ou valor único (ex.: apagar produto que já foi vendido) → 409
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleIntegrity(DataIntegrityViolationException ex, HttpServletRequest req) {
        return build(409, "Conflict",
                "Operação não permitida: o registro está ligado a outros dados (por exemplo, já usado em pedidos)",
                req.getRequestURI());
    }

    // Qualquer outra exceção não tratada → 500
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneric(Exception ex, HttpServletRequest req) {
        // Erro inesperado: o cliente recebe uma mensagem genérica, mas o detalhe precisa ficar no log
        log.error("Erro não tratado em {} {}", req.getMethod(), req.getRequestURI(), ex);
        return build(500, "Internal Server Error", "Erro interno no servidor", req.getRequestURI());
    }

    private ResponseEntity<ApiError> build(int statusCode, String error, String message, String path) {
        ApiError body = new ApiError(
                LocalDateTime.now(),
                statusCode,
                error,
                message,
                path,
                null
        );
        return ResponseEntity.status(HttpStatusCode.valueOf(statusCode)).body(body);
    }
}
