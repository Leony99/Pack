package com.leonycosta.packapi.order.order;

import com.leonycosta.packapi.order.coupon.CouponResponse;
import com.leonycosta.packapi.customer.customer.CustomerResponse;
import com.leonycosta.packapi.enums.OrderStatus;
import com.leonycosta.packapi.order.order_item.OrderItemResponse;
import com.leonycosta.packapi.order.payment.PaymentResponse;
import com.leonycosta.packapi.order.shipment.ShipmentResponse;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OrderResponse {
    private UUID id;
    private CustomerResponse customer;
    private OrderStatus status;
    private BigDecimal total;
    private LocalDateTime criadoEm;

    // Snapshot do endereço
    private String enderecoCep;
    private String enderecoRua;
    private String enderecoNumero;
    private String enderecoCidade;
    private String enderecoEstado;

    private CouponResponse coupon;
    private List<OrderItemResponse> itens;
    private PaymentResponse payment;
    private ShipmentResponse shipment;
}
