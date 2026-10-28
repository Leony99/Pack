# Pack

E-commerce de roupas dividido em duas partes:

| Pasta | O que tem |
|---|---|
| [`backend/`](backend/) | API REST em Spring Boot (descrita abaixo) |
| `frontend/` | Loja em React / Next.js (em desenvolvimento) |

## Backend: Pack API

API REST de um e-commerce de roupas, feita com **Spring Boot 4** e **Java 21**. Cobre o fluxo completo de uma loja: catálogo com variantes (tamanho e cor), estoque, carrinho, cupons, checkout, pagamento e envio. Tem login com JWT e controle de acesso por permissão.

Projeto de portfólio, desenvolvido para estudar como uma API de verdade é organizada, protegida e testada.

## Stack

| | |
|---|---|
| Linguagem | Java 21 |
| Framework | Spring Boot 4.1 (Web, Data JPA, Validation, Security) |
| Autenticação | JWT (HS256) com o OAuth2 Resource Server do Spring; senhas em BCrypt |
| Banco | PostgreSQL 16 (Docker) |
| Documentação | OpenAPI 3 com springdoc (Swagger UI) |
| Testes | JUnit 6, AssertJ, Mockito, MockMvc e Testcontainers |
| Outros | Lombok, Maven Wrapper |

## O que a API faz

- **Catálogo:** produtos com slug automático, variantes com SKU, preço próprio e estoque, imagens, tags, tamanhos e cores. A busca por nome ignora acentos e maiúsculas.
- **Estoque:** entradas, saídas e ajustes ficam registrados como movimentos, e há uma consulta de estoque baixo.
- **Carrinho e checkout:**
  - o pedido guarda o preço e o endereço do momento da compra, como um *snapshot*;
  - cupons podem ser fixos ou percentuais;
  - se o estoque acabar no meio do checkout, nada é gravado (rollback);
  - compras simultâneas não vendem a mesma unidade duas vezes: o estoque de cada variante é travado no banco (`SELECT ... FOR UPDATE`) enquanto o pedido é gravado.
- **Pedido:**
  - o status só avança na ordem: aguardando pagamento → pago → em separação → enviado → entregue;
  - o pedido pode ser cancelado antes do envio, e o cancelamento devolve o estoque;
  - o pagamento precisa ter o valor exato do pedido, e o envio só é aceito depois do pagamento aprovado.
- **Erros padronizados:** 400, 401, 403, 404, 409 e 422 vêm sempre no mesmo formato JSON.

## Segurança

Clientes e funcionários fazem login e recebem um token JWT, que vai no cabeçalho `Authorization: Bearer <token>` das requisições seguintes.

- **Sem login:** só é possível ver o catálogo.
- **Cliente:** acessa apenas o próprio cadastro, endereços, carrinho e pedidos.
- **Funcionário:** o que pode fazer depende das permissões do papel dele.

| Papel | Permissões |
|---|---|
| ADMIN | todas |
| ESTOQUISTA | catálogo e estoque |
| ATENDENTE | pedidos e consulta de clientes |
| SUPERVISOR | estoquista + atendente |

Todas as regras de acesso ficam em um só lugar: [`SecurityConfig`](backend/src/main/java/com/leonycosta/packapi/config/SecurityConfig.java).

## Organização do código

Os pacotes seguem o modelo *package-by-feature*, agrupados por categoria. Cada domínio tem a própria pasta, com entidade, repository, service, controller e DTOs:

```
backend/src/main/java/com/leonycosta/packapi/
├── staff/      staff, role, permission, role_permission
├── customer/   customer, address
├── cart/       cart, cart_item
├── order/      order, order_item, payment, shipment, coupon
├── product/    product, product_variant, product_image, product_tag, size, color, inventory
├── auth/       login, cadastro, geração do token e regras de "dono"
├── config/     SecurityConfig, JwtConfig, OpenApiConfig
├── enums/
└── exception/  GlobalExceptionHandler e erros padronizados
```

## Como rodar

