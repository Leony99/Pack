package com.leonycosta.packapi.product.product;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 100, message = "Nome deve ter no máximo 100 caracteres")
    private String nome;

    @Size(max = 2000, message = "Descrição deve ter no máximo 2000 caracteres")
    private String descricao;

    @NotNull(message = "Preço é obrigatório")
    @DecimalMin(value = "0.01", message = "Preço deve ser maior que zero")
    @DecimalMax(value = "1000000.00", message = "Preço deve ser no máximo 1.000.000,00")
    @Digits(integer = 7, fraction = 2, message = "Preço deve ter no máximo 2 casas decimais")
    private BigDecimal preco;

    // Opcional — se não enviado o Service gera automaticamente a partir do nome
    @Size(max = 120, message = "Slug deve ter no máximo 120 caracteres")
    private String slug;
}
