package com.leonycosta.packapi.customer.address;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class AddressRequest {

    @NotBlank(message = "CEP é obrigatório")
    @Size(max = 9, message = "CEP deve ter no máximo 9 caracteres")
    private String cep;

    @NotBlank(message = "Rua é obrigatória")
    @Size(max = 150, message = "Rua deve ter no máximo 150 caracteres")
    private String rua;

    @NotBlank(message = "Número é obrigatório")
    @Size(max = 10, message = "Número deve ter no máximo 10 caracteres")
    private String numero;

    @Size(max = 100, message = "Complemento deve ter no máximo 100 caracteres")
    private String complemento;

    @NotBlank(message = "Bairro é obrigatório")
    @Size(max = 100, message = "Bairro deve ter no máximo 100 caracteres")
    private String bairro;

    @NotBlank(message = "Cidade é obrigatória")
    @Size(max = 100, message = "Cidade deve ter no máximo 100 caracteres")
    private String cidade;

    @NotBlank(message = "Estado é obrigatório")
    @Size(min = 2, max = 2, message = "Estado deve ter 2 caracteres (ex: RJ)")
    private String estado;

    @Size(max = 40, message = "Apelido deve ter no máximo 40 caracteres")
    private String apelido;

    // true: vira o principal (o anterior deixa de ser). O primeiro endereço do cliente é sempre o principal.
    // Boolean, e não boolean: pode faltar no corpo (vale como false)
    private Boolean principal;

    public boolean querSerPrincipal() {
        return Boolean.TRUE.equals(principal);
    }
}
