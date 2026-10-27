package com.leonycosta.packapi.cart.cart;

import com.leonycosta.packapi.cart.cart_item.CartItem;
import com.leonycosta.packapi.cart.cart_item.CartItemRepository;
import com.leonycosta.packapi.cart.cart_item.CartItemRequest;
import com.leonycosta.packapi.cart.cart_item.CartItemResponse;
import com.leonycosta.packapi.product.color.ColorResponse;
import com.leonycosta.packapi.customer.customer.CustomerService;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import com.leonycosta.packapi.product.product_variant.ProductVariant;
import com.leonycosta.packapi.product.product_variant.ProductVariantResponse;
import com.leonycosta.packapi.product.product_variant.ProductVariantService;
import com.leonycosta.packapi.product.size.SizeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final CustomerService customerService;
    private final ProductVariantService variantService;

    public CartResponse findByCustomer(UUID customerId) {
        return toResponse(findCartOrThrow(customerId));
    }

    @Transactional
    public CartResponse addItem(UUID customerId, CartItemRequest request) {
        Cart cart = findCartOrThrow(customerId);
        ProductVariant variant = variantService.findEntityById(request.getVariantId());

        // Se o item já existe no carrinho, soma a quantidade
        CartItem item = cartItemRepository
                .findByCartIdAndVariantId(cart.getId(), variant.getId())
                .orElse(null);

        int novaQuantidade = request.getQuantidade() + (item != null ? item.getQuantidade() : 0);
        variantService.validarEstoque(variant, novaQuantidade);

        if (item == null) {
            item = new CartItem();
            item.setCart(cart);
            item.setVariant(variant);
            cart.getItens().add(item);
        }
        item.setQuantidade(novaQuantidade);

        cart.setAtualizadoEm(LocalDateTime.now());
        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse removeItem(UUID customerId, UUID itemId) {
        Cart cart = findCartOrThrow(customerId);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Item do carrinho", itemId));
        if (!item.getCart().getId().equals(cart.getId())) {
            throw new ResourceNotFoundException("Item do carrinho", itemId);
        }
        cart.getItens().remove(item);  // orphanRemoval apaga do banco
        cart.setAtualizadoEm(LocalDateTime.now());
        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public void clear(UUID customerId) {
        Cart cart = findCartOrThrow(customerId);
        cart.getItens().clear();  // orphanRemoval apaga do banco
        cart.setAtualizadoEm(LocalDateTime.now());
        cartRepository.save(cart);
    }

    // Usado pelo OrderService no checkout
    public Cart findCartOrThrow(UUID customerId) {
        customerService.findEntityById(customerId); // valida que o cliente existe
        return cartRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Carrinho do cliente", customerId));
    }

    private CartResponse toResponse(Cart cart) {
        List<CartItemResponse> itens = cart.getItens().stream()
                .map(this::toItemResponse)
                .toList();

        BigDecimal total = itens.stream()
                .map(i -> i.getSubtotal() != null ? i.getSubtotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));

        return new CartResponse(cart.getId(), itens, total, cart.getAtualizadoEm());
    }

    private CartItemResponse toItemResponse(CartItem item) {
        ProductVariant v = item.getVariant();
        BigDecimal precoUnit = v.getPreco() != null ? v.getPreco() : v.getProduct().getPreco();
        BigDecimal subtotal = precoUnit.multiply(BigDecimal.valueOf(item.getQuantidade()));

        ProductVariantResponse variantResponse = new ProductVariantResponse(
                v.getId(), v.getSku(),
                new SizeResponse(v.getSize().getId(), v.getSize().getLabel()),
                new ColorResponse(v.getColor().getId(), v.getColor().getNome(), v.getColor().getHex()),
                precoUnit, v.getQuant()
        );
        return new CartItemResponse(item.getId(), variantResponse, item.getQuantidade(), precoUnit, subtotal);
    }
}
