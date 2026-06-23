# Backend Authentication Module Setup Guide

## Prerequisites

- Java 21
- Maven 3.8+
- MySQL 8.0+
- Git

## Installation & Setup

### 1. Database Setup

#### Create Database
```sql
CREATE DATABASE inventory_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Run Schema Script
```bash
mysql -u root -p inventory_management < database/schema.sql
```

### 2. Environment Variables

Set the following environment variables before running the application:

```bash
# Database Configuration
export DB_URL="jdbc:mysql://localhost:3306/inventory_management"
export DB_USERNAME="root"
export DB_PASSWORD="your_password"

# JWT Configuration
export JWT_SECRET="your-super-secret-key-minimum-32-characters-recommended"
export JWT_EXPIRATION="86400000"  # 24 hours in milliseconds

# CORS Configuration
export CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
```

#### Windows (PowerShell)
```powershell
[System.Environment]::SetEnvironmentVariable("DB_URL", "jdbc:mysql://localhost:3306/inventory_management", "User")
[System.Environment]::SetEnvironmentVariable("DB_USERNAME", "root", "User")
[System.Environment]::SetEnvironmentVariable("DB_PASSWORD", "your_password", "User")
[System.Environment]::SetEnvironmentVariable("JWT_SECRET", "your-super-secret-key-minimum-32-characters", "User")
[System.Environment]::SetEnvironmentVariable("JWT_EXPIRATION", "86400000", "User")
```

#### Linux/Mac (.bashrc or .zshrc)
```bash
export DB_URL="jdbc:mysql://localhost:3306/inventory_management"
export DB_USERNAME="root"
export DB_PASSWORD="your_password"
export JWT_SECRET="your-super-secret-key-minimum-32-characters-recommended"
export JWT_EXPIRATION="86400000"
export CORS_ORIGINS="http://localhost:5173,http://localhost:3000"
```

### 3. Build and Run Backend

```bash
cd backend

# Install dependencies
mvn clean install

# Run the application
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### 4. Verify Setup

Test the health check endpoint:
```bash
curl http://localhost:8080/api/auth/health
```

Expected response:
```json
{
  "success": true,
  "message": "API is healthy"
}
```

## Initial Admin User

The application automatically creates an admin user on startup if it doesn't exist:

- **Username:** admin
- **Password:** admin123
- **Role:** ADMIN

Change the password after first login for security!

## Project Structure

```
src/main/java/com/inventory/
├── config/              # Spring configuration classes
│   └── SecurityConfig.java
├── controller/          # REST controllers
│   └── AuthController.java
├── dto/                 # Data Transfer Objects
│   ├── LoginRequest.java
│   ├── LoginResponse.java
│   └── ApiResponse.java
├── entity/              # JPA entities
│   ├── User.java
│   └── UserRole.java
├── exception/           # Custom exceptions
│   └── AuthenticationException.java
├── repository/          # Data access layer
│   └── UserRepository.java
├── security/            # Security utilities
│   ├── JwtUtil.java
│   ├── JwtAuthenticationFilter.java
│   └── CustomUserDetails.java
├── service/             # Business logic
│   └── AuthService.java
└── util/                # Utility classes
    └── DataInitializer.java
```

## API Endpoints

### POST /api/auth/login
Login endpoint for user authentication.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123",
  "role": "ADMIN"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "admin",
  "role": "ADMIN",
  "userId": 1
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

### GET /api/auth/health
Health check endpoint.

**Response (200):**
```json
{
  "success": true,
  "message": "API is healthy"
}
```

## JWT Token Usage

Include the JWT token in all protected API requests:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:8080/api/protected-endpoint
```

## Creating New Users

Currently, only the admin user is automatically created. To create additional users, use the `UserRepository` or create an admin endpoint.

Example Java code:
```java
User newUser = new User();
newUser.setUsername("manager");
newUser.setPassword(passwordEncoder.encode("password123"));
newUser.setRole(UserRole.MANAGER);
userRepository.save(newUser);
```

## Troubleshooting

### Database Connection Error
- Ensure MySQL is running
- Verify database credentials in environment variables
- Check if database exists: `SHOW DATABASES;`

### JWT Token Issues
- Ensure `JWT_SECRET` is set and consistent
- Check token expiration: Default is 24 hours
- Verify token format: `Bearer <token>`

### CORS Errors
- Update `CORS_ORIGINS` environment variable with your frontend URL
- Ensure frontend is making requests to correct backend URL

## Security Considerations

1. Change the default admin password immediately
2. Use strong JWT_SECRET (minimum 32 characters)
3. Never hardcode credentials
4. Always use HTTPS in production
5. Implement rate limiting for login attempts
6. Consider adding email verification
7. Implement password reset functionality

## Next Steps

1. Implement user registration endpoint
2. Add password reset functionality
3. Implement role-based authorization for other endpoints
4. Add user management endpoints (CRUD)
5. Implement audit logging
6. Add refresh token mechanism
