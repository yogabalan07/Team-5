# Inventory Management Backend

Spring Boot Maven backend starter for the Inventory Management System.

## Tech Stack

- Java 17
- Spring Boot
- Spring Web
- Spring Data JPA
- MySQL Driver
- Lombok
- Spring Validation

## Project Structure

- `src/main/java/com/inventory/controller` contains REST controller classes.
- `src/main/java/com/inventory/service` contains service-layer classes.
- `src/main/java/com/inventory/repository` contains Spring Data repository interfaces.
- `src/main/java/com/inventory/model` contains JPA entity classes.
- `src/main/java/com/inventory/dto` contains request and response DTO classes.
- `src/main/java/com/inventory/config` contains backend configuration classes.
- `src/main/java/com/inventory/security` contains security-related classes.
- `src/main/java/com/inventory/exception` contains exception handling classes.
- `src/main/resources` contains application configuration and static resources.
- `src/test` is reserved for backend tests.

## Setup

1. Install Java 17 or later.
2. Install Maven.
3. Create a MySQL database for the project.
4. Update `src/main/resources/application.properties` with your database username, password, and database name.
5. Run the backend:

```bash
mvn spring-boot:run
```

The backend starts on `http://localhost:8080` by default.
