package com.leonycosta.packapi.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Documentação da API: as rotas são lidas dos controllers pelo springdoc; aqui entram o título e o login.
// Página em /swagger-ui.html, especificação em /v3/api-docs.
@Configuration
public class OpenApiConfig {

    private static final String BEARER = "bearer-jwt";

    @Bean
    OpenAPI packOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Pack API")
                        .version("v1")
                        .description("""
                                API REST de um e-commerce de roupas.

                                Para testar rotas protegidas: faça login em `/api/v1/auth/login` (cliente) \
                                ou `/api/v1/auth/staff/login` (funcionário), copie o `token` da resposta \
                                e cole no botão **Authorize**."""))
                // botão Authorize: o token colado vai no cabeçalho Authorization: Bearer <token>
                .components(new Components().addSecuritySchemes(BEARER, new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER));
    }
}
