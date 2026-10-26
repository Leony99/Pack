package com.leonycosta.packapi.product.product_tag;

import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductTagResponse {
    private UUID id;
    private String tag;
}
