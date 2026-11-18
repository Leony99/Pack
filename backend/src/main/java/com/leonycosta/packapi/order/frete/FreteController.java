package com.leonycosta.packapi.order.frete;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@Tag(name = "Frete", description = "Opções de entrega por CEP (público: a página do produto e o carrinho calculam antes do login)")
@RestController
@RequestMapping("/api/v1/frete")
@RequiredArgsConstructor
public class FreteController {

    private final FreteService freteService;

    // GET /frete?cep=20040020&subtotal=159.80
    @Operation(summary = "PAC e SEDEX para o CEP (PAC grátis a partir de R$ 200 em produtos)")
    @GetMapping
    public List<OpcaoDeFrete> calcular(@RequestParam String cep,
                                       @RequestParam(defaultValue = "0") BigDecimal subtotal) {
        return freteService.calcular(cep, subtotal);
    }
}
