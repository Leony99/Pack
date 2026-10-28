package com.leonycosta.packapi.product.product_image;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Imagens", description = "Leitura pública; criar, alterar e apagar exige CATALOG_WRITE.")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ProductImageController {

    private final ProductImageService imageService;

    @Operation(summary = "Lista as imagens do produto")
    @GetMapping("/products/{productId}/images")
    public List<ProductImageResponse> findByProduct(@PathVariable UUID productId) {
        return imageService.findByProduct(productId);
    }

    @Operation(summary = "Adiciona uma imagem ao produto")
    @PostMapping("/products/{productId}/images")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductImageResponse create(@PathVariable UUID productId,
                                       @Valid @RequestBody ProductImageRequest request) {
        return imageService.create(productId, request);
    }

    @Operation(summary = "Atualiza uma imagem")
    @PutMapping("/images/{id}")
    public ProductImageResponse update(@PathVariable UUID id, @Valid @RequestBody ProductImageRequest request) {
        return imageService.update(id, request);
    }

    @Operation(summary = "Apaga uma imagem")
    @DeleteMapping("/images/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        imageService.delete(id);
    }
}
