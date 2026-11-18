package com.leonycosta.packapi.customer.newsletter;

import com.leonycosta.packapi.config.Pagina;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@Tag(name = "Newsletter", description = "Qualquer um se inscreve. O cliente entra e sai pela área dele. "
        + "A lista e as mudanças nela exigem STAFF_MANAGE.")
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class NewsletterController {

    private final NewsletterService service;

    @Operation(summary = "Inscreve um e-mail na newsletter (a resposta é a mesma se ele já estava na lista)")
    @PostMapping("/newsletter")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void inscrever(@Valid @RequestBody InscricaoRequest request, HttpServletRequest http) {
        service.inscrever(request.getEmail(), http.getRemoteAddr());
    }

    @Operation(summary = "Lista os inscritos em páginas, os mais novos primeiro")
    @GetMapping("/newsletter")
    public Pagina<InscritoResponse> listar(@RequestParam(defaultValue = "0") int pagina,
                                           @RequestParam(defaultValue = Pagina.TAMANHO_PADRAO) int tamanho) {
        return service.listar(pagina, tamanho);
    }

    @Operation(summary = "Tira o e-mail da lista (ativo=false) ou o coloca de volta (ativo=true)")
    @PatchMapping("/newsletter/{id}")
    public InscritoResponse mudarAtivo(@PathVariable UUID id, @RequestParam boolean ativo) {
        return service.mudarAtivo(id, ativo);
    }

    @Operation(summary = "O cliente está na newsletter? (com o e-mail da conta)")
    @GetMapping("/customers/{customerId}/newsletter")
    public Map<String, Boolean> doCliente(@PathVariable UUID customerId) {
        return Map.of("inscrito", service.doCliente(customerId));
    }

    @Operation(summary = "O cliente entra ou sai da newsletter")
    @PutMapping("/customers/{customerId}/newsletter")
    public Map<String, Boolean> mudarDoCliente(@PathVariable UUID customerId,
                                               @RequestBody NewsletterDoClienteRequest request) {
        return Map.of("inscrito", service.mudarDoCliente(customerId, request.inscrito()));
    }
}
