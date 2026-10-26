package com.leonycosta.packapi.product.size;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/sizes")
@RequiredArgsConstructor
public class SizeController {

    private final SizeService sizeService;

    @GetMapping
    public List<SizeResponse> findAll() {
        return sizeService.findAll();
    }

    @GetMapping("/{id}")
    public SizeResponse findById(@PathVariable UUID id) {
        return sizeService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SizeResponse create(@Valid @RequestBody SizeRequest request) {
        return sizeService.create(request);
    }

    @PutMapping("/{id}")
    public SizeResponse update(@PathVariable UUID id, @Valid @RequestBody SizeRequest request) {
        return sizeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        sizeService.delete(id);
    }
}
