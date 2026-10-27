package com.leonycosta.packapi.order.shipment;

import jakarta.validation.constraints.*;
import lombok.*;

// O status não vem na requisição: todo envio começa em PREPARANDO
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ShipmentRequest {

    @NotBlank(message = "Transportadora é obrigatória")
    private String transportadora;

    private String codigoRastreio;
}
