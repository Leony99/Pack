package com.leonycosta.packapi.customer;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CustomerResponse {
    private UUID id;
    private String nome;
    private String email;
    private String telefone;
    private LocalDateTime criadoEm;
}
