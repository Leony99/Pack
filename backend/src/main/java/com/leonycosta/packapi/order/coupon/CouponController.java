package com.leonycosta.packapi.order.coupon;

import com.leonycosta.packapi.config.Pagina;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Cupons", description = "Cupons de desconto fixos ou percentuais. Exige COUPON_MANAGE.")
@RestController
@RequestMapping("/api/v1/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    @Operation(summary = "Lista os cupons em páginas")
    @GetMapping
    public Pagina<CouponResponse> findAll(@RequestParam(defaultValue = "0") int pagina,
                                        @RequestParam(defaultValue = Pagina.TAMANHO_PADRAO) int tamanho) {
        return couponService.findAll(pagina, tamanho);
    }

    @Operation(summary = "Busca um cupom")
    @GetMapping("/{id}")
    public CouponResponse findById(@PathVariable UUID id) {
        return couponService.findById(id);
    }

    @Operation(summary = "Cria um cupom")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CouponResponse create(@Valid @RequestBody CouponRequest request) {
        return couponService.create(request);
    }

    @Operation(summary = "Atualiza um cupom")
    @PutMapping("/{id}")
    public CouponResponse update(@PathVariable UUID id, @Valid @RequestBody CouponRequest request) {
        return couponService.update(id, request);
    }

    @Operation(summary = "Apaga um cupom")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        couponService.delete(id);
    }
}
