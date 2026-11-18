package com.leonycosta.packapi.product.product_image;

import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClient;

import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

// As fotos no bucket do Cloud Storage, pela API REST dele (sem a biblioteca do Google, que é grande).
// No Cloud Run, a credencial vem do servidor de metadados: é a conta de serviço da API (pack-api-run), que tem
// permissão de gravar só neste bucket. Nenhuma chave fica guardada no projeto.
// O bucket é público para leitura: o site mostra a foto direto de https://storage.googleapis.com/<bucket>/<nome>
public class ArmazenamentoNoBucket implements ArmazenamentoDeImagens {

    private static final String METADADOS =
            "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token";
    // a foto de um endereço nunca muda (um envio novo é um nome novo): o navegador guarda por 1 ano
    private static final String CACHE = "public, max-age=31536000, immutable";

    private final String bucket;
    private final String prefixo;
    private final RestClient http = RestClient.create();
    private volatile String token;
    private volatile Instant tokenValeAte = Instant.EPOCH;

    public ArmazenamentoNoBucket(String bucket) {
        this.bucket = bucket;
        this.prefixo = "https://storage.googleapis.com/" + bucket + "/";
    }

    @Override
    public String guardar(String nome, byte[] dados, String tipo) {
        String limite = "pack" + UUID.randomUUID();
        String metadados = "{\"name\":\"" + nome + "\",\"contentType\":\"" + tipo + "\",\"cacheControl\":\"" + CACHE + "\"}";
        ByteArrayOutputStream corpo = new ByteArrayOutputStream();
        escrever(corpo, "--" + limite + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" + metadados + "\r\n");
        escrever(corpo, "--" + limite + "\r\nContent-Type: " + tipo + "\r\n\r\n");
        corpo.writeBytes(dados);
        escrever(corpo, "\r\n--" + limite + "--");
        http.post()
                .uri("https://storage.googleapis.com/upload/storage/v1/b/" + bucket + "/o?uploadType=multipart")
                .header("Authorization", "Bearer " + token())
                .contentType(MediaType.parseMediaType("multipart/related; boundary=" + limite))
                .body(corpo.toByteArray())
                .retrieve()
                .toBodilessEntity();
        return prefixo + nome;
    }

    @Override
    public void apagar(String url) {
        if (url == null || !url.startsWith(prefixo)) return;
        String nome = url.substring(prefixo.length());
        if (!NomeDaImagem.valido(nome)) return;
        http.delete()
                .uri("https://storage.googleapis.com/storage/v1/b/" + bucket + "/o/"
                        + URLEncoder.encode(nome, StandardCharsets.UTF_8))
                .header("Authorization", "Bearer " + token())
                .retrieve()
                // já apagado: o resultado é o mesmo
                .onStatus(HttpStatusCode::is4xxClientError, (pedido, resposta) -> { })
                .toBodilessEntity();
    }

    // O token de acesso da conta de serviço, guardado até 1 minuto antes de vencer
    @SuppressWarnings("unchecked")
    private String token() {
        if (token == null || Instant.now().isAfter(tokenValeAte)) {
            Map<String, Object> r = http.get().uri(METADADOS).header("Metadata-Flavor", "Google")
                    .retrieve().body(Map.class);
            token = (String) r.get("access_token");
            tokenValeAte = Instant.now().plusSeconds(((Number) r.get("expires_in")).longValue() - 60);
        }
        return token;
    }

    private static void escrever(ByteArrayOutputStream saida, String texto) {
        saida.writeBytes(texto.getBytes(StandardCharsets.UTF_8));
    }
}
