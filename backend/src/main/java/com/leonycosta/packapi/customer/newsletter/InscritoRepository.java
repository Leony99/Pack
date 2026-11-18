package com.leonycosta.packapi.customer.newsletter;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface InscritoRepository extends JpaRepository<Inscrito, UUID> {
    Optional<Inscrito> findByEmail(String email);
}
