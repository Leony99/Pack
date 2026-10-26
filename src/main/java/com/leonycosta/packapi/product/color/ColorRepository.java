package com.leonycosta.packapi.product.color;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ColorRepository extends JpaRepository<Color, UUID> {
    Optional<Color> findByNome(String nome);
    boolean existsByNomeIgnoreCase(String nome);
}