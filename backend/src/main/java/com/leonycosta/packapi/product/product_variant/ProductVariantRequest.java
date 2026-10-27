package com.leonycosta.packapi.product.product_variant;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductVariantRequest {

    @NotNull(message = "Size é obrigatório")
    private UUID sizeId;

    @NotNull(message = "Color é obrigatória")
    private UUID colorId;

    @NotBlank(message = "SKU é obrigatório")
    private String sku;

    // Opcional — se nulo herda o preço do produto
    private BigDecimal preco;

    @NotNull(message = "Quantidade é obrigatória")
    @Min(value = 0, message = "Quantidade não pode ser negativa")
    private Integer quant;
}
