package com.leonycosta.packapi.order.order;

import com.leonycosta.packapi.enums.OrderStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping("/customers/{customerId}/orders")
    public List<OrderResponse> findByCustomer(@PathVariable UUID customerId) {
        return orderService.findByCustomer(customerId);
    }

    // Checkout: transforma o carrinho do cliente em pedido
    @PostMapping("/customers/{customerId}/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse checkout(@PathVariable UUID customerId, @Valid @RequestBody OrderRequest request) {
        return orderService.checkout(customerId, request);
    }

    @GetMapping("/orders/{id}")
    public OrderResponse findById(@PathVariable UUID id) {
        return orderService.findById(id);
    }

    @PatchMapping("/orders/{id}/status")
    public OrderResponse updateStatus(@PathVariable UUID id, @RequestParam OrderStatus status) {
        return orderService.updateStatus(id, status);
    }
}
