package com.leonycosta.packapi.product.product_image;

import com.leonycosta.packapi.exception.ResourceNotFoundException;
import com.leonycosta.packapi.product.product.Product;
import com.leonycosta.packapi.product.product.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductImageService {

    private final ProductImageRepository imageRepository;
    private final ProductService productService;
    private final ArmazenamentoDeImagens armazenamento;

    // o painel reduz a foto antes de enviar (até 1600 px, em WebP); este é o limite para qualquer envio
    public static final int MAXIMO_DE_BYTES = 5 * 1024 * 1024;

    // Foto enviada pelo painel: confere o tipo pelos primeiros bytes e o tamanho, guarda (bucket ou pasta local) e
    // cria a imagem do produto com o endereço público. Sem ordem, vai para o fim da galeria
    @org.springframework.transaction.annotation.Transactional
    public ProductImageResponse upload(UUID productId, byte[] dados, Integer ordem) {
        Product product = productService.findEntityById(productId);
        if (dados == null || dados.length == 0 || dados.length > MAXIMO_DE_BYTES) {
            throw new com.leonycosta.packapi.exception.ParametroInvalidoException("A foto precisa ter até 5 MB");
        }
        TipoDeImagem tipo = TipoDeImagem.doConteudo(dados).orElseThrow(() ->
                new com.leonycosta.packapi.exception.ParametroInvalidoException("Envie uma foto em JPEG, PNG, WebP ou AVIF"));
        String nome = productId + "/" + UUID.randomUUID() + "." + tipo.extensao;
        String url = armazenamento.guardar(nome, dados, tipo.mime);
        ProductImage image = new ProductImage();
        image.setProduct(product);
        image.setUrl(url);
        image.setOrdem(ordem != null ? ordem : imageRepository.findByProductIdOrderByOrdem(productId).size());
        return toResponse(imageRepository.save(image));
    }

    public List<ProductImageResponse> findByProduct(UUID productId) {
        return imageRepository.findByProductIdOrderByOrdem(productId).stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductImageResponse create(UUID productId, ProductImageRequest request) {
        Product product = productService.findEntityById(productId);
        ProductImage image = new ProductImage();
        image.setProduct(product);
        image.setUrl(request.getUrl());
        image.setOrdem(request.getOrdem());
        return toResponse(imageRepository.save(image));
    }

    public ProductImageResponse update(UUID id, ProductImageRequest request) {
        ProductImage image = findOrThrow(id);
        image.setUrl(request.getUrl());
        image.setOrdem(request.getOrdem());
        return toResponse(imageRepository.save(image));
    }

    // Apaga a imagem e, se a foto foi enviada pelo painel, o arquivo dela
    public void delete(UUID id) {
        ProductImage image = findOrThrow(id);
        imageRepository.deleteById(id);
        armazenamento.apagar(image.getUrl());
    }

    private ProductImage findOrThrow(UUID id) {
        return imageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Imagem", id));
    }

    private ProductImageResponse toResponse(ProductImage image) {
        return new ProductImageResponse(image.getId(), image.getUrl(), image.getOrdem());
    }
}
