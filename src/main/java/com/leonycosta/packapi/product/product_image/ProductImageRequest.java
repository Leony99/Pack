package com.leonycosta.packapi.product.product_image;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductImageRequest {

    @NotBlank(message = "URL é obrigatória")
    private String url;

    @NotNull(message = "Ordem é obrigatória")
    @Min(value = 0, message = "Ordem deve ser maior ou igual a zero")
    private Integer ordem;
}
