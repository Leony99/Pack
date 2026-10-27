package com.leonycosta.packapi.product.product_tag;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductTagRequest {

    @NotBlank(message = "Tag é obrigatória")
    private String tag;
}
