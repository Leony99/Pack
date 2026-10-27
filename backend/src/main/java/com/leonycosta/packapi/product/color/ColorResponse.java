package com.leonycosta.packapi.product.color;

import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ColorResponse {
    private UUID id;
    private String nome;
    private String hex;
}
