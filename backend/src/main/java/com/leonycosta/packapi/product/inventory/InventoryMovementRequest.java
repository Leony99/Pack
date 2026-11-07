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

    // 0 só vale para o AJUSTE (zerar o estoque) — validado no Service.
    // O teto pega erro de digitação ("10000000" em vez de "100")
    public static final int MAXIMO_POR_MOVIMENTO = 100_000;

    @NotNull(message = "Quantidade é obrigatória")
    @Min(value = 0, message = "Quantidade não pode ser negativa")
    @Max(value = MAXIMO_POR_MOVIMENTO, message = "Quantidade deve ser no máximo " + MAXIMO_POR_MOVIMENTO + " por movimento")
    private Integer quantidade;

    // Obrigatório só para AJUSTE — validado no Service
    @Size(max = 255, message = "Motivo deve ter no máximo 255 caracteres")
    private String motivo;
}
