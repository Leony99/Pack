package com.leonycosta.packapi.order;

import com.leonycosta.packapi.order.coupon.Coupon;
import com.leonycosta.packapi.customer.Customer;
import com.leonycosta.packapi.enums.OrderStatus;
import com.leonycosta.packapi.order.order_item.OrderItem;
import com.leonycosta.packapi.order.payment.Payment;
import com.leonycosta.packapi.order.shipment.Shipment;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Entity
@Table(name = "orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne
    @JoinColumn(name = "coupon_id")
    private Coupon coupon;

    @Column(nullable = false)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    // Snapshot do endereço no momento da compra
    @Column(name = "endereco_cep", nullable = false)
    private String enderecoCep;

    @Column(name = "endereco_rua", nullable = false)
    private String enderecoRua;

    @Column(name = "endereco_numero", nullable = false)
    private String enderecoNumero;

    @Column(name = "endereco_cidade", nullable = false)
    private String enderecoCidade;

    @Column(name = "endereco_estado", nullable = false)
    private String enderecoEstado;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> itens = new ArrayList<>();

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private Payment payment;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private Shipment shipment;
}