package com.leonycosta.packapi.order.coupon;

import com.leonycosta.packapi.enums.CouponTipo;
import com.leonycosta.packapi.exception.BusinessException;
import com.leonycosta.packapi.exception.ConflictException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// Teste de unidade com Mockito: o CouponService de verdade, mas com um CouponRepository falso (mock).
// O mock não tem banco: ele responde o que o teste mandar (when...thenReturn) e anota o que foi
// chamado, para o teste conferir depois (verify). Assim só a regra do service é testada.
@ExtendWith(MockitoExtension.class)
class CouponServiceTest {

    @Mock
    CouponRepository repository;

    // cria o CouponService passando o mock no construtor
    @InjectMocks
    CouponService service;

    @Test
    void salvaOCodigoEmMaiusculo() {
        when(repository.existsByCodigo("BEMVINDO")).thenReturn(false);
        when(repository.save(any(Coupon.class))).thenAnswer(chamada -> chamada.getArgument(0));

        CouponResponse criado = service.create(pedido("bemvindo", "10", CouponTipo.PERCENTUAL, daquiAUmMes()));

        assertThat(criado.getCodigo()).isEqualTo("BEMVINDO");
        verify(repository).save(any(Coupon.class));
    }

    @Test
    void recusaValidadeNoPassado() {
        CouponRequest vencido = pedido("VELHO", "10", CouponTipo.PERCENTUAL, LocalDateTime.now().minusDays(1));

        assertThatThrownBy(() -> service.create(vencido))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("passado");
        // a regra barrou antes de chegar no banco
        verify(repository, never()).save(any());
    }

    @Test
    void recusaPercentualAcimaDe100() {
        CouponRequest exagerado = pedido("MAIS", "150", CouponTipo.PERCENTUAL, daquiAUmMes());

        assertThatThrownBy(() -> service.create(exagerado))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("100%");
        verify(repository, never()).save(any());
    }

    @Test
    void descontoFixoPodePassarDe100() {
        // R$ 500 de desconto é um valor, não uma porcentagem: a regra dos 100% não vale aqui
        when(repository.save(any(Coupon.class))).thenAnswer(chamada -> chamada.getArgument(0));

        CouponResponse criado = service.create(pedido("FIXO500", "500", CouponTipo.FIXO, daquiAUmMes()));

        assertThat(criado.getDesconto()).isEqualByComparingTo("500");
    }

    @Test
    void recusaCodigoRepetidoMesmoEmMinusculo() {
        when(repository.existsByCodigo("PROMO")).thenReturn(true);

        assertThatThrownBy(() -> service.create(pedido("promo", "10", CouponTipo.FIXO, daquiAUmMes())))
                .isInstanceOf(ConflictException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void cupomVencidoNaoVaiParaOCheckout() {
        Coupon vencido = new Coupon();
        vencido.setCodigo("VELHO");
        vencido.setValidade(LocalDateTime.now().minusHours(1));
        when(repository.findByCodigo("VELHO")).thenReturn(Optional.of(vencido));

        assertThatThrownBy(() -> service.findValidByCodigo("velho"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("expirado");
    }

    private static CouponRequest pedido(String codigo, String desconto, CouponTipo tipo, LocalDateTime validade) {
        return new CouponRequest(codigo, new BigDecimal(desconto), tipo, validade);
    }

    private static LocalDateTime daquiAUmMes() {
        return LocalDateTime.now().plusMonths(1);
    }
}
