package com.leonycosta.packapi.order.payment;

import com.leonycosta.packapi.enums.PaymentMetodo;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PaymentRequest {

    @NotNull(message = "Método é obrigatório")
    private PaymentMetodo metodo;

    @NotNull(message = "Valor é obrigatório")
    @DecimalMin(value = "0.01", message = "Valor deve ser maior que zero")
    private BigDecimal valor;
}
