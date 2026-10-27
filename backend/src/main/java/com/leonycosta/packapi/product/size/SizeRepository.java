package com.leonycosta.packapi.product.size;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SizeRepository extends JpaRepository<Size, UUID> {
    Optional<Size> findByLabel(String label);
    boolean existsByLabelIgnoreCase(String label);
}