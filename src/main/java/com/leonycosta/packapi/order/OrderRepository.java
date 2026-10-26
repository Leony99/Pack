package com.leonycosta.packapi.order;

import org.springframework.data.jpa.repository.JpaRepository;

import com.leonycosta.packapi.enums.OrderStatus;

import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByCustomerId(UUID customerId);
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByCustomerIdAndStatus(UUID customerId, OrderStatus status);
}