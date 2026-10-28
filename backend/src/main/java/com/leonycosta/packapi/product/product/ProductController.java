package com.leonycosta.packapi.product.product;

import com.leonycosta.packapi.product.product_tag_link.ProductTagLinkRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Produtos", description = "Leitura pública; criar, alterar e apagar exige CATALOG_WRITE.")
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // GET /products, /products?nome=camiseta ou /products?tag=verao
    @Operation(summary = "Lista os produtos, com filtro opcional por nome ou tag")
    @GetMapping
    public List<ProductResponse> findAll(@RequestParam(required = false) String nome,
                                         @RequestParam(required = false) String tag) {
        if (tag != null && !tag.isBlank()) {
            return productService.findByTag(tag);
        }
        if (nome != null && !nome.isBlank()) {
            return productService.search(nome);
        }
        return productService.findAll();
    }

    @Operation(summary = "Busca um produto")
    @GetMapping("/{id}")
    public ProductResponse findById(@PathVariable UUID id) {
        return productService.findById(id);
    }

    @Operation(summary = "Busca um produto pelo slug")
    @GetMapping("/slug/{slug}")
    public ProductResponse findBySlug(@PathVariable String slug) {
        return productService.findBySlug(slug);
    }

    @Operation(summary = "Cria um produto (o slug é gerado do nome)")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @Operation(summary = "Atualiza um produto")
    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @Operation(summary = "Apaga um produto (recusado se já foi vendido)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        productService.delete(id);
    }

    @Operation(summary = "Adiciona uma tag ao produto")
    @PostMapping("/{id}/tags")
    public ProductResponse addTag(@PathVariable UUID id, @Valid @RequestBody ProductTagLinkRequest request) {
        return productService.addTag(id, request.getTagId());
    }

    @Operation(summary = "Remove uma tag do produto")
    @DeleteMapping("/{id}/tags/{tagId}")
    public ProductResponse removeTag(@PathVariable UUID id, @PathVariable UUID tagId) {
        return productService.removeTag(id, tagId);
    }
}
