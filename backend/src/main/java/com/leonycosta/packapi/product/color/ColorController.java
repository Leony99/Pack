package com.leonycosta.packapi.product.color;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Cores", description = "Leitura pública; criar, alterar e apagar exige CATALOG_WRITE.")
@RestController
@RequestMapping("/api/v1/colors")
@RequiredArgsConstructor
public class ColorController {

    private final ColorService colorService;

    @Operation(summary = "Lista as cores")
    @GetMapping
    public List<ColorResponse> findAll() {
        return colorService.findAll();
    }

    @Operation(summary = "Busca uma cor")
    @GetMapping("/{id}")
    public ColorResponse findById(@PathVariable UUID id) {
        return colorService.findById(id);
    }

    @Operation(summary = "Cria uma cor")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ColorResponse create(@Valid @RequestBody ColorRequest request) {
        return colorService.create(request);
    }

    @Operation(summary = "Atualiza uma cor")
    @PutMapping("/{id}")
    public ColorResponse update(@PathVariable UUID id, @Valid @RequestBody ColorRequest request) {
        return colorService.update(id, request);
    }

    @Operation(summary = "Apaga uma cor (recusado se estiver em uso)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        colorService.delete(id);
    }
}
