package com.leonycosta.packapi.order;

import com.leonycosta.packapi.customer.address.Address;
import com.leonycosta.packapi.customer.address.AddressService;
import com.leonycosta.packapi.cart.Cart;
import com.leonycosta.packapi.cart.CartService;
import com.leonycosta.packapi.cart.cart_item.CartItem;
import com.leonycosta.packapi.order.coupon.Coupon;
import com.leonycosta.packapi.order.coupon.CouponResponse;
import com.leonycosta.packapi.order.coupon.CouponService;
import com.leonycosta.packapi.customer.CustomerResponse;
import com.leonycosta.packapi.customer.CustomerService;
import com.leonycosta.packapi.enums.CouponTipo;
import com.leonycosta.packapi.enums.OrderStatus;
import com.leonycosta.packapi.exception.BusinessException;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import com.leonycosta.packapi.product.inventory.InventoryMovementService;
import com.leonycosta.packapi.order.order_item.OrderItem;
import com.leonycosta.packapi.order.order_item.OrderItemResponse;
import com.leonycosta.packapi.order.payment.PaymentResponse;
import com.leonycosta.packapi.product.product_variant.ProductVariant;
import com.leonycosta.packapi.order.shipment.ShipmentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CustomerService customerService;
    private final AddressService addressService;
    private final CartService cartService;
    private final CouponService couponService;
    private final InventoryMovementService inventoryService;

    public List<OrderResponse> findByCustomer(UUID customerId) {
        return orderRepository.findByCustomerId(customerId).stream()
                .map(this::toResponse)
                .toList();
    }

    public OrderResponse findById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public OrderResponse checkout(UUID customerId, OrderRequest request) {
        // 1. Valida cliente
        customerService.findEntityById(customerId);

        // 2. Busca carrinho e valida que não está vazio
        Cart cart = cartService.findCartOrThrow(customerId);
        if (cart.getItens().isEmpty()) {
            throw new BusinessException("O carrinho está vazio");
        }

        // 3. Valida endereço
        Address address = addressService.findEntityById(customerId, request.getAddressId());

        // 4. Valida estoque de todos os itens antes de alterar qualquer coisa
        for (CartItem cartItem : cart.getItens()) {
            ProductVariant variant = cartItem.getVariant();
            if (variant.getQuant() < cartItem.getQuantidade()) {
                throw new BusinessException(
                        "Estoque insuficiente para o SKU " + variant.getSku()
                        + ". Disponível: " + variant.getQuant()
                        + ", no carrinho: " + cartItem.getQuantidade()
                );
            }
        }

        // 5. Calcula subtotal de cada item
        BigDecimal subtotalBruto = cart.getItens().stream()
                .map(item -> {
                    BigDecimal preco = item.getVariant().getPreco() != null
                            ? item.getVariant().getPreco()
                            : item.getVariant().getProduct().getPreco();
                    return preco.multiply(BigDecimal.valueOf(item.getQuantidade()));
                })
                .reduce(BigDecimal.ZERO, (a, b) -> a.add(b));

        // 6. Aplica cupom se informado
        Coupon coupon = null;
        BigDecimal total = subtotalBruto;
        if (request.getCodigoCupom() != null && !request.getCodigoCupom().isBlank()) {
            coupon = couponService.findValidByCodigo(request.getCodigoCupom());
            total = aplicarDesconto(subtotalBruto, coupon);
        }

        // 7. Cria o pedido com snapshot do endereço
        Order order = new Order();
        order.setCustomer(customerService.findEntityById(customerId));
        order.setCoupon(coupon);
        order.setTotal(total.setScale(2, RoundingMode.HALF_UP));
        order.setStatus(OrderStatus.AGUARDANDO_PAGAMENTO);
        order.setEnderecoCep(address.getCep());
        order.setEnderecoRua(address.getRua());
        order.setEnderecoNumero(address.getNumero());
        order.setEnderecoCidade(address.getCidade());
        order.setEnderecoEstado(address.getEstado());
        order.setCriadoEm(LocalDateTime.now());
        order.setItens(new ArrayList<>());
        order = orderRepository.save(order);

        // 8. Cria OrderItems com snapshot de SKU e preço, decrementa estoque
        for (CartItem cartItem : cart.getItens()) {
            ProductVariant variant = cartItem.getVariant();
            BigDecimal precoUnit = variant.getPreco() != null
                    ? variant.getPreco()
                    : variant.getProduct().getPreco();

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setVariant(variant);
            orderItem.setVariantSku(variant.getSku()); // snapshot
            orderItem.setQuantidade(cartItem.getQuantidade());
            orderItem.setPrecoUnit(precoUnit);           // snapshot
            order.getItens().add(orderItem);

            // Decrementa estoque e registra movimento
            inventoryService.registerSaida(variant, cartItem.getQuantidade(),
                    "Pedido " + order.getId());
        }
        order = orderRepository.save(order);

        // 9. Limpa o carrinho
        cartService.clear(customerId);

        return toResponse(order);
    }

    @Transactional
    public OrderResponse updateStatus(UUID id, OrderStatus status) {
        Order order = findOrThrow(id);
        if (!order.getStatus().podeMudarPara(status)) {
            throw new BusinessException(
                    "Não é possível mudar o pedido de " + order.getStatus() + " para " + status);
        }
        if (status == OrderStatus.CANCELADO) {
            for (OrderItem item : order.getItens()) {
                inventoryService.registerDevolucao(item.getVariant(), item.getQuantidade(),
                        "Cancelamento do pedido " + order.getId());
            }
        }
        order.setStatus(status);
        return toResponse(orderRepository.save(order));
    }

    private BigDecimal aplicarDesconto(BigDecimal subtotal, Coupon coupon) {
        if (coupon.getTipo() == CouponTipo.PERCENTUAL) {
            BigDecimal fator = BigDecimal.ONE.subtract(
                    coupon.getDesconto().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP));
            return subtotal.multiply(fator);
        } else { // FIXO
            BigDecimal resultado = subtotal.subtract(coupon.getDesconto());
            return resultado.compareTo(BigDecimal.ZERO) > 0 ? resultado : BigDecimal.ZERO;
        }
    }

    private Order findOrThrow(UUID id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", id));
    }

    private OrderResponse toResponse(Order o) {
        CustomerResponse customerResponse = new CustomerResponse(
                o.getCustomer().getId(), o.getCustomer().getNome(),
                o.getCustomer().getEmail(), o.getCustomer().getTelefone(),
                o.getCustomer().getCriadoEm()
        );

        CouponResponse couponResponse = o.getCoupon() == null ? null : new CouponResponse(
                o.getCoupon().getId(), o.getCoupon().getCodigo(),
                o.getCoupon().getDesconto(), o.getCoupon().getTipo(), o.getCoupon().getValidade()
        );

        List<OrderItemResponse> itens = o.getItens().stream()
                .map(item -> new OrderItemResponse(
                        item.getId(), item.getVariantSku(), item.getQuantidade(),
                        item.getPrecoUnit(),
                        item.getPrecoUnit().multiply(BigDecimal.valueOf(item.getQuantidade()))
                ))
                .toList();

        PaymentResponse paymentResponse = o.getPayment() == null ? null : new PaymentResponse(
                o.getPayment().getId(), o.getPayment().getMetodo(),
                o.getPayment().getStatus(), o.getPayment().getValor()
        );

        ShipmentResponse shipmentResponse = o.getShipment() == null ? null : new ShipmentResponse(
                o.getShipment().getId(), o.getShipment().getTransportadora(),
                o.getShipment().getCodigoRastreio(), o.getShipment().getStatus()
        );

        return new OrderResponse(
                o.getId(), customerResponse, o.getStatus(), o.getTotal(), o.getCriadoEm(),
                o.getEnderecoCep(), o.getEnderecoRua(), o.getEnderecoNumero(),
                o.getEnderecoCidade(), o.getEnderecoEstado(),
                couponResponse, itens, paymentResponse, shipmentResponse
        );
    }
}
