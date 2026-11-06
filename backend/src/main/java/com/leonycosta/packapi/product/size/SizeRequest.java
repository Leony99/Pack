package com.leonycosta.packapi.product.size;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SizeRequest {

    @NotBlank(message = "Label é obrigatório")
    // nome completo: neste pacote, "Size" é a entidade de tamanho
    @jakarta.validation.constraints.Size(max = 20, message = "Label deve ter no máximo 20 caracteres")
    private String label;
}
