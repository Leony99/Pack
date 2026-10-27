package com.leonycosta.packapi.order.coupon;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CouponRepository extends JpaRepository<Coupon, UUID> {
    Optional<Coupon> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
}