package com.leonycosta.packapi.product.size;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Tamanhos", description = "Leitura pública; criar, alterar e apagar exige CATALOG_WRITE.")
@RestController
@RequestMapping("/api/v1/sizes")
@RequiredArgsConstructor
public class SizeController {

    private final SizeService sizeService;

    @Operation(summary = "Lista os tamanhos")
    @GetMapping
    public List<SizeResponse> findAll() {
        return sizeService.findAll();
    }

    @Operation(summary = "Busca um tamanho")
    @GetMapping("/{id}")
    public SizeResponse findById(@PathVariable UUID id) {
        return sizeService.findById(id);
    }

    @Operation(summary = "Cria um tamanho")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SizeResponse create(@Valid @RequestBody SizeRequest request) {
        return sizeService.create(request);
    }

    @Operation(summary = "Atualiza um tamanho")
    @PutMapping("/{id}")
    public SizeResponse update(@PathVariable UUID id, @Valid @RequestBody SizeRequest request) {
        return sizeService.update(id, request);
    }

    @Operation(summary = "Apaga um tamanho (recusado se estiver em uso)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        sizeService.delete(id);
    }
}
