package com.leonycosta.packapi.product.product_image;

// Onde as fotos enviadas pelo painel ficam guardadas: no bucket do Cloud Storage (produção) ou numa pasta local
// (desenvolvimento e testes). Ver ArmazenamentoConfig
public interface ArmazenamentoDeImagens {

    // Guarda o arquivo e devolve o endereço público dele (o que vai no ProductImage.url)
    String guardar(String nome, byte[] dados, String tipo);

    // Apaga o arquivo de um endereço guardado aqui; endereços de fora (fotos por link) são ignorados
    void apagar(String url);
}
