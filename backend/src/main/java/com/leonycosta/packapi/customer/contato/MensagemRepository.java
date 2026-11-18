package com.leonycosta.packapi.customer.contato;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MensagemRepository extends JpaRepository<MensagemDeContato, UUID> {
    Page<MensagemDeContato> findByStatus(StatusDaMensagem status, Pageable pedido);

    long countByStatus(StatusDaMensagem status);
}
