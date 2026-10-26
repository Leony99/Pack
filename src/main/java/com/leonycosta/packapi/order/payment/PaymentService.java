package com.leonycosta.packapi.order.payment;

import com.leonycosta.packapi.enums.PaymentStatus;
import com.leonycosta.packapi.exception.BusinessException;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import com.leonycosta.packapi.order.Order;
import com.leonycosta.packapi.order.OrderRepository;
import com.leonycosta.packapi.order.OrderService;
import com.leonycosta.packapi.enums.OrderStatus;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;

    public PaymentService(PaymentRepository paymentRepository,
                          OrderRepository orderRepository,
                          @Lazy OrderService orderService) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.orderService = orderService;
    }

    public PaymentResponse findByOrder(UUID orderId) {
        return toResponse(findByOrderOrThrow(orderId));
    }

    @Transactional
    public PaymentResponse create(UUID orderId, PaymentRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", orderId));

        if (paymentRepository.findByOrderId(orderId).isPresent()) {
            throw new BusinessException("Este pedido já possui um pagamento registrado");
        }
        if (order.getStatus() != OrderStatus.AGUARDANDO_PAGAMENTO) {
            throw new BusinessException("O pedido não está aguardando pagamento (status: " + order.getStatus() + ")");
        }
        if (request.getValor().compareTo(order.getTotal()) != 0) {
            throw new BusinessException("O valor do pagamento (" + request.getValor()
                    + ") é diferente do total do pedido (" + order.getTotal() + ")");
        }

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setMetodo(request.getMetodo());
        payment.setStatus(PaymentStatus.PENDENTE);
        payment.setValor(request.getValor());

        // O pedido só vira PAGO quando o pagamento for APROVADO, em updateStatus()
        return toResponse(paymentRepository.save(payment));
    }

    @Transactional
    public PaymentResponse updateStatus(UUID paymentId, PaymentStatus status) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Pagamento", paymentId));
        payment.setStatus(status);

        // Espelha status do pagamento no pedido
        OrderStatus novoStatusPedido = switch (status) {
            case APROVADO  -> OrderStatus.PAGO;
            case RECUSADO  -> OrderStatus.CANCELADO;
            case ESTORNADO -> OrderStatus.CANCELADO;
            default        -> null;
        };
        if (novoStatusPedido != null) {
            orderService.updateStatus(payment.getOrder().getId(), novoStatusPedido);
        }

        return toResponse(paymentRepository.save(payment));
    }

    private Payment findByOrderOrThrow(UUID orderId) {
        return paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pagamento do pedido", orderId));
    }

    private PaymentResponse toResponse(Payment p) {
        return new PaymentResponse(p.getId(), p.getMetodo(), p.getStatus(), p.getValor());
    }
}
