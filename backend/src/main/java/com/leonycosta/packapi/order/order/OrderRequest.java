package com.leonycosta.packapi.order.order;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OrderRequest {

    @NotNull(message = "Endereço é obrigatório")
    private UUID addressId;

    // A entrega escolhida: o preço sai da tabela de frete da API (nunca do navegador)
    @NotNull(message = "Escolha o frete (PAC ou SEDEX)")
    private com.leonycosta.packapi.order.frete.TipoFrete frete;

    // Opcional — cliente pode finalizar sem cupom
    @Size(max = 30, message = "Código do cupom deve ter no máximo 30 caracteres")
    private String codigoCupom;
}
