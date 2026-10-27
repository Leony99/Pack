package com.leonycosta.packapi.product.inventory;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.UUID;

import com.leonycosta.packapi.enums.MovimentoTipo;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class InventoryMovementRequest {

    @NotNull(message = "Variante é obrigatória")
    private UUID variantId;

    @NotNull(message = "Tipo é obrigatório")
    private MovimentoTipo tipoMovimentacao;

    @NotNull(message = "Quantidade é obrigatória")
    @Min(value = 1, message = "Quantidade deve ser pelo menos 1")
    private Integer quantidade;

    // Obrigatório só para AJUSTE — validado no Service
    private String motivo;
}
