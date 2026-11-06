package com.leonycosta.packapi.product.inventory;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import com.leonycosta.packapi.enums.MovimentoTipo;

import java.util.List;
import java.util.UUID;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {
    Page<InventoryMovement> findByVariantId(UUID variantId, Pageable pedido);
    List<InventoryMovement> findByVariantIdAndTipoMovimentacao(UUID variantId, MovimentoTipo tipo);
    List<InventoryMovement> findByVariantSku(String variantSku);
}