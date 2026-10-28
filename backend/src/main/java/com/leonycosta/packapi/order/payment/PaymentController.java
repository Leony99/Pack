package com.leonycosta.packapi.order.payment;

import com.leonycosta.packapi.enums.PaymentStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Pagamentos", description = "O dono do pedido paga e consulta; mudar o status exige ORDER_MANAGE.")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @Operation(summary = "Mostra o pagamento do pedido")
    @GetMapping("/orders/{orderId}/payment")
    public PaymentResponse findByOrder(@PathVariable UUID orderId) {
        return paymentService.findByOrder(orderId);
    }

    @Operation(summary = "Paga o pedido (valor igual ao total)")
    @PostMapping("/orders/{orderId}/payment")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse create(@PathVariable UUID orderId, @Valid @RequestBody PaymentRequest request) {
        return paymentService.create(orderId, request);
    }

    @Operation(summary = "Muda o status do pagamento (APROVADO marca o pedido como pago)")
    @PatchMapping("/payments/{id}/status")
    public PaymentResponse updateStatus(@PathVariable UUID id, @RequestParam PaymentStatus status) {
        return paymentService.updateStatus(id, status);
    }
}
