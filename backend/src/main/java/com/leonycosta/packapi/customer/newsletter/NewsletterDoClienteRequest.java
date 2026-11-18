package com.leonycosta.packapi.customer.newsletter;

// PUT /customers/{id}/newsletter: { "inscrito": true } entra na lista com o e-mail da conta; false sai
public record NewsletterDoClienteRequest(boolean inscrito) {
}
