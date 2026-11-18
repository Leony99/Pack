package com.leonycosta.packapi.order.compra;

import com.leonycosta.packapi.enums.OrderStatus;
import com.leonycosta.packapi.enums.PaymentMetodo;
import com.leonycosta.packapi.enums.PaymentStatus;
import com.leonycosta.packapi.order.order.Order;
import com.leonycosta.packapi.order.order.OrderRepository;
import com.leonycosta.packapi.order.order.OrderService;
import com.leonycosta.packapi.order.payment.Payment;
import com.leonycosta.packapi.order.payment.PaymentRepository;
import com.leonycosta.packapi.order.payment.PaymentRequest;
import com.leonycosta.packapi.order.payment.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// A aprovação simulada (provisória, até a loja ter um gateway), com a opção ligada: o pagamento que o cliente
// registra já nasce aprovado e o pedido vira PAGO. Teste de unidade, com dublês: os testes de integração
// rodam com a opção desligada (o banco e o admin deles são de uma aplicação só).
class PagamentoSimuladoTest {

    PaymentRepository pagamentos = mock(PaymentRepository.class);
    OrderRepository pedidos = mock(OrderRepository.class);
    OrderService orderService = mock(OrderService.class);
    PaymentService service = new PaymentService(pagamentos, pedidos, orderService, true);
    Order pedido = new Order();
    Payment salvo;

    @BeforeEach
    void preparar() {
        pedido.setId(UUID.randomUUID());
        pedido.setStatus(OrderStatus.AGUARDANDO_PAGAMENTO);
        pedido.setTotal(new BigDecimal("50.00"));
        when(pedidos.findById(pedido.getId())).thenReturn(Optional.of(pedido));
        when(pagamentos.findByOrderId(pedido.getId())).thenReturn(Optional.empty());
        when(pagamentos.save(any())).thenAnswer(chamada -> {
            Payment p = chamada.getArgument(0);
            if (p.getId() == null) p.setId(UUID.randomUUID());
            salvo = p;
            return p;
        });
        when(pagamentos.findById(any())).thenAnswer(chamada -> Optional.ofNullable(salvo));
    }

    @Test
    void pagamentoDoClienteJaNasceAprovadoEOPedidoPago() {
        var resposta = service.create(pedido.getId(), new PaymentRequest(PaymentMetodo.PIX, new BigDecimal("50.00")));

        assertThat(resposta.getStatus()).isEqualTo(PaymentStatus.APROVADO);
        verify(orderService).mudarStatus(pedido.getId(), OrderStatus.PAGO);
    }

    @Test
    void pagamentoPorForaDaEquipeContinuaPendente() {
        var resposta = service.create(pedido.getId(), new PaymentRequest(PaymentMetodo.OUTRO, new BigDecimal("50.00")));

        assertThat(resposta.getStatus()).isEqualTo(PaymentStatus.PENDENTE);
        verify(orderService, never()).mudarStatus(any(), any());
    }
}
