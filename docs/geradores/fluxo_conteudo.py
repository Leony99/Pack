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
        "    .[m|authorizeHttpRequests](auth -> auth.[m|anyRequest]().[m|permitAll]())",
        "    .[m|build]();",
        "[c|// temporário: libera todas as rotas até a Fase 8 (JWT)]",
    ]))

    add(Box("tomcat", "Servidor no ar", [
        "[c|// no log aparece algo como:]",
        "Tomcat started on port [a|8080] (http)",
        "Started PackApiApplication in 3.1 seconds",
        "",
        "[c|// a partir daqui a API fica esperando requisições]",
    ], style="data"))

    return b
