package com.leonycosta.packapi.product.product_tag;

import jakarta.validation.constraints.*;
import com.leonycosta.packapi.enums.TagFiltro;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductTagRequest {

    @NotBlank(message = "Tag é obrigatória")
    @Size(max = 50, message = "Tag deve ter no máximo 50 caracteres")
    private String tag;

    // Opcional: sem filtro, a tag só vale na busca
    private TagFiltro filtro;
}
