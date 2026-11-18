package com.leonycosta.packapi.order.order;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import com.leonycosta.packapi.enums.OrderStatus;

import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    Page<Order> findByCustomerId(UUID customerId, Pageable pedido);

    // a lista do painel, filtrada pelo status
    Page<Order> findByStatus(OrderStatus status, Pageable pedido);

    long countByStatus(OrderStatus status);

    // vendas (pedidos pagos em diante, sem os cancelados e devolvidos) a partir de uma data
    @org.springframework.data.jpa.repository.Query("""
            SELECT COALESCE(SUM(o.total), 0) FROM Order o
            WHERE o.criadoEm >= :desde AND o.status IN :status
            """)
    java.math.BigDecimal somaDasVendas(java.time.LocalDateTime desde, java.util.Collection<OrderStatus> status);

    long countByCriadoEmGreaterThanEqualAndStatusIn(java.time.LocalDateTime desde,
                                                     java.util.Collection<OrderStatus> status);
    boolean existsByCustomerId(UUID customerId);
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByCustomerIdAndStatus(UUID customerId, OrderStatus status);
}