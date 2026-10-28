package com.leonycosta.packapi.cart.cart;

import com.leonycosta.packapi.cart.cart_item.CartItemRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Carrinho", description = "Carrinho do cliente. Só o próprio cliente acessa.")
@RestController
@RequestMapping("/api/v1/customers/{customerId}/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @Operation(summary = "Mostra o carrinho com itens e total")
    @GetMapping
    public CartResponse findByCustomer(@PathVariable UUID customerId) {
        return cartService.findByCustomer(customerId);
    }

    @Operation(summary = "Adiciona uma variante ao carrinho (soma se já estiver lá)")
    @PostMapping("/items")
    public CartResponse addItem(@PathVariable UUID customerId, @Valid @RequestBody CartItemRequest request) {
        return cartService.addItem(customerId, request);
    }

    @Operation(summary = "Remove um item do carrinho")
    @DeleteMapping("/items/{itemId}")
    public CartResponse removeItem(@PathVariable UUID customerId, @PathVariable UUID itemId) {
        return cartService.removeItem(customerId, itemId);
    }

    @Operation(summary = "Esvazia o carrinho")
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clear(@PathVariable UUID customerId) {
        cartService.clear(customerId);
    }
}
