package com.leonycosta.packapi.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// Limite geral de requisições por IP: no máximo N por minuto (app.limite-ip.*); passou disso → 429 com
// Retry-After até o minuto acabar. Vale para todas as rotas, antes da segurança e dos controllers,
// então uma requisição recusada custa quase nada (não valida token, não consulta o banco).
//
// Para quê: sem ele, um único IP pode disparar buscas no catálogo (públicas, e cada uma lê a tabela) e
// gastar a cota grátis de CPU até o disjuntor de custos tirar a API do ar.
// O que ele NÃO resolve: o Cloud Run conta a requisição antes de ela chegar aqui, então um ataque grande ou
// vindo de muitos IPs ainda gasta a cota de requisições. Barrar antes exige o Cloud Armor (ver o README).
//
// O IP é o real do cliente: em produção o Tomcat já o lê do cabeçalho do Google (forward-headers-strategy).
// IPv6 conta por bloco /64, porque cada casa recebe um bloco inteiro e trocaria de endereço à vontade.
// Fica na memória, como o LimiteDeTentativas: o Cloud Run roda no máximo 1 instância.
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class LimitePorIp extends OncePerRequestFilter {

    // limpeza: acima deste número de IPs guardados, os de minutos que já passaram são apagados
    private static final int LIMPAR_ACIMA_DE = 10_000;
    // teto de memória: com mais IPs que isto no mesmo minuto (ataque de muitos IPs), recomeça do zero
    private static final int MAXIMO_DE_IPS = 100_000;

    private final int maxPorJanela;
    private final Duration janela;
    private final Clock relogio;
    private final Map<String, Contagem> contagens = new ConcurrentHashMap<>();

    private record Contagem(Instant inicio, int requisicoes) {
    }

    @Autowired
    public LimitePorIp(@Value("${app.limite-ip.max-requisicoes}") int maxPorJanela,
                       @Value("${app.limite-ip.janela-segundos}") long segundos) {
        this(maxPorJanela, Duration.ofSeconds(segundos), Clock.systemUTC());
    }

    // usado nos testes, com um relógio que dá para avançar
    LimitePorIp(int maxPorJanela, Duration janela, Clock relogio) {
        this.maxPorJanela = maxPorJanela;
        this.janela = janela;
        this.relogio = relogio;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        Instant agora = relogio.instant();
        Contagem c = contar(chave(req.getRemoteAddr()), agora);
        if (c.requisicoes() > maxPorJanela) {
            long segundos = Math.max(1, Duration.between(agora, c.inicio().plus(janela)).toSeconds());
            recusar(req, res, segundos);
            return;
        }
        chain.doFilter(req, res);
    }

    private Contagem contar(String chave, Instant agora) {
        Contagem c = contagens.compute(chave, (k, atual) ->
                atual == null || vencida(atual, agora)
                        ? new Contagem(agora, 1)
                        : new Contagem(atual.inicio(), atual.requisicoes() + 1));
        if (contagens.size() > LIMPAR_ACIMA_DE) {
            contagens.values().removeIf(x -> vencida(x, agora));
            if (contagens.size() > MAXIMO_DE_IPS) {
                contagens.clear();
            }
        }
        return c;
    }

    private boolean vencida(Contagem c, Instant agora) {
        return !agora.isBefore(c.inicio().plus(janela));
    }

    // IPv4 inteiro; IPv6 só os primeiros 64 bits (o bloco da casa)
    static String chave(String ip) {
        if (ip == null || !ip.contains(":")) {
            return String.valueOf(ip);
        }
        try {
            // um IP literal não gera consulta de DNS
            byte[] b = InetAddress.getByName(ip).getAddress();
            if (b.length != 16) {
                return ip;
            }
            StringBuilder s = new StringBuilder();
            for (int i = 0; i < 8; i += 2) {
                s.append(String.format("%02x%02x:", b[i], b[i + 1]));
            }
            return s.append(":/64").toString();
        } catch (UnknownHostException e) {
            return ip;
        }
    }

    // mesmo formato JSON do ApiError (o GlobalExceptionHandler não vê o que acontece nos filtros)
    private void recusar(HttpServletRequest req, HttpServletResponse res, long segundos) throws IOException {
        res.setStatus(429);
        res.setHeader(HttpHeaders.RETRY_AFTER, String.valueOf(segundos));
        res.setContentType("application/json;charset=UTF-8");
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
        res.getWriter().write(String.format(
                "{\"timestamp\":\"%s\",\"status\":429,\"error\":\"Too Many Requests\","
                        + "\"message\":\"Requisições demais deste IP. Tente de novo em %d segundos\",\"path\":\"%s\"}",
                timestamp, segundos, req.getRequestURI().replace("\"", "").replace("\\", "")));
    }
}
