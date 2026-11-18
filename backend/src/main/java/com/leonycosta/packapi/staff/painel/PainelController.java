package com.leonycosta.packapi.staff.painel;

import com.leonycosta.packapi.customer.contato.MensagemRepository;
import com.leonycosta.packapi.customer.contato.StatusDaMensagem;
import com.leonycosta.packapi.customer.customer.CustomerRepository;
import com.leonycosta.packapi.enums.OrderStatus;
import com.leonycosta.packapi.order.order.OrderRepository;
import com.leonycosta.packapi.product.product.ProductRepository;
import com.leonycosta.packapi.product.product_variant.ProductVariantRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

// A Visão geral do painel: os números de cada área, contados no banco numa chamada só. Cada funcionário recebe
// só as partes das permissões dele (quem só cuida do estoque não vê as vendas)
@Tag(name = "Painel", description = "Números da visão geral do painel (funcionários)")
@RestController
@RequestMapping("/api/v1/painel")
@RequiredArgsConstructor
public class PainelController {

    // contam como venda: pagos em diante, sem cancelados e devolvidos
    static final Set<OrderStatus> VENDIDO = EnumSet.of(OrderStatus.PAGO, OrderStatus.EM_SEPARACAO,
            OrderStatus.ENVIADO, OrderStatus.ENTREGUE);
    static final int ESTOQUE_BAIXO = 5;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final CustomerRepository customerRepository;
    private final MensagemRepository mensagemRepository;

    @Operation(summary = "Os números da visão geral, só das áreas que o funcionário pode ver")
    @GetMapping("/resumo")
    @Transactional(readOnly = true)
    public Map<String, Object> resumo(Authentication auth) {
        Set<String> pode = AuthorityUtils.authorityListToSet(auth.getAuthorities());
        Map<String, Object> resumo = new LinkedHashMap<>();
        if (pode.contains("ORDER_MANAGE")) {
            var inicioDoMes = LocalDate.now().withDayOfMonth(1).atStartOfDay();
            Map<String, Long> porStatus = new LinkedHashMap<>();
            for (OrderStatus s : OrderStatus.values()) porStatus.put(s.name(), orderRepository.countByStatus(s));
            resumo.put("pedidos", Map.of(
                    "porStatus", porStatus,
                    "vendasDoMes", orderRepository.somaDasVendas(inicioDoMes, VENDIDO),
                    "pedidosDoMes", orderRepository.countByCriadoEmGreaterThanEqualAndStatusIn(inicioDoMes, VENDIDO)));
        }
        if (pode.contains("CATALOG_WRITE")) {
            resumo.put("catalogo", Map.of(
                    "ativos", productRepository.countByAtivo(true),
                    "inativos", productRepository.countByAtivo(false)));
        }
        if (pode.contains("INVENTORY_MANAGE")) {
            resumo.put("estoque", Map.of("variantesComEstoqueBaixo", variantRepository.countByQuantLessThanEqual(ESTOQUE_BAIXO),
                    "limite", ESTOQUE_BAIXO));
        }
        if (pode.contains("CUSTOMER_READ")) {
            resumo.put("clientes", Map.of(
                    "total", customerRepository.count(),
                    "mensagensNovas", mensagemRepository.countByStatus(StatusDaMensagem.NOVA)));
        }
        return resumo;
    }
}
