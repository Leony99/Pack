package com.leonycosta.packapi.enums;

public enum OrderStatus {
    AGUARDANDO_PAGAMENTO,
    PAGO,
    EM_SEPARACAO,
    ENVIADO,
    ENTREGUE,
    CANCELADO;

    // Fluxo: AGUARDANDO_PAGAMENTO → PAGO → EM_SEPARACAO → ENVIADO → ENTREGUE.
    // CANCELADO só antes de o pedido sair para entrega, enquanto o produto ainda está no estoque.
    public boolean podeMudarPara(OrderStatus novo) {
        return switch (this) {
            case AGUARDANDO_PAGAMENTO -> novo == PAGO || novo == CANCELADO;
            case PAGO -> novo == EM_SEPARACAO || novo == CANCELADO;
            case EM_SEPARACAO -> novo == ENVIADO || novo == CANCELADO;
            case ENVIADO -> novo == ENTREGUE;
            case ENTREGUE, CANCELADO -> false;
        };
    }
}
