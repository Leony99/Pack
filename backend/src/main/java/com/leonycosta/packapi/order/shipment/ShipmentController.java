package com.leonycosta.packapi.order.shipment;

import com.leonycosta.packapi.enums.ShipmentStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Envios", description = "Envio de pedidos pagos. O dono do pedido consulta; o resto exige ORDER_MANAGE.")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ShipmentController {

    private final ShipmentService shipmentService;

    @Operation(summary = "Mostra o envio do pedido")
    @GetMapping("/orders/{orderId}/shipment")
    public ShipmentResponse findByOrder(@PathVariable UUID orderId) {
        return shipmentService.findByOrder(orderId);
    }

    @Operation(summary = "Cria o envio de um pedido pago")
    @PostMapping("/orders/{orderId}/shipment")
    @ResponseStatus(HttpStatus.CREATED)
    public ShipmentResponse create(@PathVariable UUID orderId, @Valid @RequestBody ShipmentRequest request) {
        return shipmentService.create(orderId, request);
    }

    @Operation(summary = "Muda o status do envio")
    @PatchMapping("/shipments/{id}/status")
    public ShipmentResponse updateStatus(@PathVariable UUID id, @RequestParam ShipmentStatus status) {
        return shipmentService.updateStatus(id, status);
    }

    @Operation(summary = "Informa o código de rastreio")
    @PatchMapping("/shipments/{id}/rastreio")
    public ShipmentResponse updateRastreio(@PathVariable UUID id, @RequestParam String codigo) {
        return shipmentService.updateRastreio(id, codigo);
    }
}
