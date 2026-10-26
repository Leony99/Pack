package com.leonycosta.packapi.order.shipment;

import com.leonycosta.packapi.enums.ShipmentStatus;
import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

import com.leonycosta.packapi.order.Order;

@Entity
@Table(name = "shipments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @Column(nullable = false)
    private String transportadora;

    @Column(name = "codigo_rastreio")
    private String codigoRastreio;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShipmentStatus status;
}