package com.leonycosta.packapi.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

// Erros de segurança acontecem antes dos controllers, então o GlobalExceptionHandler não os vê.
// Aqui eles ganham o mesmo formato JSON do ApiError.
@Component
public class SecurityErrorHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    // Sem token, token expirado ou assinatura inválida → 401
    @Override
    public void commence(HttpServletRequest req, HttpServletResponse res, AuthenticationException ex) throws IOException {
        write(res, req, 401, "Unauthorized", "Faça login para acessar este recurso (token ausente, inválido ou expirado)");
    }

    // Logado, mas sem permissão para este recurso → 403
    @Override
    public void handle(HttpServletRequest req, HttpServletResponse res, AccessDeniedException ex) throws IOException {
        write(res, req, 403, "Forbidden", "Você não tem permissão para acessar este recurso");
    }

    private void write(HttpServletResponse res, HttpServletRequest req, int status, String error, String message)
            throws IOException {
        res.setStatus(status);
        res.setContentType("application/json;charset=UTF-8");
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
        res.getWriter().write(String.format(
                "{\"timestamp\":\"%s\",\"status\":%d,\"error\":\"%s\",\"message\":\"%s\",\"path\":\"%s\"}",
                timestamp, status, error, message, req.getRequestURI().replace("\"", "")));
    }
}
