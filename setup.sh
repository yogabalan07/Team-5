#!/bin/bash

# Installation script for the Inventory Management System Authentication Module
# This script sets up both the backend and frontend with all necessary dependencies

set -e

echo "=========================================="
echo "Inventory Management System Setup"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend Setup
echo -e "${BLUE}[1/4]${NC} Setting up Backend..."

cd backend

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo -e "${YELLOW}Java is not installed. Please install Java 21${NC}"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | grep -oP '(?<=version ").*(?=")')
echo "Java version: $JAVA_VERSION"

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo -e "${YELLOW}Maven is not installed. Please install Maven 3.8+${NC}"
    exit 1
fi

echo "Installing backend dependencies with Maven..."
mvn clean install -q

echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Frontend Setup
echo -e "${BLUE}[2/4]${NC} Setting up Frontend..."

cd ../

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "Node version: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}npm is not installed. Please install npm${NC}"
    exit 1
fi

echo "Installing frontend dependencies with npm..."
npm install --quiet

echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

# Database Setup
echo -e "${BLUE}[3/4]${NC} Database Setup Instructions..."
echo ""
echo "To set up the MySQL database, run the following commands:"
echo "  1. Open MySQL client: mysql -u root -p"
echo "  2. Create database: CREATE DATABASE inventory_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo "  3. Use database: USE inventory_management;"
echo "  4. Import schema: source database/schema.sql;"
echo ""

# Environment Variables Setup
echo -e "${BLUE}[4/4]${NC} Setting up Environment Variables..."
echo ""
echo "Set the following environment variables for your system:"
echo ""
echo "Database Configuration:"
echo "  DB_URL: jdbc:mysql://localhost:3306/inventory_management"
echo "  DB_USERNAME: root"
echo "  DB_PASSWORD: your_mysql_password"
echo ""
echo "JWT Configuration:"
echo "  JWT_SECRET: your-secret-key-minimum-32-characters"
echo "  JWT_EXPIRATION: 86400000 (24 hours in milliseconds)"
echo ""
echo "CORS Configuration:"
echo "  CORS_ORIGINS: http://localhost:5173,http://localhost:3000"
echo ""

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "  1. Configure environment variables for your system"
echo "  2. Create and populate the MySQL database"
echo "  3. Start backend: cd backend && mvn spring-boot:run"
echo "  4. Start frontend: npm run dev"
echo "  5. Open http://localhost:5173 in your browser"
echo "  6. Login with:"
echo "     Username: admin"
echo "     Password: admin123"
echo "     Role: ADMIN"
echo ""
