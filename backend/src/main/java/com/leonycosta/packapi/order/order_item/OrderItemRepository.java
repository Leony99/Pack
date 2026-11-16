package com.leonycosta.packapi.order.order_item;

import com.leonycosta.packapi.enums.OrderStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface OrderItemRepository extends JpaRepository<OrderItem, UUID> {
    List<OrderItem> findByOrderId(UUID orderId);

    // Ranking de vendas: os ids dos produtos com mais unidades vendidas nos pedidos feitos desde `desde`
    // e com um dos `status` (os que contam como venda). Empate: o id decide, para a ordem não mudar
    // entre uma chamada e outra. Itens de variante apagada (variant null) ficam de fora.
    @Query("""
            SELECT v.product.id FROM OrderItem i JOIN i.variant v JOIN i.order o
            WHERE o.status IN :status AND o.criadoEm >= :desde
            GROUP BY v.product.id
            ORDER BY SUM(i.quantidade) DESC, v.product.id
            """)
    List<UUID> maisVendidos(Collection<OrderStatus> status, LocalDateTime desde, Pageable limite);
}