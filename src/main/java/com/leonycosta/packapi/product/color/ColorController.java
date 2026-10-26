package com.leonycosta.packapi.product.color;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/colors")
@RequiredArgsConstructor
public class ColorController {

    private final ColorService colorService;

    @GetMapping
    public List<ColorResponse> findAll() {
        return colorService.findAll();
    }

    @GetMapping("/{id}")
    public ColorResponse findById(@PathVariable UUID id) {
        return colorService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ColorResponse create(@Valid @RequestBody ColorRequest request) {
        return colorService.create(request);
    }

    @PutMapping("/{id}")
    public ColorResponse update(@PathVariable UUID id, @Valid @RequestBody ColorRequest request) {
        return colorService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        colorService.delete(id);
    }
}
