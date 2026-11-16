package com.leonycosta.packapi.product.product_tag;

import com.leonycosta.packapi.enums.TagFiltro;
import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductTagResponse {
    private UUID id;
    private String tag;
    private TagFiltro filtro;   // null: a tag não aparece em nenhum filtro
    private boolean fixa;       // as tags fixas da loja (casual e treino) não mudam nem saem

    public static ProductTagResponse de(ProductTag tag) {
        return new ProductTagResponse(tag.getId(), tag.getTag(), tag.getFiltro(), TagsIniciais.ehFixa(tag));
    }
}
