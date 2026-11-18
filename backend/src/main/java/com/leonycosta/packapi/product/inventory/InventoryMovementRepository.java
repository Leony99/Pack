package com.leonycosta.packapi.product.inventory;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;

import com.leonycosta.packapi.enums.MovimentoTipo;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, UUID> {
    Page<InventoryMovement> findByVariantId(UUID variantId, Pageable pedido);
    List<InventoryMovement> findByVariantIdAndTipoMovimentacao(UUID variantId, MovimentoTipo tipo);
    List<InventoryMovement> findByVariantSku(String variantSku);

    // Variante apagada (só possível se nunca esteve em pedido): o movimento fica no histórico, com o SKU,
    // só sem a ligação. O histórico de estoque nunca é apagado
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE InventoryMovement m SET m.variant = null WHERE m.variant.id IN :variantes")
    int soltarVariantes(Collection<UUID> variantes);
}