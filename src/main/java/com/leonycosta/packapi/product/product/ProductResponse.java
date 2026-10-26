package com.leonycosta.packapi.product.product;

import com.leonycosta.packapi.product.product_image.ProductImageResponse;
import com.leonycosta.packapi.product.product_tag.ProductTagResponse;
import com.leonycosta.packapi.product.product_variant.ProductVariantResponse;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductResponse {
    private UUID id;
    private String nome;
    private String descricao;
    private BigDecimal preco;
    private String slug;
    private LocalDateTime criadoEm;
    private List<ProductImageResponse> imagens;
    private List<ProductTagResponse> tags;
    private List<ProductVariantResponse> variantes;
}
