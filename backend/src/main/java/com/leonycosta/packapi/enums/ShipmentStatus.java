package com.leonycosta.packapi.enums;

public enum ShipmentStatus {
    PREPARANDO,
    DESPACHADO,
    ENTREGUE,
    DEVOLVIDO;

    // PREPARANDO → DESPACHADO → ENTREGUE. DEVOLVIDO quando o pacote volta para a loja: a transportadora
    // não entregou (de DESPACHADO) ou o cliente devolveu (de ENTREGUE). ENTREGUE só vira DEVOLVIDO; DEVOLVIDO é final.
    public boolean podeMudarPara(ShipmentStatus novo) {
        return switch (this) {
            case PREPARANDO -> novo == DESPACHADO;
            case DESPACHADO -> novo == ENTREGUE || novo == DEVOLVIDO;
            case ENTREGUE -> novo == DEVOLVIDO;
            case DEVOLVIDO -> false;
        };
    }
}
