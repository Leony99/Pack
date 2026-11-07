# Pack

[![CI/CD](https://github.com/Leony99/Pack/actions/workflows/ci.yml/badge.svg)](https://github.com/Leony99/Pack/actions/workflows/ci.yml)

E-commerce de roupas. O repositório é um monorepo:

| Pasta | O que tem |
|---|---|
| [`backend/`](backend/) | API REST em Spring Boot (descrita abaixo) |
| `frontend/` | Loja em React / Next.js (em desenvolvimento) |
| [`ci-cd/`](ci-cd/) | Pipeline de CI/CD no GitHub Actions: testes e publicação automáticos ([explicação](ci-cd/README.md)) |
| [`producao/`](producao/) | Como a API roda em produção: Google Cloud Run, banco no Neon, limitadores e disjuntor de custos ([explicação](producao/README.md)) |

## Sumário

- [Backend: Pack API](#backend-pack-api)
- [Stack](#stack)
- [O que a API faz](#o-que-a-api-faz)
- [Segurança](#segurança)
- [Organização do código](#organização-do-código)
- [Como rodar](#como-rodar)
  - [1. Configuração](#1-configuração)
  - [2A. Com Docker](#2a-com-docker-só-precisa-do-docker)
  - [2B. Pelo Maven](#2b-pelo-maven-para-programar-precisa-de-java-21-e-docker)
  - [Testando pelo navegador (Swagger)](#testando-pelo-navegador-swagger)
  - [Exemplo rápido](#exemplo-rápido)
- [Testes](#testes)
- [CI/CD](#cicd)
- [Documentação](#documentação)
- [Próximos passos](#próximos-passos)
  - [Por que trocar para o Flyway](#por-que-trocar-para-o-flyway)
  - [Por que usar o Cloud Armor](#por-que-usar-o-cloud-armor)
- [Autor](#autor)

## Backend: Pack API

API REST de um e-commerce de roupas, feita com **Spring Boot 4** e **Java 21**. Cobre o fluxo completo de uma loja: catálogo com variantes (tamanho e cor), estoque, carrinho, cupons, checkout, pagamento e envio. Tem login com JWT e controle de acesso por permissão.

Projeto de portfólio, desenvolvido para estudar como uma API de verdade é organizada, protegida, testada e publicada.

**API no ar:** [Swagger da Pack API](https://pack-api-872578691493.southamerica-east1.run.app/swagger-ui.html). O primeiro acesso pode levar até 1 minuto: a hospedagem é gratuita e a API desliga quando ninguém está usando.

## Stack

| | |
|---|---|
| Linguagem | Java 21 |
| Framework | Spring Boot 4.1 (Web, Data JPA, Validation, Security) |
| Autenticação | JWT (HS256) com o OAuth2 Resource Server do Spring; senhas em BCrypt |
| Banco | PostgreSQL 18 |
| Documentação da API | OpenAPI 3 com springdoc (Swagger UI) |
| Testes | JUnit 6, AssertJ, Mockito, MockMvc e Testcontainers |
| Containers | Docker e Docker Compose |
| CI/CD | GitHub Actions |
| Produção | Google Cloud Run (API) e Neon (banco) |
| Outros | Lombok, Maven Wrapper |

## O que a API faz

- **Catálogo:** produtos com slug automático, variantes com SKU, preço próprio e estoque, imagens, tags, tamanhos e cores. A busca por nome ignora acentos e maiúsculas.
- **Estoque:** só muda por movimento (entrada, saída ou ajuste), que fica registrado no histórico; editar a variante não mexe no estoque. Cada movimento vai até 100.000 unidades, o ajuste pode zerar o estoque, e há uma consulta de estoque baixo.
- **Carrinho e checkout:**
  - o pedido guarda o preço e o endereço do momento da compra, como um *snapshot*;
  - cupons podem ser fixos ou percentuais;
  - se o estoque acabar no meio do checkout, nada é gravado (rollback);
  - compras simultâneas não vendem a mesma unidade duas vezes: o estoque de cada variante é travado no banco (`SELECT ... FOR UPDATE`) enquanto o pedido é gravado;
  - o carrinho também é travado enquanto é alterado ou vira pedido: um duplo clique não cria linhas repetidas nem dois pedidos;
  - um pedido de total zero (cupom que cobre tudo) já nasce pago.
- **Pedido:**
  - o status só avança na ordem: aguardando pagamento → pago → em separação → enviado → entregue;
  - o pedido pode ser cancelado antes do envio: o cancelamento devolve o estoque, estorna o pagamento aprovado e recusa o pendente;
  - o pedido só fica pago pela aprovação de um pagamento, que precisa ter o valor exato do pedido. Pagamentos recebidos por fora são registrados por um funcionário, com o método `OUTRO`;
  - o pagamento segue PENDENTE → APROVADO → ESTORNADO, ou PENDENTE → RECUSADO, sem voltar atrás;
  - o envio só é aceito depois do pagamento aprovado e segue PREPARANDO → DESPACHADO → ENTREGUE. Quando o pacote volta para a loja (a transportadora não entregou ou o cliente devolveu), o envio vira DEVOLVIDO: o pedido fica devolvido, o estoque volta e o pagamento é estornado;
  - o funcionário muda o status do pedido direto só para cancelar. Os outros status vêm do pagamento e do envio, que registram como foi pago e por onde foi entregue;
- **Banco:** na partida, a API atualiza as regras do banco que limitam os valores de cada enum. O Hibernate cria essas regras com a tabela, mas não as atualiza depois, então um valor novo seria recusado num banco já existente. Esta solução é provisória: ver [Próximos passos](#próximos-passos).
- **Conta do cliente:** sem pedidos, apagar a conta apaga o cadastro. Com pedidos, os dados pessoais são anonimizados e os pedidos ficam como histórico.
- **Listagens paginadas:** produtos, clientes, funcionários, cupons, pedidos e movimentos de estoque vêm em páginas (`?pagina=0&tamanho=20`, no máximo 100 por página), com os totais para montar a navegação:

  ```json
  { "itens": [ ... ], "pagina": 0, "tamanho": 20, "totalItens": 347, "totalPaginas": 18 }
  ```
- **Erros padronizados:** 400, 401, 403, 404, 409 e 422 vêm sempre no mesmo formato JSON.

## Segurança

Clientes e funcionários fazem login e recebem um token JWT, que vai no cabeçalho `Authorization: Bearer <token>` das requisições seguintes.

- **Sem login:** só é possível ver o catálogo.
- **Cliente:** acessa apenas o próprio cadastro, endereços, carrinho e pedidos.
- **Funcionário:** o que pode fazer depende das permissões do papel dele. Elas são lidas do banco a cada requisição: excluir um funcionário, trocar o papel dele ou tirar uma permissão do papel vale na hora, mesmo para um token já emitido.

| Papel | Permissões |
|---|---|
| ADMIN | todas |
| ESTOQUISTA | catálogo e estoque |
| ATENDENTE | pedidos e consulta de clientes |
| SUPERVISOR | estoquista + atendente |

**Limite de tentativas** no login e no cadastro, contra quem tenta adivinhar senhas:
- 5 senhas erradas do mesmo e-mail, vindas do mesmo IP, bloqueiam esse par por 15 min;
- 20 falhas ou cadastros vindos do mesmo IP bloqueiam o IP por 15 min.

O mesmo vale para os **cupons**, contra quem tenta adivinhar um código: 5 códigos errados (inexistentes ou vencidos) no checkout deixam o cliente 15 min sem poder usar cupom. A compra sem cupom continua liberada.

Bloqueado, a API responde **429** com o cabeçalho `Retry-After` (os segundos que faltam), sem nem conferir a senha ou o cupom. Isso também protege a cota grátis: cada conferência de senha (BCrypt) gasta CPU de propósito.

**Limite geral por IP**, em todas as rotas: no máximo 120 requisições por minuto do mesmo IP. Para IPv6, conta o bloco /64 inteiro, porque cada casa recebe um bloco e poderia trocar de endereço à vontade. Passou disso, a API responde 429 com `Retry-After` até o minuto acabar.
- O filtro ([`LimitePorIp`](backend/src/main/java/com/leonycosta/packapi/config/LimitePorIp.java)) roda antes da segurança e dos controllers: uma requisição recusada não confere token nem consulta o banco.
- Sem ele, um único IP poderia disparar buscas no catálogo, que é público e lê a tabela a cada busca, até gastar a cota grátis de CPU e o [disjuntor de custos](producao/README.md#disjuntor-de-custos) tirar a API do ar.
- **O que ele não resolve:** o Cloud Run conta cada requisição antes de ela chegar à API, então um ataque grande ou vindo de muitos IPs ainda gasta a cota de requisições. Barrar antes exige o [Cloud Armor](#por-que-usar-o-cloud-armor).
- **Cuidado com o frontend:** se ele chamar a API pelo próprio servidor (renderização no servidor do Next.js), todos os visitantes chegam com o IP desse servidor. Nesse caso, esse IP precisa de um limite próprio.

**Carrinho:** no máximo 99 unidades de cada item, contando o que já está nele. Sem esse teto, uma soma enorme "dava a volta" no `int` e virava um número negativo, que o checkout usava para baixar o estoque.

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
├── config/     SecurityConfig, JwtConfig, OpenApiConfig, Pagina
├── enums/
└── exception/  GlobalExceptionHandler e erros padronizados
```

## Como rodar

### 1. Configuração

Crie o arquivo de configuração local a partir do modelo, na raiz do repositório, e preencha os valores:
- as senhas do banco local;
- a chave do JWT, com pelo menos 32 caracteres;
- o admin inicial.

O `.env` não vai para o git, e as duas formas de rodar abaixo leem esse mesmo arquivo.

```bash
cp .env.example .env
```

### 2A. Com Docker (só precisa do Docker)

```bash
docker compose up --build     # sobe o banco e a API
docker compose down           # desliga (os dados ficam guardados no volume)
docker compose down -v        # desliga e apaga os dados
docker compose logs -f api    # log da API ao vivo
```

O que acontece:

1. **O Compose lê o [`docker-compose.yml`](docker-compose.yml)** e o `.env`.
2. **Monta a imagem da API** seguindo o [`backend/Dockerfile`](backend/Dockerfile), em duas etapas:

   ```
   ┌─ etapa "build" ─────────────────┐      ┌─ imagem final ──────────────────────┐
   │ Maven + JDK 21                  │      │ só o Java (JRE 21, base Alpine)     │
   │ 1. copia o pom.xml e baixa as   │ ───► │ app.jar                             │
   │    dependências (fica em cache) │ .jar │ usuário "pack", sem root            │
   │ 2. copia o código e compila     │      │ java -XX:MaxRAMPercentage=75 -jar   │
   └─────────────────────────────────┘      └─────────────────────────────────────┘
          descartada no fim                        ~127 MB, é o que roda
   ```

   - O Maven e o código-fonte ficam na etapa descartada. A imagem final leva só o `.jar` e o Java.
   - O `pom.xml` é copiado antes do código: quando só o código muda, as dependências já baixadas são reaproveitadas.
   - A API roda com um usuário comum, sem root. A JVM usa no máximo 75% da memória do container, para não ser encerrada por passar do limite.
   - O [`.dockerignore`](backend/.dockerignore) deixa de fora o `target/`, os docs e os `.env`. Senhas nunca entram na imagem.
3. **Sobe o container `db`:**
   - usa a imagem `postgres:18`, a mesma versão de produção;
   - os dados ficam no volume `pack-db-data`;
   - o Compose testa a cada 5 s se o banco já aceita conexões.
4. **Sobe o container `api`** só quando o banco responde. Dentro da rede do Compose, a API encontra o banco pelo nome: `jdbc:postgresql://db:5432/pack-db`.

### 2B. Pelo Maven (para programar; precisa de Java 21 e Docker)

```bash
docker compose up -d db       # só o banco, no Docker
cd backend
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

A API roda direto no Java da sua máquina, o que deixa o reinício mais rápido enquanto você programa. Ela lê o `../.env` e conecta em `localhost:5432`.

Nas duas formas, a API sobe em `http://localhost:8080/api/v1`. As tabelas são criadas pelo Hibernate. As permissões, os papéis e o admin inicial (definido por `ADMIN_EMAIL` e `ADMIN_PASSWORD`) são criados na primeira execução.

### Testando pelo navegador (Swagger)

Abra `http://localhost:8080/swagger-ui.html` (ou o [link da API no ar](https://pack-api-872578691493.southamerica-east1.run.app/swagger-ui.html)). A página lista todas as rotas, com os campos que cada uma recebe e devolve, e permite testá-las direto ali.

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

São 242 testes, que rodam com um comando. É preciso ter o Docker ligado, mas não precisa de `.env` nem do banco de desenvolvimento:

```bash
cd backend
./mvnw test        # Windows: mvnw.cmd test
```

Os passos:
1. O Maven compila o código e os testes.
2. O **Testcontainers** sobe um PostgreSQL 18 novo e descartável no Docker.
3. Os testes rodam contra esse banco.
4. No fim, o container é apagado.

| Tipo | O que faz | Exemplos |
|---|---|---|
| Unidade | Testa uma classe sozinha, sem Spring nem banco; roda em milissegundos | Regras de status do pedido; `CouponService` com o repositório substituído por um mock (Mockito) |
| Integração | Sobe a aplicação inteira com o PostgreSQL descartável e faz requisições pelo MockMvc, passando pela segurança, pelos controllers, pelos services e pelo banco | Cadastro e login, tokens adulterados ou vencidos, permissões de cada papel, checkout com cupom e rollback, pagamento e envio |
| Concorrência | Dispara compras e movimentos de estoque ao mesmo tempo, em threads separadas | Dois clientes comprando a última unidade; cinco clientes disputando três unidades |

Os testes ficam em [`backend/src/test/`](backend/src/test/java/com/leonycosta/packapi), nos mesmos pacotes do código que testam. A base comum, com a configuração do banco descartável e atalhos para montar os dados, fica em `support/`.

Eles também rodam sozinhos a cada envio ao GitHub (ver [CI/CD](#cicd)).

## CI/CD

A cada envio ao GitHub, o **GitHub Actions** roda os testes, monta a imagem Docker e procura falhas de segurança no código (CodeQL) e na imagem (Trivy). Se tudo passa e o envio é para a `main`, ele publica a versão nova no Google Cloud Run (CD). Se um teste falha, nada é publicado.

Como o pipeline funciona, passo a passo, está em **[`ci-cd/README.md`](ci-cd/README.md)**.

## Documentação

Diagramas em [`backend/docs/`](backend/docs/), gerados a partir do próprio código:

- [`erd.svg`](backend/docs/erd.svg): diagrama entidade-relacionamento.
- [`estrutura-pacotes.svg`](backend/docs/estrutura-pacotes.svg) e [`estrutura-pastas.svg`](backend/docs/estrutura-pastas.svg): organização do código.
- `fluxo.html`: página interativa com o caminho de cada requisição, passando pela segurança, pelo controller, pelo service e pelo repository, com o código real. Baixe o arquivo e abra no navegador.

## Próximos passos

- [x] Documentação OpenAPI / Swagger
- [x] Testes automatizados (unidade, integração e concorrência)
- [x] Docker e Docker Compose
- [x] CI/CD com GitHub Actions
- [x] Produção no Google Cloud Run + Neon, com limitadores de custo e disjuntor
- [ ] Frontend (React / Next.js)
- [ ] Migrações do banco com Flyway, no lugar do `ddl-auto=update`
- [ ] Cloud Armor na frente da API, para barrar ataques de volume antes do Cloud Run

### Por que trocar para o Flyway

Hoje o schema do banco é mantido pelo Hibernate com `spring.jpa.hibernate.ddl-auto=update`. Ele cria o que falta, mas não evolui direito um banco que já existe, como o de produção no Neon:

- **Não atualiza as regras CHECK dos enums.** Um valor novo, como o método de pagamento `OUTRO` ou o status `DEVOLVIDO`, seria recusado pelo banco de produção. A correção atual (`config/RestricoesDosEnums`) recria essas regras a cada partida. Ela funciona, mas é um remendo: cobre só os enums, roda DDL em toda subida e depende de uma lista mantida à mão.
- **Não renomeia nem apaga.** Renomear um campo cria uma coluna nova vazia e deixa a antiga com os dados. Mudar o tipo de uma coluna ou preencher dados de uma coluna nova também não acontece.
- **Não deixa registro.** Uma mudança no banco de produção não aparece no git, então não dá para revisar nem repetir em outro banco.

Com o Flyway, cada mudança vira um arquivo SQL numerado (`V1__inicial.sql`, `V2__...sql`). Esses arquivos ficam no repositório e passam pelo PR como qualquer código. Na partida, o Flyway roda só os que aquele banco ainda não recebeu.

Plano da troca:

1. Gerar o `V1__inicial.sql` a partir do schema atual.
2. Marcar o banco do Neon como "já está no V1" (`spring.flyway.baseline-on-migrate`), sem recriar nada.
3. Trocar para `ddl-auto=validate`: a API não sobe se as entidades e o banco não baterem.
4. Apagar o `RestricoesDosEnums`: um enum novo passa a ser uma migração.

Antes de ir para a produção, testar com uma cópia do schema atual no banco local.

### Por que usar o Cloud Armor

O limite geral por IP roda **dentro** da API. Quando ele recusa uma requisição, o Cloud Run já a recebeu e já a contou na cota grátis, que é de 2 milhões de requisições por mês:

```
hoje:         atacante ──► Cloud Run (conta a requisição) ──► LimitePorIp ──► 429
                                 └─ cota grátis gasta → o disjuntor tira a API do ar

com o Armor:  atacante ──► balanceador + Cloud Armor ──► 429   (não chega ao Cloud Run)
              visitante ──► balanceador + Cloud Armor ──► Cloud Run ──► API
```

Hoje, um IP insistente consegue gastar a cota em alguns dias, e muitos IPs juntos em poucas horas. A API não fica mais cara, porque o disjuntor a desliga antes. Mas fica fora do ar: o ataque troca a conta por indisponibilidade.

O **Cloud Armor** é o firewall do Google. Ele fica num balanceador de carga na frente do Cloud Run e barra a requisição ali, antes de ela chegar à API e antes de ela contar na cota.

O que ele traz:
- **limite por IP na borda**, com bloqueio temporário de quem insiste (*rate-based ban*);
- **regras prontas contra ataques conhecidos**, como injeção de SQL e XSS;
- **bloqueio por país ou por lista de IPs**.

Plano:
1. Criar um **balanceador de carga externo** (Application Load Balancer) com um *serverless NEG* apontando para o serviço `pack-api`. Ele precisa de um certificado HTTPS, então de um domínio próprio.
2. Mudar o acesso ao Cloud Run (*ingress*) para `internal-and-cloud-load-balancing`. Assim o endereço `run.app` deixa de aceitar acesso direto, e ninguém dá a volta no Armor.
3. Criar uma política do Cloud Armor com a regra de limite por IP e as regras prontas, e ligá-la ao balanceador.
4. Manter o `LimitePorIp` como segunda camada.
5. Ajustar o disjuntor e o orçamento, que passam a ter um custo fixo.

**Por que não está feito:** custa dinheiro todo mês. O balanceador custa por volta de US$ 18 por mês, e o Cloud Armor cobra por política, por regra e por milhão de requisições (valores aproximados: conferir a tabela de preços do Google). Isso não cabe na proposta de custo zero do projeto. Vale fazer quando a API tiver uso real.

## Autor

**Leony Costa**
