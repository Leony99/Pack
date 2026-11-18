package com.leonycosta.packapi.product.product_image;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;

// As fotos numa pasta do computador, servidas pela própria API em GET /imagens/{produto}/{arquivo}
// (ImagensLocaisController). Só para o desenvolvimento: no Cloud Run, o disco some a cada reinício
public class ArmazenamentoLocal implements ArmazenamentoDeImagens {

    private final Path pasta;
    private final String prefixo;

    public ArmazenamentoLocal(String pasta, String urlPublica) {
        this.pasta = Path.of(pasta).toAbsolutePath().normalize();
        this.prefixo = urlPublica.replaceAll("/+$", "") + "/imagens/";
    }

    @Override
    public String guardar(String nome, byte[] dados, String tipo) {
        try {
            Path arquivo = caminho(nome).orElseThrow();
            Files.createDirectories(arquivo.getParent());
            Files.write(arquivo, dados);
            return prefixo + nome;
        } catch (IOException e) {
            throw new UncheckedIOException("Não foi possível guardar a imagem", e);
        }
    }

    @Override
    public void apagar(String url) {
        if (url == null || !url.startsWith(prefixo)) return;
        caminho(url.substring(prefixo.length())).ifPresent(arquivo -> {
            try {
                Files.deleteIfExists(arquivo);
            } catch (IOException ignorado) {
                // um arquivo que não sai não impede apagar a foto do produto
            }
        });
    }

    // O arquivo de um nome, só dentro da pasta (um nome com ".." não escapa dela)
    public Optional<Path> caminho(String nome) {
        if (!NomeDaImagem.valido(nome)) return Optional.empty();
        Path arquivo = pasta.resolve(nome).normalize();
        return arquivo.startsWith(pasta) ? Optional.of(arquivo) : Optional.empty();
    }
}
