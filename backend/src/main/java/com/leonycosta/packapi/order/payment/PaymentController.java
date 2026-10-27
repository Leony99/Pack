package com.leonycosta.packapi.order.payment;

import com.leonycosta.packapi.enums.PaymentStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/orders/{orderId}/payment")
    public PaymentResponse findByOrder(@PathVariable UUID orderId) {
        return paymentService.findByOrder(orderId);
    }

    @PostMapping("/orders/{orderId}/payment")
    @ResponseStatus(HttpStatus.CREATED)
    public PaymentResponse create(@PathVariable UUID orderId, @Valid @RequestBody PaymentRequest request) {
        return paymentService.create(orderId, request);
    }

    @PatchMapping("/payments/{id}/status")
    public PaymentResponse updateStatus(@PathVariable UUID id, @RequestParam PaymentStatus status) {
        return paymentService.updateStatus(id, status);
    }
}
