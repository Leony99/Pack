# Imagem da Pack API, em duas etapas:
#   1. "build": uma imagem com Maven + JDK compila o projeto e gera o .jar
#   2. final:   uma imagem só com o Java (JRE) recebe o .jar e roda a aplicação
# Assim a imagem final fica pequena e não leva Maven, código-fonte nem dependências de teste.

# --- Etapa 1: compilar ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Primeiro só o pom.xml: o Docker guarda esta camada em cache, então as dependências
# só são baixadas de novo quando o pom.xml muda (e não a cada alteração no código).
COPY pom.xml .
RUN mvn -q dependency:go-offline

COPY src ./src
# Os testes não rodam aqui: eles sobem o próprio banco com Docker (ver README) e rodam no CI.
RUN mvn -q package -DskipTests

# --- Etapa 2: rodar ---
# Variante Alpine (Linux mínimo): a imagem fica bem menor, o que importa no registro de imagens
# do Google Cloud, que tem só 0,5 GB grátis.
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Não roda como root: se alguém invadir a aplicação, não tem poder sobre o container.
RUN addgroup -S pack && adduser -S -G pack pack
USER pack

COPY --from=build /build/target/*.jar app.jar

EXPOSE 8080
# MaxRAMPercentage: a JVM usa até 75% da memória do container (o resto fica para o próprio Java e o sistema).
# Sem isso, num container de 1 GB o Java pode passar do limite e ser encerrado.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
