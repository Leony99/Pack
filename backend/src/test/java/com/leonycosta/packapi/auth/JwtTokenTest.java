package com.leonycosta.packapi.auth;

import com.leonycosta.packapi.support.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import tools.jackson.core.type.TypeReference;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

// O token JWT por dentro. Um token tem 3 partes separadas por ponto:
//
//   cabeçalho . payload . assinatura
//   {"alg":"HS256"} . {"sub":"<id>","tipo":"CUSTOMER",...} . HMAC-SHA256(cabeçalho.payload, jwt.secret)
//
// Cabeçalho e payload são só Base64 (qualquer um lê). Quem garante que ninguém mexeu é a assinatura,
// que só pode ser calculada por quem tem a chave. Aqui os testes montam tokens à mão para mostrar isso.
class JwtTokenTest extends IntegrationTest {

    private static final Base64.Encoder B64 = Base64.getUrlEncoder().withoutPadding();

    // ------------------------------------------------------------------ o que tem dentro

    @Test
    void payloadEhSoBase64QualquerUmLe() {
        Cliente ana = novoCliente();

        String[] partes = ana.token().split("\\.");
        Map<String, Object> payload = lerJson(partes[1]);

        assertThat(partes).hasSize(3);
        assertThat(payload).containsEntry("sub", ana.id()).containsEntry("tipo", "CUSTOMER");
        assertThat(payload.get("authorities")).isEqualTo(List.of("CUSTOMER"));
    }

    @Test
    void payloadNaoCarregaASenha() {
        Cliente ana = novoCliente();

        Map<String, Object> payload = lerJson(ana.token().split("\\.")[1]);

        assertThat(payload.keySet()).noneMatch(campo -> campo.toLowerCase().contains("senha"));
        assertThat(payload.values()).doesNotContain(ana.senha());
    }

    @Test
    void tokenVenceEm60Minutos() {
        Map<String, Object> payload = lerJson(novoCliente().token().split("\\.")[1]);

        long exp = ((Number) payload.get("exp")).longValue();
        long esperado = Instant.now().plus(60, ChronoUnit.MINUTES).getEpochSecond();

        assertThat(exp).isCloseTo(esperado, within(60L));
    }

    // ------------------------------------------------------------------ tentativas de enganar a API

    @Test
    void trocarOPayloadInvalidaAAssinatura() {
        Cliente ana = novoCliente();
        Cliente bruno = novoCliente();
        String[] partes = ana.token().split("\\.");

        // mesmo cabeçalho e assinatura da Ana, mas o payload diz que é o Bruno
        String adulterado = partes[0] + "." + json(payloadDe(bruno.id(), 600)) + "." + partes[2];

        get(bruno.carrinho(), adulterado).esperar(401);
    }

    @Test
    void tokenAssinadoComOutraChave() {
        Cliente bruno = novoCliente();

        String falso = assinar(payloadDe(bruno.id(), 600), "uma-chave-qualquer-com-mais-de-32-caracteres");

        get(bruno.carrinho(), falso).esperar(401);
    }

    @Test
    void tokenSemAssinatura() {
        // "alg: none" é um ataque clássico: o token diz que não precisa de assinatura
        Cliente bruno = novoCliente();

        String semAssinatura = json(Map.of("alg", "none")) + "." + json(payloadDe(bruno.id(), 600)) + ".";

        get(bruno.carrinho(), semAssinatura).esperar(401);
    }

    @Test
    void tokenFabricadoComAChaveCertaEhAceito() {
        // por isso o jwt.secret é segredo: quem tem a chave consegue se passar por qualquer usuário
        Cliente bruno = novoCliente();

        String fabricado = assinar(payloadDe(bruno.id(), 600), JWT_SECRET);

        get(bruno.carrinho(), fabricado).esperar(200);
    }

    @Test
    void tokenVencidoMesmoComAChaveCerta() {
        Cliente bruno = novoCliente();

        // venceu há 1 hora (o Spring tolera até 60 s de diferença de relógio)
        String vencido = assinar(payloadDe(bruno.id(), -3600), JWT_SECRET);

        get(bruno.carrinho(), vencido).esperar(401);
    }

    @Test
    void textoQualquerNoLugarDoToken() {
        get(novoCliente().carrinho(), "abc.def.ghi").esperar(401);
    }

    @Test
    void cabecalhoSemOPrefixoBearer() {
        Cliente ana = novoCliente();

        // Authorization: <token>, faltando o "Bearer " na frente
        executar(MockMvcRequestBuilders.get("/api/v1/auth/me").header("Authorization", ana.token())).esperar(401);
    }

    // ------------------------------------------------------------------ montando tokens à mão

    // O mesmo payload que o TokenService gera, para o cliente `id`, vencendo daqui a `segundos`
    private static Map<String, Object> payloadDe(String id, long segundos) {
        long agora = Instant.now().getEpochSecond();
        return Map.of("iss", "pack-api", "sub", id, "tipo", "CUSTOMER", "authorities", List.of("CUSTOMER"),
                "iat", agora - 60, "exp", agora + segundos);
    }

    // cabeçalho.payload assinados com HMAC-SHA256, igual ao NimbusJwtEncoder do JwtConfig
    private String assinar(Map<String, Object> payload, String chave) {
        String conteudo = json(Map.of("alg", "HS256")) + "." + json(payload);
        try {
            Mac hmac = Mac.getInstance("HmacSHA256");
            hmac.init(new SecretKeySpec(chave.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return conteudo + "." + B64.encodeToString(hmac.doFinal(conteudo.getBytes(StandardCharsets.US_ASCII)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private String json(Map<String, Object> valor) {
        return B64.encodeToString(super.json.writeValueAsBytes(valor));
    }

    private Map<String, Object> lerJson(String base64) {
        return super.json.readValue(Base64.getUrlDecoder().decode(base64), new TypeReference<>() { });
    }
}
