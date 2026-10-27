package com.leonycosta.packapi.product.product_tag_link;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductTagLinkRequest {

    @NotNull(message = "Tag é obrigatória")
    private UUID tagId;
}
