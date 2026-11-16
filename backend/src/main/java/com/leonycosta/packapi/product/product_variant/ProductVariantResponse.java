package com.leonycosta.packapi.product.product_variant;

import com.leonycosta.packapi.product.color.ColorResponse;
import com.leonycosta.packapi.product.size.SizeResponse;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductVariantResponse {
    private UUID id;
    private String sku;
    private SizeResponse size;
    private ColorResponse color;
    // precoEfetivo já resolve a herança — nunca retorna nulo
    private BigDecimal precoEfetivo;
    private Integer quant;
    // null nas variantes cadastradas antes de a data existir
    private LocalDateTime criadoEm;
}
