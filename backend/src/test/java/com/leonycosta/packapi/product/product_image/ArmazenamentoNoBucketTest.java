package com.leonycosta.packapi.product.product_image;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

// O endereço do arquivo na API do Cloud Storage: a "/" do nome vai codificada uma vez só. Codificada duas vezes
// ("%252F"), o Google responde 404 e a foto de um produto apagado fica sobrando no bucket.
class ArmazenamentoNoBucketTest {

    @Test
    void nomeDoArquivoCodificadoUmaVezSo() {
        String nome = "0a1b2c3d-0000-4000-8000-000000000001/0a1b2c3d-0000-4000-8000-000000000002.webp";

        var endereco = ArmazenamentoNoBucket.enderecoDoObjeto("pack-fotos", nome);

        assertThat(endereco.toString()).isEqualTo("https://storage.googleapis.com/storage/v1/b/pack-fotos/o/"
                + "0a1b2c3d-0000-4000-8000-000000000001%2F0a1b2c3d-0000-4000-8000-000000000002.webp");
        assertThat(endereco.toString()).doesNotContain("%25");
    }
}
