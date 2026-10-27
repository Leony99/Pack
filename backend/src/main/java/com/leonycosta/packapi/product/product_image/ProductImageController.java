package com.leonycosta.packapi.product.product_image;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ProductImageController {

    private final ProductImageService imageService;

    @GetMapping("/products/{productId}/images")
    public List<ProductImageResponse> findByProduct(@PathVariable UUID productId) {
        return imageService.findByProduct(productId);
    }

    @PostMapping("/products/{productId}/images")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductImageResponse create(@PathVariable UUID productId,
                                       @Valid @RequestBody ProductImageRequest request) {
        return imageService.create(productId, request);
    }

    @PutMapping("/images/{id}")
    public ProductImageResponse update(@PathVariable UUID id, @Valid @RequestBody ProductImageRequest request) {
        return imageService.update(id, request);
    }

    @DeleteMapping("/images/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        imageService.delete(id);
    }
}
