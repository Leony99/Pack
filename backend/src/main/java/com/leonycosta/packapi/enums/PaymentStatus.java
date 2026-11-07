package com.leonycosta.packapi.enums;

public enum PaymentStatus {
    PENDENTE,
    APROVADO,
    RECUSADO,
    ESTORNADO;

    // PENDENTE → APROVADO → ESTORNADO, ou PENDENTE → RECUSADO. RECUSADO e ESTORNADO são finais.
    // Não volta para trás (APROVADO → PENDENTE) nem "ressuscita" (RECUSADO → APROVADO).
    public boolean podeMudarPara(PaymentStatus novo) {
        return switch (this) {
            case PENDENTE -> novo == APROVADO || novo == RECUSADO;
            case APROVADO -> novo == ESTORNADO;
            case RECUSADO, ESTORNADO -> false;
        };
    }
}
