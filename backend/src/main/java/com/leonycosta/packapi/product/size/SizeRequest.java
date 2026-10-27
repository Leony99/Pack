package com.leonycosta.packapi.product.size;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SizeRequest {

    @NotBlank(message = "Label é obrigatório")
    private String label;
}
