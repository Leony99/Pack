package com.leonycosta.packapi.customer.address;

import lombok.*;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AddressResponse {
    private UUID id;
    private String cep;
    private String rua;
    private String numero;
    private String complemento;
    private String cidade;
    private String estado;
}
