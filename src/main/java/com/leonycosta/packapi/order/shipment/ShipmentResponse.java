package com.leonycosta.packapi.order.shipment;

import com.leonycosta.packapi.enums.ShipmentStatus;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ShipmentResponse {
    private UUID id;
    private String transportadora;
    private String codigoRastreio;
    private ShipmentStatus status;
}
