package com.leonycosta.packapi.order.payment;

import com.leonycosta.packapi.enums.PaymentMetodo;
import com.leonycosta.packapi.enums.PaymentStatus;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PaymentResponse {
    private UUID id;
    private PaymentMetodo metodo;
    private PaymentStatus status;
    private BigDecimal valor;
}
