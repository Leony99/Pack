package com.leonycosta.packapi.product.product_image;

import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductImageResponse {
    private UUID id;
    private String url;
    private Integer ordem;
}
