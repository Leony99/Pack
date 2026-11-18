package com.leonycosta.packapi.customer.newsletter;

import java.time.LocalDateTime;
import java.util.UUID;

public record InscritoResponse(UUID id, String email, boolean ativo, LocalDateTime criadoEm) {
}
