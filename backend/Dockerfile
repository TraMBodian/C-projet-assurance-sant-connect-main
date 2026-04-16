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

# PORT env var is set by Railway/Render automatically
EXPOSE 3001

ENTRYPOINT ["sh", "-c", "java -jar app.jar \
  --server.port=${PORT:-3001} \
  --spring.profiles.active=h2 \
  --app.jwtSecret=${JWT_SECRET:-We7/Ty05ZUgeNXizXvsYVB2wNn1jiYR723q2Ho0EubelOwQhNSKtMizs/+29jNl1NGazGPrP2/WngrgDq1OuRw==} \
  --app.jwtExpirationMs=86400000"]
