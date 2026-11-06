package com.leonycosta.packapi.order.shipment;

import jakarta.validation.constraints.*;
import lombok.*;

// O status não vem na requisição: todo envio começa em PREPARANDO
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ShipmentRequest {

    @NotBlank(message = "Transportadora é obrigatória")
    @Size(max = 50, message = "Transportadora deve ter no máximo 50 caracteres")
    private String transportadora;

    @Size(max = 50, message = "Código de rastreio deve ter no máximo 50 caracteres")
    private String codigoRastreio;
}
