package com.leonycosta.packapi.product.product_variant;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Variantes", description = "Variações de um produto: SKU, tamanho, cor, preço e estoque. Leitura pública; criar, alterar e apagar exige CATALOG_WRITE. Estoque baixo exige INVENTORY_MANAGE.")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ProductVariantController {

    private final ProductVariantService variantService;

    @Operation(summary = "Lista as variantes do produto")
    @GetMapping("/products/{productId}/variants")
    public List<ProductVariantResponse> findByProduct(@PathVariable UUID productId) {
        return variantService.findByProduct(productId);
    }

    @Operation(summary = "Cria uma variante do produto")
    @PostMapping("/products/{productId}/variants")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductVariantResponse create(@PathVariable UUID productId,
                                         @Valid @RequestBody ProductVariantRequest request) {
        return variantService.create(productId, request);
    }

    // GET /variants/estoque-baixo?limite=5
    @Operation(summary = "Lista as variantes com estoque abaixo do limite")
    @GetMapping("/variants/estoque-baixo")
    public List<ProductVariantResponse> findEstoqueBaixo(@RequestParam(defaultValue = "5") int limite) {
        return variantService.findEstoqueBaixo(limite);
    }

    @Operation(summary = "Busca uma variante")
    @GetMapping("/variants/{id}")
    public ProductVariantResponse findById(@PathVariable UUID id) {
        return variantService.findById(id);
    }

    @Operation(summary = "Atualiza uma variante")
    @PutMapping("/variants/{id}")
    public ProductVariantResponse update(@PathVariable UUID id, @Valid @RequestBody ProductVariantRequest request) {
        return variantService.update(id, request);
    }

    @Operation(summary = "Apaga uma variante")
    @DeleteMapping("/variants/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        variantService.delete(id);
    }
}
