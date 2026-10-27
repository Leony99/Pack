package com.leonycosta.packapi.order.coupon;

import com.leonycosta.packapi.enums.CouponTipo;
import com.leonycosta.packapi.exception.BusinessException;
import com.leonycosta.packapi.exception.ConflictException;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponRepository couponRepository;

    public List<CouponResponse> findAll() {
        return couponRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public CouponResponse findById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    public CouponResponse create(CouponRequest request) {
        validar(request);
        if (couponRepository.existsByCodigo(request.getCodigo().toUpperCase())) {
            throw new ConflictException("Código de cupom já existe: " + request.getCodigo());
        }
        Coupon coupon = new Coupon();
        coupon.setCodigo(request.getCodigo().toUpperCase());
        coupon.setDesconto(request.getDesconto());
        coupon.setTipo(request.getTipo());
        coupon.setValidade(request.getValidade());
        return toResponse(couponRepository.save(coupon));
    }

    public CouponResponse update(UUID id, CouponRequest request) {
        Coupon coupon = findOrThrow(id);
        validar(request);
        String novoCodigo = request.getCodigo().toUpperCase();
        if (!coupon.getCodigo().equals(novoCodigo) && couponRepository.existsByCodigo(novoCodigo)) {
            throw new ConflictException("Código de cupom já existe: " + novoCodigo);
        }
        coupon.setCodigo(novoCodigo);
        coupon.setDesconto(request.getDesconto());
        coupon.setTipo(request.getTipo());
        coupon.setValidade(request.getValidade());
        return toResponse(couponRepository.save(coupon));
    }

    public void delete(UUID id) {
        findOrThrow(id);
        couponRepository.deleteById(id);
    }

    // Usado pelo OrderService: busca cupom pelo código e valida se ainda está válido
    public Coupon findValidByCodigo(String codigo) {
        Coupon coupon = couponRepository.findByCodigo(codigo.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Cupom não encontrado: " + codigo));
        if (coupon.getValidade().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Cupom expirado: " + codigo);
        }
        return coupon;
    }

    private void validar(CouponRequest request) {
        if (request.getValidade().isBefore(LocalDateTime.now())) {
            throw new BusinessException("A validade do cupom não pode estar no passado");
        }
        if (request.getTipo() == CouponTipo.PERCENTUAL && request.getDesconto().compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BusinessException("Desconto percentual não pode passar de 100%");
        }
    }

    private Coupon findOrThrow(UUID id) {
        return couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cupom", id));
    }

    private CouponResponse toResponse(Coupon coupon) {
        return new CouponResponse(
                coupon.getId(),
                coupon.getCodigo(),
                coupon.getDesconto(),
                coupon.getTipo(),
                coupon.getValidade()
        );
    }
}
