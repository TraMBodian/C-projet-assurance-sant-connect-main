# ── Build stage ──────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache dependencies first
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Build app
COPY src ./src
RUN mvn package -DskipTests -q

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 3001

ENTRYPOINT ["sh", "-c", "java \
  -Dfile.encoding=UTF-8 \
  -Dstdout.encoding=UTF-8 \
  -Dspring.profiles.active=${SPRING_PROFILE:-postgres} \
  -jar app.jar \
  --server.port=${PORT:-3001}"]
