package com.leonycosta.packapi.product.product_tag;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tags")
@RequiredArgsConstructor
public class ProductTagController {

    private final ProductTagService productTagService;

    @GetMapping
    public List<ProductTagResponse> findAll() {
        return productTagService.findAll();
    }

    @GetMapping("/{id}")
    public ProductTagResponse findById(@PathVariable UUID id) {
        return productTagService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductTagResponse create(@Valid @RequestBody ProductTagRequest request) {
        return productTagService.create(request);
    }

    @PutMapping("/{id}")
    public ProductTagResponse update(@PathVariable UUID id, @Valid @RequestBody ProductTagRequest request) {
        return productTagService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        productTagService.delete(id);
    }
}
