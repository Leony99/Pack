package com.leonycosta.packapi.product.product_image;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductImageRequest {

    @NotBlank(message = "URL é obrigatória")
    @Size(max = 255, message = "URL deve ter no máximo 255 caracteres")
    // Só https: uma URL "javascript:..." guardada aqui rodaria código no navegador de quem clicasse nela no site
    @Pattern(regexp = "^https://\\S+$", message = "URL deve começar com https:// e não ter espaços")
    private String url;

    @NotNull(message = "Ordem é obrigatória")
    @Min(value = 0, message = "Ordem deve ser maior ou igual a zero")
    private Integer ordem;
}
