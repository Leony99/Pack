package com.leonycosta.packapi.config;

import com.leonycosta.packapi.auth.AccessGuard;
import com.leonycosta.packapi.staff.permission.Permissao;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;

import static com.leonycosta.packapi.staff.permission.Permissao.*;

// Todas as regras de acesso da API. São testadas de cima para baixo: vale a primeira que combinar.
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String[] CATALOGO = {
            "/api/v1/products/**", "/api/v1/variants/**", "/api/v1/tags/**", "/api/v1/sizes/**", "/api/v1/colors/**"
    };

    private final AccessGuard guard;
    private final SecurityErrorHandler errorHandler;
    private final JwtAuthenticationConverter jwtAuthenticationConverter;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // API sem sessão nem formulário: cada requisição traz o próprio token, então CSRF não se aplica
                .csrf(csrf -> csrf.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .oauth2ResourceServer(o -> o
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter))
                        .authenticationEntryPoint(errorHandler))
                .exceptionHandling(e -> e.authenticationEntryPoint(errorHandler).accessDeniedHandler(errorHandler))
                .authorizeHttpRequests(auth -> auth
                        // ── público ──
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/register", "/api/v1/auth/login",
                                "/api/v1/auth/staff/login").permitAll()
                        .requestMatchers("/error", "/actuator/health").permitAll()
                        // documentação: a página do Swagger e o JSON que ela lê
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**").permitAll()

                        // ── estoque (antes da leitura pública de /variants) ──
                        .requestMatchers(HttpMethod.GET, "/api/v1/variants/estoque-baixo",
                                "/api/v1/variants/*/movements").hasAuthority(INVENTORY_MANAGE.name())
                        .requestMatchers("/api/v1/inventory/**").hasAuthority(INVENTORY_MANAGE.name())

                        // ── catálogo: qualquer um vê, só quem tem CATALOG_WRITE altera ──
                        .requestMatchers(HttpMethod.GET, CATALOGO).permitAll()
                        .requestMatchers(CATALOGO).hasAuthority(CATALOG_WRITE.name())
                        .requestMatchers("/api/v1/images/**").hasAuthority(CATALOG_WRITE.name())

                        // ── cupons, funcionários e papéis ──
                        .requestMatchers("/api/v1/coupons/**").hasAuthority(COUPON_MANAGE.name())
                        .requestMatchers("/api/v1/staff/**", "/api/v1/roles/**", "/api/v1/permissions/**")
                                .hasAuthority(STAFF_MANAGE.name())

                        // ── área do cliente: só o próprio cliente; funcionário com CUSTOMER_READ só consulta ──
                        .requestMatchers(HttpMethod.GET, "/api/v1/customers").hasAuthority(CUSTOMER_READ.name())
                        .requestMatchers(HttpMethod.POST, "/api/v1/customers/{customerId}/orders").access(proprioCliente())
                        .requestMatchers(HttpMethod.GET, "/api/v1/customers/{customerId}", "/api/v1/customers/{customerId}/**")
                                .access(proprioClienteOu(CUSTOMER_READ))
                        .requestMatchers("/api/v1/customers/{customerId}", "/api/v1/customers/{customerId}/**")
                                .access(proprioCliente())

                        // ── pedidos: o dono consulta e paga; funcionário com ORDER_MANAGE gerencia ──
                        .requestMatchers(HttpMethod.GET, "/api/v1/orders/{orderId}", "/api/v1/orders/{orderId}/payment",
                                "/api/v1/orders/{orderId}/shipment").access(donoDoPedidoOu(ORDER_MANAGE))
                        .requestMatchers(HttpMethod.POST, "/api/v1/orders/{orderId}/payment").access(donoDoPedido())
                        .requestMatchers("/api/v1/orders/**", "/api/v1/payments/**", "/api/v1/shipments/**")
                                .hasAuthority(ORDER_MANAGE.name())

                        // ── o resto exige login (rotas inexistentes viram 404 para quem está logado) ──
                        .anyRequest().authenticated())
                .build();
    }

    private AuthorizationManager<RequestAuthorizationContext> proprioCliente() {
        return (auth, ctx) -> new AuthorizationDecision(guard.isSelf(auth.get(), ctx.getVariables().get("customerId")));
    }

    private AuthorizationManager<RequestAuthorizationContext> proprioClienteOu(Permissao permissao) {
        return (auth, ctx) -> new AuthorizationDecision(
                guard.isSelf(auth.get(), ctx.getVariables().get("customerId")) || guard.has(auth.get(), permissao.name()));
    }

    private AuthorizationManager<RequestAuthorizationContext> donoDoPedido() {
        return (auth, ctx) -> new AuthorizationDecision(guard.ownsOrder(auth.get(), ctx.getVariables().get("orderId")));
    }

    private AuthorizationManager<RequestAuthorizationContext> donoDoPedidoOu(Permissao permissao) {
        return (auth, ctx) -> new AuthorizationDecision(
                guard.has(auth.get(), permissao.name()) || guard.ownsOrder(auth.get(), ctx.getVariables().get("orderId")));
    }
}
