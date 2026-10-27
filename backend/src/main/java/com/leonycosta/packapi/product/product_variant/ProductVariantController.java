package com.leonycosta.packapi.product.product_variant;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ProductVariantController {

    private final ProductVariantService variantService;

    @GetMapping("/products/{productId}/variants")
    public List<ProductVariantResponse> findByProduct(@PathVariable UUID productId) {
        return variantService.findByProduct(productId);
    }

    @PostMapping("/products/{productId}/variants")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductVariantResponse create(@PathVariable UUID productId,
                                         @Valid @RequestBody ProductVariantRequest request) {
        return variantService.create(productId, request);
    }

    // GET /variants/estoque-baixo?limite=5
    @GetMapping("/variants/estoque-baixo")
    public List<ProductVariantResponse> findEstoqueBaixo(@RequestParam(defaultValue = "5") int limite) {
        return variantService.findEstoqueBaixo(limite);
    }

    @GetMapping("/variants/{id}")
    public ProductVariantResponse findById(@PathVariable UUID id) {
        return variantService.findById(id);
    }

    @PutMapping("/variants/{id}")
    public ProductVariantResponse update(@PathVariable UUID id, @Valid @RequestBody ProductVariantRequest request) {
        return variantService.update(id, request);
    }

    @DeleteMapping("/variants/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        variantService.delete(id);
    }
}
