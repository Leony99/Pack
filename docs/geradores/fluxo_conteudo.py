# Caixas da parte 1 do fluxo (a aplicação inicia), usadas por gen_fluxo.py
# Escritas à mão: atualizar quando application.properties ou SecurityConfig mudarem.
# Cada chamada de caixas() devolve objetos novos, porque o layout grava posição em cada Box.

from diagrama import Box


def caixas():
    b = {}

    def add(box):
        b[box.id] = box

    add(Box("main", "PackApiApplication.main()", [
        "[k|@SpringBootApplication]",
        "public class PackApiApplication {",
        "",
        "    public static void [m|main](String[] [a|args]) {",
        "        [a|SpringApplication].[m|run]([a|PackApiApplication].class, [a|args]);",
        "    }",
        "}",
    ]))

    add(Box("run", "SpringApplication.run()  ·  o que acontece ao iniciar", [
        "[c|// 1. lê as configurações]",
        "carrega o [a|application.properties]  @@props",
        "",
        "[c|// 2. procura classes anotadas em com.leonycosta.packapi]",
        "cria um objeto (bean) de cada [k|@RestController], [k|@Service],",
        "[k|@Repository], [k|@Configuration] e [k|@RestControllerAdvice]  @@beans",
        "",
        "[c|// 3. conecta no banco e confere as tabelas]",
        "inicia o Hibernate com as classes [k|@Entity]  @@hib",
        "",
        "[c|// 4. liga a segurança]",
        "monta a [a|SecurityFilterChain] do [a|SecurityConfig]  @@sec",
        "",
        "[c|// 5. sobe o servidor web embutido]",
        "inicia o Tomcat na porta [a|8080]",
    ]))

    add(Box("props", "application.properties", [
        "[a|spring.datasource.url]=jdbc:postgresql://localhost:5432/pack-db",
        "[a|spring.datasource.username]=postgres",
        "[a|spring.jpa.hibernate.ddl-auto]=update   [c|# cria/atualiza as tabelas]",
        "[a|spring.jpa.show-sql]=true              [c|# mostra o SQL no log]",
        "[a|server.port]=8080                      [c|# porta da API]",
        "[a|jwt.secret]=${JWT_SECRET:...}          [c|# chave que assina os tokens]",
        "[a|jwt.expiration-minutes]=60             [c|# validade do token]",
    ], style="pkg"))

    add(Box("beans", "Beans  ·  o Spring cria e conecta as classes", [
        "[c|// cria cada classe e entrega as dependências pelo construtor]",
        "[c|// (o @RequiredArgsConstructor do Lombok gera esse construtor)]",
        "",
        "AddressRepository  [c|← implementação gerada pelo Spring Data]",
        "CustomerService    [c|← recebe CustomerRepository, CartRepository]",
        "AddressService     [c|← recebe AddressRepository, CustomerService]",
        "AddressController  [c|← recebe AddressService]",
        "",
        "[c|// ...e o mesmo para os outros 13 domínios]",
    ]))

    add(Box("hib", "Hibernate  ·  ddl-auto=update", [
        "[c|// lê cada classe @Entity...]",
        "[a|Address], [a|Customer], [a|Order], [a|Product], ...",
        "",
        "[c|// ...compara com o banco pack-db e cria o que falta]  @@tables",
    ]))

    add(Box("tables", "PostgreSQL  ·  pack-db", [
        "[k|CREATE TABLE] addresses (",
        "    id          uuid [k|PRIMARY KEY],",
        "    customer_id uuid [k|NOT NULL] [k|REFERENCES] customers,",
        "    cep         varchar(255) [k|NOT NULL],",
        "    ...",
        ");",
        "[c|-- se a tabela já existe, só adiciona as colunas novas]",
    ], style="data"))

    add(Box("sec", "SecurityConfig.securityFilterChain()", [
        "return [a|http]",
        "    .[m|csrf](csrf -> csrf.[m|disable]())",
        "    .[m|sessionManagement](s -> s.[m|sessionCreationPolicy]([a|STATELESS]))",
        "    .[m|oauth2ResourceServer]([a|jwt])     [c|// confere o token de cada requisição]  @@jwt",
        "    .[m|authorizeHttpRequests](...)       [c|// regras por rota e permissão]",
        "    .[m|build]();",
        "[c|// catálogo público; carrinho e pedidos só do dono;]",
        "[c|// gestão exige permissão (CATALOG_WRITE, ORDER_MANAGE...)]",
        "[c|// AuthDataSeeder cria permissões, papéis e o admin inicial]",
    ]))

    add(Box("jwt", "JwtConfig  ·  as peças do token", [
        "[c|// a mesma chave (jwt.secret) assina e confere: HMAC-SHA256]",
        "[m|SecretKey]                 [c|← jwt.secret em bytes]",
        "[m|JwtEncoder]                [c|← o TokenService usa para assinar no login]",
        "[m|JwtDecoder]                [c|← o filtro usa para conferir a cada requisição]",
        "[m|JwtAuthenticationConverter] [c|← claim authorities → permissões]",
        "[m|PasswordEncoder] (BCrypt)  [c|← senha vira hash; nunca salva em texto]",
        "",
        "[c|// um token tem 3 partes em Base64, separadas por ponto:]",
        "[s|cabeçalho].[s|payload].[s|assinatura]",
        "[c|// payload: sub (id), nome, email, tipo, authorities, exp]",
        "[c|// quem mudar o payload invalida a assinatura → 401]",
    ]))

    add(Box("tomcat", "Servidor no ar", [
        "[c|// no log aparece algo como:]",
        "Tomcat started on port [a|8080] (http)",
        "Started PackApiApplication in 3.1 seconds",
        "",
        "[c|// a partir daqui a API fica esperando requisições]",
    ], style="data"))

    return b
