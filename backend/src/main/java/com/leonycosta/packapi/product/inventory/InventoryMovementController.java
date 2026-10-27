package com.leonycosta.packapi.product.inventory;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class InventoryMovementController {

    private final InventoryMovementService inventoryService;

    @GetMapping("/variants/{variantId}/movements")
    public List<InventoryMovementResponse> findByVariant(@PathVariable UUID variantId) {
        return inventoryService.findByVariant(variantId);
    }

    @PostMapping("/inventory/movements")
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryMovementResponse register(@Valid @RequestBody InventoryMovementRequest request) {
        return inventoryService.register(request);
    }
}
