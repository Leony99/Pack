package com.leonycosta.packapi.auth;

import com.leonycosta.packapi.order.order.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.UUID;

// Regras de "dono": usadas pelo SecurityConfig para saber se o cliente logado pode mexer naquele recurso.
// O id do usuário logado é o "sub" do token, que o Spring expõe como authentication.getName().
@Component
@RequiredArgsConstructor
public class AccessGuard {

    private final OrderRepository orderRepository;

    public boolean has(Authentication auth, String authority) {
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> authority.equals(a.getAuthority()));
    }

    // O customerId da URL é o próprio cliente logado?
    public boolean isSelf(Authentication auth, String customerId) {
        return has(auth, TipoUsuario.CUSTOMER.name()) && auth.getName().equals(customerId);
    }

    // O pedido da URL pertence ao cliente logado? Pedido inexistente também dá "não",
    // para não revelar a um cliente quais ids de pedido existem.
    public boolean ownsOrder(Authentication auth, String orderId) {
        if (!has(auth, TipoUsuario.CUSTOMER.name())) {
            return false;
        }
        try {
            return orderRepository.findById(UUID.fromString(orderId))
                    .map(o -> o.getCustomer().getId().toString().equals(auth.getName()))
                    .orElse(false);
        } catch (IllegalArgumentException idInvalido) {
            return false;
        }
    }
}
