package com.leonycosta.packapi.order.order;

import com.leonycosta.packapi.enums.OrderStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Pedidos", description = "O cliente fecha e consulta os próprios pedidos; mudar o status exige ORDER_MANAGE.")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @Operation(summary = "Lista os pedidos do cliente")
    @GetMapping("/customers/{customerId}/orders")
    public List<OrderResponse> findByCustomer(@PathVariable UUID customerId) {
        return orderService.findByCustomer(customerId);
    }

    // Checkout: transforma o carrinho do cliente em pedido
    @Operation(summary = "Fecha o pedido com o carrinho (baixa o estoque e aplica o cupom)")
    @PostMapping("/customers/{customerId}/orders")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse checkout(@PathVariable UUID customerId, @Valid @RequestBody OrderRequest request) {
        return orderService.checkout(customerId, request);
    }

    @Operation(summary = "Busca um pedido")
    @GetMapping("/orders/{id}")
    public OrderResponse findById(@PathVariable UUID id) {
        return orderService.findById(id);
    }

    @Operation(summary = "Muda o status do pedido (cancelar devolve o estoque)")
    @PatchMapping("/orders/{id}/status")
    public OrderResponse updateStatus(@PathVariable UUID id, @RequestParam OrderStatus status) {
        return orderService.updateStatus(id, status);
    }
}
