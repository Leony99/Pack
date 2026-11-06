package com.leonycosta.packapi.order.order;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OrderRequest {

    @NotNull(message = "Endereço é obrigatório")
    private UUID addressId;

    // Opcional — cliente pode finalizar sem cupom
    @Size(max = 30, message = "Código do cupom deve ter no máximo 30 caracteres")
    private String codigoCupom;
}
