package com.leonycosta.packapi.product.inventory;

import com.leonycosta.packapi.enums.MovimentoTipo;
import com.leonycosta.packapi.product.product_variant.ProductVariant;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "inventory_movements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class InventoryMovement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Nullable — on delete set null
    @ManyToOne
    @JoinColumn(name = "variant_id", nullable = true)
    private ProductVariant variant;

    // Snapshot — preserva histórico mesmo se variante for deletada
    @Column(nullable = false)
    private String variantSku;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_movimentacao", nullable = false)
    private MovimentoTipo tipoMovimentacao;

    @Column(nullable = false)
    private Integer quantidade;

    @Column
    private String motivo;

    @Column(nullable = false)
    private LocalDateTime data;
}