package com.leonycosta.packapi.auth;

import com.leonycosta.packapi.exception.MuitasTentativasException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

// Limite de tentativas no login e no cadastro, contra adivinhação de senha e contra quem tenta
// gastar a CPU (o BCrypt é lento de propósito) até o disjuntor de custos tirar a API do ar.
// Também limita os códigos de cupom errados no checkout, contra quem tenta adivinhar um código.
//
// No login, dois contadores ao mesmo tempo; vale o que estourar primeiro:
//   - e-mail + IP: 5 senhas erradas daquele e-mail, vindas daquele IP → bloqueia esse par por 15 min
//   - IP:         20 falhas de login (qualquer e-mail) ou cadastros → bloqueia o IP inteiro por 15 min
// Bloqueado, a resposta é 429 com o cabeçalho Retry-After (segundos que faltam), antes de rodar o BCrypt.
// Um login certo zera só o contador do par: quem tem uma conta válida não "limpa" o contador do IP.
//
// No checkout: 5 cupons errados (inexistentes ou vencidos) do mesmo cliente → esse cliente fica 15 min sem
// poder usar cupom (429). O contador é por cliente, porque o checkout exige login. Acertar um cupom não zera:
// senão bastaria intercalar um código válido conhecido entre os chutes.
//
// Fica na memória da aplicação: basta porque o Cloud Run roda no máximo 1 instância.
// Se a instância reinicia, os contadores recomeçam do zero.
@Component
public class LimiteDeTentativas {

    // limpeza: acima deste número de contadores guardados, os que já venceram são apagados
    private static final int LIMPAR_ACIMA_DE = 10_000;

    private final int maxPorEmailEIp;
    private final int maxPorIp;
    private final int maxCuponsErrados;
    private final Duration janela;
    private final Clock relogio;
    private final Map<String, Contador> contadores = new ConcurrentHashMap<>();

    // falhas: quantas desde a primeira da janela; bloqueadoAte: null enquanto não estourou
    private record Contador(int falhas, Instant inicio, Instant bloqueadoAte) {
    }

    @Autowired
    public LimiteDeTentativas(@Value("${app.login.max-falhas-email-ip}") int maxPorEmailEIp,
                              @Value("${app.login.max-falhas-ip}") int maxPorIp,
                              @Value("${app.cupom.max-erros}") int maxCuponsErrados,
                              @Value("${app.login.bloqueio-minutos}") long minutos) {
        this(maxPorEmailEIp, maxPorIp, maxCuponsErrados, Duration.ofMinutes(minutos), Clock.systemUTC());
    }

    // usado nos testes, com um relógio que dá para avançar
    LimiteDeTentativas(int maxPorEmailEIp, int maxPorIp, int maxCuponsErrados, Duration janela, Clock relogio) {
        this.maxPorEmailEIp = maxPorEmailEIp;
        this.maxPorIp = maxPorIp;
        this.maxCuponsErrados = maxCuponsErrados;
        this.janela = janela;
        this.relogio = relogio;
    }

    // ------------------------------------------------------------------ chamado pelo AuthService

    // Antes do login: lança 429 se o IP ou o par e-mail + IP estiverem bloqueados
    public void verificarLogin(String ip, String email) {
        verificar(chaveIp(ip));
        verificar(chavePar(ip, email));
    }

    public void loginFalhou(String ip, String email) {
        contar(chaveIp(ip), maxPorIp);
        contar(chavePar(ip, email), maxPorEmailEIp);
    }

    public void loginCerto(String ip, String email) {
        contadores.remove(chavePar(ip, email));
    }

    // Cadastro: cada tentativa conta no contador do IP (cada uma roda o BCrypt e cria dados no banco)
    public void verificarECadastrar(String ip) {
        verificar(chaveIp(ip));
        contar(chaveIp(ip), maxPorIp);
    }

    // ------------------------------------------------------------------ chamado pelo OrderService

    // Antes de procurar o cupom: lança 429 se o cliente errou cupons demais
    public void verificarCupom(UUID clienteId) {
        verificar(chaveCupom(clienteId));
    }

    public void cupomErrado(UUID clienteId) {
        contar(chaveCupom(clienteId), maxCuponsErrados);
    }

    // ------------------------------------------------------------------ contadores

    private void verificar(String chave) {
        Contador c = contadores.get(chave);
        Instant agora = relogio.instant();
        if (c != null && c.bloqueadoAte() != null && agora.isBefore(c.bloqueadoAte())) {
            long segundos = Math.max(1, Duration.between(agora, c.bloqueadoAte()).toSeconds());
            throw new MuitasTentativasException(segundos);
        }
    }

    private void contar(String chave, int max) {
        Instant agora = relogio.instant();
        contadores.compute(chave, (k, c) -> {
            if (c == null || vencido(c, agora)) {
                c = new Contador(0, agora, null);
            }
            int falhas = c.falhas() + 1;
            Instant bloqueio = falhas >= max ? agora.plus(janela) : c.bloqueadoAte();
            return new Contador(falhas, c.inicio(), bloqueio);
        });
        if (contadores.size() > LIMPAR_ACIMA_DE) {
            contadores.values().removeIf(c -> vencido(c, agora));
        }
    }

    // a janela de 15 min acabou e não há bloqueio valendo: o contador recomeça
    private boolean vencido(Contador c, Instant agora) {
        boolean janelaAcabou = !agora.isBefore(c.inicio().plus(janela));
        boolean semBloqueio = c.bloqueadoAte() == null || !agora.isBefore(c.bloqueadoAte());
        return janelaAcabou && semBloqueio;
    }

    private static String chaveIp(String ip) {
        return "ip:" + ip;
    }

    private static String chaveCupom(UUID clienteId) {
        return "cupom:" + clienteId;
    }

    private static String chavePar(String ip, String email) {
        return "par:" + ip + "|" + (email == null ? "" : email.toLowerCase());
    }
}
