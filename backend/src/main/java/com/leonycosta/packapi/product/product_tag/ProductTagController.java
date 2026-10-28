package com.leonycosta.packapi.product.product_tag;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Tags", description = "Tags de categoria dos produtos. Leitura pública; criar, alterar e apagar exige CATALOG_WRITE.")
@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
public class ProductTagController {

    private final ProductTagService productTagService;

    @Operation(summary = "Lista as tags")
    @GetMapping
    public List<ProductTagResponse> findAll() {
        return productTagService.findAll();
    }

    @Operation(summary = "Busca uma tag")
    @GetMapping("/{id}")
    public ProductTagResponse findById(@PathVariable UUID id) {
        return productTagService.findById(id);
    }

    @Operation(summary = "Cria uma tag")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductTagResponse create(@Valid @RequestBody ProductTagRequest request) {
        return productTagService.create(request);
    }

    @Operation(summary = "Atualiza uma tag")
    @PutMapping("/{id}")
    public ProductTagResponse update(@PathVariable UUID id, @Valid @RequestBody ProductTagRequest request) {
        return productTagService.update(id, request);
    }

    @Operation(summary = "Apaga uma tag (os produtos continuam, só perdem a tag)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        productTagService.delete(id);
    }
}