**Requisitos:** Java 21 ou mais recente e Docker.

1. Suba o PostgreSQL:
   ```bash
   docker run --name pack -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pack-db -p 5432:5432 -d postgres:16
   ```
2. Entre na pasta do backend e crie o arquivo de configuração local a partir do modelo. Depois preencha os valores; o `JWT_SECRET` precisa ter pelo menos 32 caracteres.
   ```bash
   cd backend
   cp .env.example .env
   ```
3. Rode a aplicação:
   ```bash
   ./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
   ```

A API sobe em `http://localhost:8080/api/v1`. As tabelas são criadas pelo Hibernate. As permissões, os papéis e o admin inicial (definido por `ADMIN_EMAIL` e `ADMIN_PASSWORD`) são criados na primeira execução.

### Testando pelo navegador (Swagger)

Com a aplicação rodando, abra `http://localhost:8080/swagger-ui.html`. A página lista todas as rotas, com os campos que cada uma recebe e devolve, e permite testá-las direto ali.

Para as rotas protegidas:
1. Faça login em `POST /api/v1/auth/staff/login` com o admin do `.env` (ou em `/auth/login`, como cliente).
2. Copie o `token` da resposta.
3. Clique em **Authorize** e cole o token.

A especificação OpenAPI, em JSON, fica em `/v3/api-docs` e pode ser importada no Postman.

### Exemplo rápido

```bash
# cadastro de cliente: já devolve o token
curl -X POST localhost:8080/api/v1/auth/register -H "Content-Type: application/json" \
  -d '{"nome":"Maria","email":"maria@email.com","telefone":"21999990000","senha":"minhasenha1"}'

# rota protegida, usando o token recebido
curl localhost:8080/api/v1/auth/me -H "Authorization: Bearer <token>"
```

## Testes

São 177 testes, que rodam com um comando. É preciso ter o Docker ligado, mas não precisa de `.env` nem do banco de desenvolvimento:

```bash
cd backend
./mvnw test        # Windows: mvnw.cmd test
```

| Tipo | O que faz | Exemplos |
|---|---|---|
| Unidade | Testa uma classe sozinha, sem Spring nem banco; roda em milissegundos | Regras de status do pedido; `CouponService` com o repositório substituído por um mock (Mockito) |
| Integração | Sobe a aplicação inteira com um PostgreSQL descartável (Testcontainers) e faz requisições pelo MockMvc, passando pela segurança, pelos controllers, pelos services e pelo banco | Cadastro e login, tokens adulterados ou vencidos, permissões de cada papel, checkout com cupom e rollback, pagamento e envio |
| Concorrência | Dispara compras e movimentos de estoque ao mesmo tempo, em threads separadas | Dois clientes comprando a última unidade; cinco clientes disputando três unidades |

Os testes ficam em [`backend/src/test/`](backend/src/test/java/com/leonycosta/packapi), nos mesmos pacotes do código que testam. A base comum, com a configuração do banco descartável e atalhos para montar os dados, fica em `support/`.

## Documentação

Os diagramas ficam em [`backend/docs/`](backend/docs/) e são gerados por scripts Python em [`backend/docs/geradores/`](backend/docs/geradores/), a partir do próprio código.

- [`erd.svg`](backend/docs/erd.svg): diagrama entidade-relacionamento.
- [`estrutura-pacotes.svg`](backend/docs/estrutura-pacotes.svg) e [`estrutura-pastas.svg`](backend/docs/estrutura-pastas.svg): organização do código.
- `fluxo.html`: página interativa com o caminho de cada requisição, passando pela segurança, pelo controller, pelo service e pelo repository, com o código real. Baixe o arquivo e abra no navegador.

## Próximos passos

- [x] Documentação OpenAPI / Swagger
- [x] Testes automatizados (unidade, integração e concorrência)
- [ ] Docker Compose (API + banco)
- [ ] CI/CD com GitHub Actions
- [ ] Deploy na AWS

## Autor

**Leony Costa**
