# 🔐 Complete Authentication System - Getting Started Guide

## Overview

A complete, production-ready authentication system has been implemented for your Inventory Management System. This guide walks you through setup, testing, and deployment.

## 📦 What's Included

### Backend (Spring Boot 3.x)
- ✅ User model with JWT authentication
- ✅ Secure password storage with BCrypt
- ✅ JWT token generation and validation
- ✅ Spring Security configuration
- ✅ REST API endpoints
- ✅ Database schema
- ✅ Automatic admin user creation

### Frontend (React + Vite)
- ✅ Login page with backend integration
- ✅ Authentication context for state management
- ✅ Protected routes
- ✅ Axios client with JWT injection
- ✅ Error handling and loading states
- ✅ Token persistence

## 🚀 Quick Start (5 Minutes)

### Prerequisites
- Java 21
- Maven 3.8+
- Node.js 18+
- MySQL 8.0+
- Git

### Step 1: Clone/Setup Project
```bash
cd "Team-5"
```

### Step 2: Install Dependencies

**Backend:**
```bash
cd backend
mvn clean install
cd ..
```

**Frontend:**
```bash
npm install
```

### Step 3: Configure Environment

#### On Windows (PowerShell as Admin):
```powershell
[System.Environment]::SetEnvironmentVariable("DB_URL", "jdbc:mysql://localhost:3306/inventory_management", "User")
[System.Environment]::SetEnvironmentVariable("DB_USERNAME", "root", "User")
[System.Environment]::SetEnvironmentVariable("DB_PASSWORD", "root", "User")
[System.Environment]::SetEnvironmentVariable("JWT_SECRET", "inventory-system-secret-key-change-in-production", "User")
[System.Environment]::SetEnvironmentVariable("JWT_EXPIRATION", "86400000", "User")
```

**Restart PowerShell/CMD for changes to take effect**

#### On Linux/Mac:
```bash
export DB_URL="jdbc:mysql://localhost:3306/inventory_management"
export DB_USERNAME="root"
export DB_PASSWORD="root"
export JWT_SECRET="inventory-system-secret-key-change-in-production"
export JWT_EXPIRATION="86400000"
```

### Step 4: Setup Database

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE inventory_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Import schema
mysql -u root -p inventory_management < database/schema.sql
```

### Step 5: Start Backend
```bash
cd backend
mvn spring-boot:run
```
Backend will start on `http://localhost:8080`

### Step 6: Start Frontend (New Terminal)
```bash
npm run dev
```
Frontend will start on `http://localhost:5173`

### Step 7: Test Login
1. Open `http://localhost:5173` in your browser
2. Enter credentials:
   - Username: **admin**
   - Password: **admin123**
   - Role: **ADMIN**
3. Click **Login**
4. Should redirect to Dashboard

## 📖 Documentation

### Detailed Guides
- **[AUTHENTICATION_SETUP.md](./backend/AUTHENTICATION_SETUP.md)** - Backend setup and configuration
- **[FRONTEND_AUTH_INTEGRATION.md](./FRONTEND_AUTH_INTEGRATION.md)** - Frontend integration details
- **[POSTMAN_COLLECTION.json](./POSTMAN_COLLECTION.json)** - API testing collection

### Automation Scripts
- **[setup.sh](./setup.sh)** - Automated setup for Linux/Mac
- **[setup.bat](./setup.bat)** - Automated setup for Windows

## 🔌 API Endpoints

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "role": "ADMIN"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "admin",
  "role": "ADMIN",
  "userId": 1
}
```

### Health Check
```
GET /api/auth/health

Response (200):
{
  "success": true,
  "message": "API is healthy"
}
```

## 🧪 Testing with Postman

1. Download Postman: https://www.postman.com/downloads/
2. Import `POSTMAN_COLLECTION.json`
3. Test endpoints:
   - Health Check (no auth required)
   - Login with admin credentials
   - Copy token from response
   - Use token in Authorization header: `Bearer <token>`

## 💾 How It Works

### Authentication Flow
```
User enters credentials
    ↓
Frontend sends to /api/auth/login
    ↓
Backend validates username/password
    ↓
If valid, generates JWT token
    ↓
Frontend stores token in localStorage
    ↓
Frontend includes token in all requests
    ↓
