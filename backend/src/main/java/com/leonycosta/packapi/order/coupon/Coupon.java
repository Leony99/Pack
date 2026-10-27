package com.leonycosta.packapi.order.coupon;

import com.leonycosta.packapi.enums.CouponTipo;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "coupons")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Coupon {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String codigo;

    @Column(nullable = false)
    private BigDecimal desconto;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CouponTipo tipo;

    @Column(nullable = false)
    private LocalDateTime validade;
}