package com.leonycosta.packapi.product.product_variant;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

// Edição de uma variante: o mesmo que o cadastro, menos o estoque.
// O estoque só muda por movimento (POST /inventory/movements), que exige INVENTORY_MANAGE,
// trava a linha da variante e fica registrado no histórico.
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductVariantUpdateRequest {

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
}
