package com.leonycosta.packapi.product.product_image;

import java.util.regex.Pattern;

// O nome de cada foto guardada: <id do produto>/<id aleatório>.<extensão>. Nada que venha do arquivo enviado
// entra no nome, então ele não carrega caminhos nem extensões perigosas
final class NomeDaImagem {

    private static final Pattern FORMATO =
            Pattern.compile("^[0-9a-f-]{36}/[0-9a-f-]{36}\\.(jpg|png|webp|avif)$");

    private NomeDaImagem() {
    }

    static boolean valido(String nome) {
        return nome != null && FORMATO.matcher(nome).matches();
    }
}
