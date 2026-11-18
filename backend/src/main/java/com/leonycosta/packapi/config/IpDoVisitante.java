package com.leonycosta.packapi.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.regex.Pattern;

// O IP real do visitante da loja. O navegador fala com o servidor do frontend (BFF), e é ele quem chama a API:
// sem isto, todos os visitantes chegariam com o IP do servidor do frontend e dividiriam os limites por IP
// (LimitePorIp, cadastro, newsletter, contato).
// O frontend manda o IP do visitante em X-Pack-Ip-Visitante junto com a chave combinada em X-Pack-Bff-Chave
// (app.bff.chave, a variável BFF_CHAVE). Só com a chave certa o IP informado passa a valer; quem chama a API
// direto, sem a chave, continua contado pelo próprio IP e não consegue fingir ser outro.
// Roda antes de todos os outros filtros (o limite por IP e a segurança já veem o IP do visitante).
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class IpDoVisitante extends OncePerRequestFilter {

    static final String CABECALHO_IP = "X-Pack-Ip-Visitante";
    static final String CABECALHO_CHAVE = "X-Pack-Bff-Chave";

    // IPv4 (1.2.3.4) ou IPv6 (só números hexadecimais, ":" e "."): nada de nomes, que fariam uma consulta de DNS
    private static final Pattern IPV4 = Pattern.compile("^(25[0-5]|2[0-4]\\d|1?\\d?\\d)(\\.(25[0-5]|2[0-4]\\d|1?\\d?\\d)){3}$");
    private static final Pattern IPV6 = Pattern.compile("^[0-9a-fA-F:.]{2,45}$");

    private final byte[] chave;

    public IpDoVisitante(@Value("${app.bff.chave:}") String chave) {
        this.chave = chave.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String ip = req.getHeader(CABECALHO_IP);
        chain.doFilter(chaveConfere(req.getHeader(CABECALHO_CHAVE)) && ipValido(ip) ? comIp(req, ip.strip()) : req, res);
    }

    // Comparação em tempo constante: o tempo da resposta não dá pistas da chave. Sem chave configurada
    // (BFF_CHAVE vazia), o recurso fica desligado
    private boolean chaveConfere(String recebida) {
        return chave.length > 0 && recebida != null
                && MessageDigest.isEqual(chave, recebida.getBytes(StandardCharsets.UTF_8));
    }

    static boolean ipValido(String ip) {
        if (ip == null) return false;
        String limpo = ip.strip();
        return IPV4.matcher(limpo).matches() || (limpo.contains(":") && IPV6.matcher(limpo).matches());
    }

    private static HttpServletRequest comIp(HttpServletRequest req, String ip) {
        return new HttpServletRequestWrapper(req) {
            @Override
            public String getRemoteAddr() {
                return ip;
            }

            @Override
            public String getRemoteHost() {
                return ip;
            }
        };
    }
}
