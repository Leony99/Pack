package com.leonycosta.packapi.order.order;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OrderRequest {

    @NotNull(message = "Endereço é obrigatório")
    private UUID addressId;

    // Opcional — cliente pode finalizar sem cupom
    private String codigoCupom;
}
