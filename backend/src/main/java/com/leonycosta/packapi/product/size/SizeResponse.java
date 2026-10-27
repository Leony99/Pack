package com.leonycosta.packapi.product.size;

import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SizeResponse {
    private UUID id;
    private String label;
}
