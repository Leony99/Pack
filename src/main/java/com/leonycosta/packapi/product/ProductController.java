package com.leonycosta.packapi.product;

import com.leonycosta.packapi.product.product_tag_link.ProductTagLinkRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // GET /products, /products?nome=camiseta ou /products?tag=verao
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

    @GetMapping("/{id}")
    public ProductResponse findById(@PathVariable UUID id) {
        return productService.findById(id);
    }

    @GetMapping("/slug/{slug}")
    public ProductResponse findBySlug(@PathVariable String slug) {
        return productService.findBySlug(slug);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse create(@Valid @RequestBody ProductRequest request) {
        return productService.create(request);
    }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable UUID id, @Valid @RequestBody ProductRequest request) {
        return productService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        productService.delete(id);
    }

    @PostMapping("/{id}/tags")
    public ProductResponse addTag(@PathVariable UUID id, @Valid @RequestBody ProductTagLinkRequest request) {
        return productService.addTag(id, request.getTagId());
    }

    @DeleteMapping("/{id}/tags/{tagId}")
    public ProductResponse removeTag(@PathVariable UUID id, @PathVariable UUID tagId) {
        return productService.removeTag(id, tagId);
    }
}
