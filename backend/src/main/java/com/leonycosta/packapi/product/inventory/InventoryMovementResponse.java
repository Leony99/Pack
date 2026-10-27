package com.leonycosta.packapi.product.inventory;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

import com.leonycosta.packapi.enums.MovimentoTipo;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class InventoryMovementResponse {
    private UUID id;
    private String variantSku;
    private MovimentoTipo tipoMovimentacao;
    private Integer quantidade;
    private String motivo;
    private LocalDateTime data;
}
