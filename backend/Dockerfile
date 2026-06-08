# --- Stage 1: Build the Spring Boot fat jar with Maven ---
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Cache dependencies first (only re-downloads when pom.xml changes)
COPY pom.xml .
RUN mvn -q -B dependency:go-offline

# Build the application
COPY src ./src
RUN mvn -q -B clean package -DskipTests

# --- Stage 2: Minimal runtime image ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/target/apna-shop-backend-1.0.0.jar app.jar

# Tuned for Render's free tier (512 MB RAM). MaxRAMPercentage keeps the JVM
# heap within the container limit; SerialGC has the lowest memory overhead.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=70.0 -XX:+UseSerialGC -XX:+UseContainerSupport"

# Render injects PORT; the app reads it via server.port=${PORT}
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