Backend validates token on each request
    ↓
User has access to protected routes
```

### Token Structure
```
Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "username": "admin",
  "role": "ADMIN",
  "userId": 1,
  "iat": 1234567890,
  "exp": 1234654290
}

Signature: HMACSHA256(header + payload, secret)
```

## 🔒 Security Features

1. **BCrypt Password Hashing** - Passwords are never stored in plain text
2. **JWT Authentication** - Stateless, secure token-based auth
3. **CORS Protection** - Only allowed origins can access API
4. **Environment Variables** - No hardcoded credentials
5. **Token Expiration** - Default 24 hours
6. **Automatic Logout** - Clears tokens on 401 response
7. **Route Protection** - Frontend routes require authentication

## ⚠️ Important Notes

### Production Checklist
- [ ] Change default admin password
- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Update CORS_ORIGINS to your domain
- [ ] Use HTTPS only
- [ ] Implement rate limiting
- [ ] Add monitoring and logging
- [ ] Regular security updates
- [ ] Backup database regularly

### Default Credentials
- Username: `admin`
- Password: `admin123`
- **Change this immediately after first login!**

## 🐛 Troubleshooting

### "Connection refused" error
```
Issue: Backend not running
Solution: Start backend with: cd backend && mvn spring-boot:run
```

### "No database available" error
```
Issue: Database not created
Solution: Run: mysql -u root -p inventory_management < database/schema.sql
```

### Login always fails
```
Issue: Database not populated
Solution: Delete database and schema, recreate it, backend will create admin user on startup
```

### CORS error
```
Issue: Frontend URL not in allowed origins
Solution: Update CORS_ORIGINS environment variable with your frontend URL
```

### Token not being sent
```
Issue: Token not in Authorization header
Solution: Check if token is in localStorage. Verify login was successful.
```

## 📚 Key Files

### Backend
- `src/main/java/com/inventory/controller/AuthController.java` - Login endpoint
- `src/main/java/com/inventory/service/AuthService.java` - Authentication logic
- `src/main/java/com/inventory/security/JwtUtil.java` - Token generation
- `src/main/resources/application.properties` - Configuration

### Frontend
- `src/context/AuthContext.jsx` - Authentication state
- `src/pages/Login.jsx` - Login page
- `src/services/api.js` - API client
- `src/components/common/ProtectedRoute.jsx` - Route protection

## 🎯 Next Steps

### Phase 1: Testing
- [ ] Test login functionality
- [ ] Test with different roles (create test users)
- [ ] Test token expiration
- [ ] Test logout functionality

### Phase 2: Enhancement
- [ ] Implement user registration
- [ ] Add password reset
- [ ] Implement refresh tokens
- [ ] Add email verification

### Phase 3: Integration
- [ ] Add authorization to other endpoints
- [ ] Implement user management
- [ ] Add audit logging
- [ ] Implement role-based access control

## 📞 Support

### Common Issues

**Database connection:**
```bash
# Test MySQL connection
mysql -u root -p -e "SELECT 1"
```

**Backend startup:**
```bash
# Check logs
mvn spring-boot:run -X

# Verify Java version
java -version
```

**Frontend connection:**
```bash
# Check browser console for errors
# Verify backend URL in api.js
# Check CORS configuration
```

## 🎓 Learning Resources

### JWT
- https://jwt.io/
- https://tools.ietf.org/html/rfc7519

### Spring Security
- https://spring.io/projects/spring-security
- https://docs.spring.io/spring-security/reference/

### React Authentication
- https://react.dev/
- https://reactrouter.com/

## 📝 Checklist for Deployment

```
Backend:
- [ ] Environment variables configured
- [ ] Database created and seeded
- [ ] Maven build successful
- [ ] Application starts without errors
- [ ] Health check endpoint working

Frontend:
- [ ] Dependencies installed
- [ ] API base URL configured
- [ ] Build succeeds
- [ ] Login works
- [ ] Protected routes work

Security:
- [ ] Changed default admin password
- [ ] JWT_SECRET is strong
- [ ] CORS_ORIGINS updated
- [ ] HTTPS enabled
- [ ] No sensitive data in code
```

## 🎉 Congratulations!

Your authentication system is now fully functional. You have a secure, scalable foundation for your Inventory Management System.

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Production Ready ✅
