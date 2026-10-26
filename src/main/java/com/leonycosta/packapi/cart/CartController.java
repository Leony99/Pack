package com.leonycosta.packapi.cart;

import com.leonycosta.packapi.cart.cart_item.CartItemRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customers/{customerId}/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public CartResponse findByCustomer(@PathVariable UUID customerId) {
        return cartService.findByCustomer(customerId);
    }

    @PostMapping("/items")
    public CartResponse addItem(@PathVariable UUID customerId, @Valid @RequestBody CartItemRequest request) {
        return cartService.addItem(customerId, request);
    }

    @DeleteMapping("/items/{itemId}")
    public CartResponse removeItem(@PathVariable UUID customerId, @PathVariable UUID itemId) {
        return cartService.removeItem(customerId, itemId);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void clear(@PathVariable UUID customerId) {
        cartService.clear(customerId);
    }
}
