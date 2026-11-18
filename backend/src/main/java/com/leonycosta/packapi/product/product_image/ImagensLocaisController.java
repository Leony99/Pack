package com.leonycosta.packapi.product.product_image;

import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Files;
import java.time.Duration;

// Serve as fotos da pasta local (desenvolvimento, sem o bucket). Com o bucket, responde 404: lá, as fotos
// vêm direto do Cloud Storage
@Hidden
@RestController
@RequiredArgsConstructor
public class ImagensLocaisController {

    private final ArmazenamentoDeImagens armazenamento;

    @GetMapping("/imagens/{produto}/{arquivo}")
    public ResponseEntity<byte[]> imagem(@PathVariable String produto, @PathVariable String arquivo) throws IOException {
        if (!(armazenamento instanceof ArmazenamentoLocal local)) return ResponseEntity.notFound().build();
        var caminho = local.caminho(produto + "/" + arquivo);
        if (caminho.isEmpty() || !Files.isRegularFile(caminho.get())) return ResponseEntity.notFound().build();
        byte[] dados = Files.readAllBytes(caminho.get());
        var tipo = TipoDeImagem.doConteudo(dados);
        if (tipo.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(tipo.get().mime))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
                .header("X-Content-Type-Options", "nosniff")
                .body(dados);
    }
}
