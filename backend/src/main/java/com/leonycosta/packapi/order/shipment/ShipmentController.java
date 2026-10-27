package com.leonycosta.packapi.order.shipment;

import com.leonycosta.packapi.enums.ShipmentStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentService shipmentService;

    @GetMapping("/orders/{orderId}/shipment")
    public ShipmentResponse findByOrder(@PathVariable UUID orderId) {
        return shipmentService.findByOrder(orderId);
    }

    @PostMapping("/orders/{orderId}/shipment")
    @ResponseStatus(HttpStatus.CREATED)
    public ShipmentResponse create(@PathVariable UUID orderId, @Valid @RequestBody ShipmentRequest request) {
        return shipmentService.create(orderId, request);
    }

    @PatchMapping("/shipments/{id}/status")
    public ShipmentResponse updateStatus(@PathVariable UUID id, @RequestParam ShipmentStatus status) {
        return shipmentService.updateStatus(id, status);
    }

    @PatchMapping("/shipments/{id}/rastreio")
    public ShipmentResponse updateRastreio(@PathVariable UUID id, @RequestParam String codigo) {
        return shipmentService.updateRastreio(id, codigo);
    }
}
