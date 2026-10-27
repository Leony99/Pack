package com.leonycosta.packapi.product.color;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ColorRequest {

    @NotBlank(message = "Nome é obrigatório")
    private String nome;

    @NotBlank(message = "Hex é obrigatório")
    @Pattern(regexp = "^#([A-Fa-f0-9]{6})$", message = "Hex inválido — use formato #RRGGBB")
    private String hex;
}
