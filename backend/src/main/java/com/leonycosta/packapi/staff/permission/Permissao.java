package com.leonycosta.packapi.staff.permission;

// Permissões que um funcionário recebe pela sua Role.
// O nome da constante é gravado na tabela permissions e vai dentro do token JWT.
public enum Permissao {
    CATALOG_WRITE,     // criar, editar e remover produtos, variantes, imagens, tags, tamanhos e cores
    INVENTORY_MANAGE,  // movimentar estoque e consultar estoque baixo
    ORDER_MANAGE,      // mudar status de pedidos, aprovar pagamentos e cuidar dos envios
    COUPON_MANAGE,     // gerenciar cupons
    CUSTOMER_READ,     // consultar dados de qualquer cliente
    STAFF_MANAGE       // gerenciar funcionários e papéis
}
