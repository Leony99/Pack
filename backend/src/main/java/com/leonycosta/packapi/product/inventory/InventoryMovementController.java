package com.leonycosta.packapi.product.inventory;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Estoque", description = "Entradas, saídas e ajustes de estoque, todos registrados. Exige INVENTORY_MANAGE.")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class InventoryMovementController {

    private final InventoryMovementService inventoryService;

    @Operation(summary = "Histórico de movimentos de uma variante")
    @GetMapping("/variants/{variantId}/movements")
    public List<InventoryMovementResponse> findByVariant(@PathVariable UUID variantId) {
        return inventoryService.findByVariant(variantId);
    }

    @Operation(summary = "Registra uma entrada, saída ou ajuste")
    @PostMapping("/inventory/movements")
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryMovementResponse register(@Valid @RequestBody InventoryMovementRequest request) {
        return inventoryService.register(request);
    }
}
