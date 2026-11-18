package com.leonycosta.packapi.product.product_image;

import java.util.Optional;

// O tipo real do arquivo, pelos primeiros bytes (a "assinatura"), e não pelo nome nem pelo Content-Type que o
// navegador manda: um HTML com nome .jpg é recusado
enum TipoDeImagem {
    JPEG("image/jpeg", "jpg"),
    PNG("image/png", "png"),
    WEBP("image/webp", "webp"),
    AVIF("image/avif", "avif");

    final String mime;
    final String extensao;

    TipoDeImagem(String mime, String extensao) {
        this.mime = mime;
        this.extensao = extensao;
    }

    static Optional<TipoDeImagem> doConteudo(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) return Optional.of(JPEG);
        if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') return Optional.of(PNG);
        if (b.length >= 12 && texto(b, 0, 4).equals("RIFF") && texto(b, 8, 4).equals("WEBP")) return Optional.of(WEBP);
        if (b.length >= 12 && texto(b, 4, 4).equals("ftyp") && texto(b, 8, 4).startsWith("avi")) return Optional.of(AVIF);
        return Optional.empty();
    }

    private static String texto(byte[] b, int inicio, int tamanho) {
        return new String(b, inicio, tamanho, java.nio.charset.StandardCharsets.US_ASCII);
    }
}
