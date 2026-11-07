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
    @Size(max = 50, message = "SKU deve ter no máximo 50 caracteres")
    private String sku;

    // Opcional — se nulo herda o preço do produto
    @DecimalMin(value = "0.01", message = "Preço deve ser maior que zero")
    @DecimalMax(value = "1000000.00", message = "Preço deve ser no máximo 1.000.000,00")
    @Digits(integer = 7, fraction = 2, message = "Preço deve ter no máximo 2 casas decimais")
    private BigDecimal preco;

    @NotNull(message = "Quantidade é obrigatória")
    @Min(value = 0, message = "Quantidade não pode ser negativa")
    @Max(value = 1_000_000, message = "Quantidade inicial deve ser no máximo 1.000.000")
    private Integer quant;
}
