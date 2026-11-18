package com.leonycosta.packapi.customer.contato;

import com.leonycosta.packapi.config.Pagina;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Contato", description = "Qualquer um manda mensagem; a caixa de entrada exige CUSTOMER_READ.")
@RestController
@RequestMapping("/api/v1/contato")
@RequiredArgsConstructor
public class ContatoController {

    private final ContatoService service;

    @Operation(summary = "Manda uma mensagem para a loja (limite por IP)")
    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void receber(@Valid @RequestBody MensagemRequest request, HttpServletRequest http) {
        service.receber(request, http.getRemoteAddr());
    }

    @Operation(summary = "Lista as mensagens em páginas, as mais novas primeiro (filtro opcional por status)")
    @GetMapping
    public Pagina<MensagemResponse> listar(@RequestParam(required = false) StatusDaMensagem status,
                                           @RequestParam(defaultValue = "0") int pagina,
                                           @RequestParam(defaultValue = Pagina.TAMANHO_PADRAO) int tamanho) {
        return service.listar(status, pagina, tamanho);
    }

    @Operation(summary = "Marca a mensagem como respondida (ou de volta como nova)")
    @PatchMapping("/{id}")
    public MensagemResponse mudarStatus(@PathVariable UUID id, @RequestParam StatusDaMensagem status) {
        return service.mudarStatus(id, status);
    }
}
