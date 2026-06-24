@echo off
REM Installation script for Windows
REM Inventory Management System Setup

echo.
echo ==========================================
echo Inventory Management System Setup (Windows)
echo ==========================================
echo.

REM Check if Java is installed
java -version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Java is not installed. Please install Java 21
    exit /b 1
)

for /f "tokens=3" %%A in ('java -version 2^>^&1 ^| findstr /R "version"') do set JAVA_VERSION=%%A
echo Java version: %JAVA_VERSION%

REM Check if Maven is installed
mvn -version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Maven is not installed. Please install Maven 3.8^+
    exit /b 1
)

REM Backend Setup
echo.
echo [1/4] Setting up Backend...
cd backend

echo Installing backend dependencies with Maven...
call mvn clean install -q

if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies
    exit /b 1
)

echo [OK] Backend dependencies installed

REM Frontend Setup
echo.
echo [2/4] Setting up Frontend...
cd ..

REM Check if Node.js is installed
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18^+
    exit /b 1
)

for /f "tokens=*" %%A in ('node -v') do set NODE_VERSION=%%A
echo Node version: %NODE_VERSION%

REM Check if npm is installed
npm -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] npm is not installed. Please install npm
    exit /b 1
)

echo Installing frontend dependencies with npm...
call npm install --quiet

echo [OK] Frontend dependencies installed

REM Database Setup
echo.
echo [3/4] Database Setup Instructions
echo.
echo To set up the MySQL database, follow these steps:
echo   1. Open Command Prompt/PowerShell
echo   2. Connect to MySQL: mysql -u root -p
echo   3. Run these commands:
echo      CREATE DATABASE inventory_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo      USE inventory_management;
echo      source database/schema.sql;
echo.

REM Environment Variables
echo [4/4] Setting up Environment Variables
echo.
echo Set the following environment variables:
echo.
echo Database Configuration:
echo   DB_URL=jdbc:mysql://localhost:3306/inventory_management
echo   DB_USERNAME=root
echo   DB_PASSWORD=your_mysql_password
echo.
echo JWT Configuration:
echo   JWT_SECRET=your-secret-key-minimum-32-characters
echo   JWT_EXPIRATION=86400000
echo.
echo CORS Configuration:
echo   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
echo.
echo To set environment variables in Windows:
echo   1. Press Win+R, type "sysdm.cpl"
echo   2. Click "Environment Variables" button
echo   3. Add new User variables with the values above
echo.

REM Summary
echo.
echo ==========================================
echo [OK] Setup Complete!
echo ==========================================
echo.
echo Next Steps:
echo   1. Set environment variables for your system
echo   2. Create and populate the MySQL database
echo   3. Start backend: cd backend ^&^& mvn spring-boot:run
echo   4. Start frontend: npm run dev
echo   5. Open http://localhost:5173 in your browser
echo   6. Login with:
echo      Username: admin
echo      Password: admin123
echo      Role: ADMIN
echo.
pause
