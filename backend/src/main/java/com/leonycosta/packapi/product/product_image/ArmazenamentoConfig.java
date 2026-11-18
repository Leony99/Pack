package com.leonycosta.packapi.product.product_image;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Com app.imagens.bucket (a variável IMAGENS_BUCKET, na produção), as fotos vão para o bucket do Cloud Storage.
// Sem ele, ficam na pasta app.imagens.pasta e a própria API as serve em /imagens/... (desenvolvimento e testes)
@Configuration
public class ArmazenamentoConfig {

    @Bean
    ArmazenamentoDeImagens armazenamentoDeImagens(@Value("${app.imagens.bucket:}") String bucket,
                                                  @Value("${app.imagens.pasta:uploads}") String pasta,
                                                  @Value("${app.imagens.url-publica:http://localhost:8080}") String urlPublica) {
        return bucket.isBlank() ? new ArmazenamentoLocal(pasta, urlPublica) : new ArmazenamentoNoBucket(bucket);
    }
}
