package com.leonycosta.packapi.support;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;

// Banco dos testes: um PostgreSQL novo, num container do Docker, criado quando os testes começam
// e apagado quando terminam. O @ServiceConnection faz o Spring usar a URL, o usuário e a senha
// desse container no lugar do spring.datasource.* do application.properties.
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfig {

    @Bean
    @ServiceConnection
    PostgreSQLContainer postgres() {
        // mesma imagem do banco de desenvolvimento, que já está baixada
        return new PostgreSQLContainer("postgres:16");
    }
}
