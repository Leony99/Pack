package com.leonycosta.packapi.order.order_item;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

import com.leonycosta.packapi.order.order.Order;
import com.leonycosta.packapi.product.product_variant.ProductVariant;

@Entity
@Table(name = "order_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // Nullable no banco, mas sempre preenchida: uma variante que já esteve em pedido não pode ser apagada
    // (o produto é desativado em vez disso)
    @ManyToOne
    @JoinColumn(name = "variant_id", nullable = true)
    private ProductVariant variant;

    // Snapshot — preserva histórico mesmo se variante for deletada
    @Column(nullable = false)
    private String variantSku;

    // Snapshot do nome do produto na compra: o pedido mostra o nome de quando foi feito, mesmo que o produto
    // seja renomeado depois. Nulo nos itens antigos, de antes desta coluna: a resposta usa o nome atual
    @Column(name = "produto_nome")
    private String produtoNome;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(name = "preco_unit", nullable = false)
    private BigDecimal precoUnit;
}