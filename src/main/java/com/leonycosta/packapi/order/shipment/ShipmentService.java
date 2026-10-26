package com.leonycosta.packapi.order.shipment;

import com.leonycosta.packapi.enums.OrderStatus;
import com.leonycosta.packapi.enums.ShipmentStatus;
import com.leonycosta.packapi.exception.BusinessException;
import com.leonycosta.packapi.exception.ResourceNotFoundException;
import com.leonycosta.packapi.order.order.Order;
import com.leonycosta.packapi.order.order.OrderRepository;
import com.leonycosta.packapi.order.order.OrderService;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final OrderRepository orderRepository;
    private final OrderService orderService;

    public ShipmentService(ShipmentRepository shipmentRepository,
                           OrderRepository orderRepository,
                           @Lazy OrderService orderService) {
        this.shipmentRepository = shipmentRepository;
        this.orderRepository = orderRepository;
        this.orderService = orderService;
    }

    public ShipmentResponse findByOrder(UUID orderId) {
        return toResponse(findByOrderOrThrow(orderId));
    }

    @Transactional
    public ShipmentResponse create(UUID orderId, ShipmentRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido", orderId));

        if (shipmentRepository.findByOrderId(orderId).isPresent()) {
            throw new BusinessException("Este pedido já possui um envio registrado");
        }
        if (order.getStatus() != OrderStatus.PAGO) {
            throw new BusinessException("Só é possível enviar pedidos pagos (status atual: " + order.getStatus() + ")");
        }

        Shipment shipment = new Shipment();
        shipment.setOrder(order);
        shipment.setTransportadora(request.getTransportadora());
        shipment.setCodigoRastreio(request.getCodigoRastreio());
        shipment.setStatus(ShipmentStatus.PREPARANDO);

        orderService.updateStatus(orderId, OrderStatus.EM_SEPARACAO);

        return toResponse(shipmentRepository.save(shipment));
    }

    @Transactional
    public ShipmentResponse updateStatus(UUID shipmentId, ShipmentStatus status) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Envio", shipmentId));
        shipment.setStatus(status);

        // Espelha status do envio no pedido
        OrderStatus novoStatusPedido = switch (status) {
            case DESPACHADO -> OrderStatus.ENVIADO;
            case ENTREGUE   -> OrderStatus.ENTREGUE;
            default         -> null;
        };
        if (novoStatusPedido != null) {
            orderService.updateStatus(shipment.getOrder().getId(), novoStatusPedido);
        }

        return toResponse(shipmentRepository.save(shipment));
    }

    public ShipmentResponse updateRastreio(UUID shipmentId, String codigoRastreio) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Envio", shipmentId));
        shipment.setCodigoRastreio(codigoRastreio);
        return toResponse(shipmentRepository.save(shipment));
    }

    private Shipment findByOrderOrThrow(UUID orderId) {
        return shipmentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Envio do pedido", orderId));
    }

    private ShipmentResponse toResponse(Shipment s) {
        return new ShipmentResponse(s.getId(), s.getTransportadora(), s.getCodigoRastreio(), s.getStatus());
    }
}
