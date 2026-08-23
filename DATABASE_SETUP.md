# DATABASE SETUP — Inventory Management System

## PREREQUISITES

- PostgreSQL client (psql, pgAdmin, or Neon SQL Editor)
- Java 17+
- Maven 3.8+
- Node.js 18+
- Neon PostgreSQL account (https://neon.tech)

---

## 1. CREATE NEON POSTGRESQL DATABASE

1. Sign up / log in to [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string from the Neon dashboard
4. Note the format: `postgresql://username:password@host:5432/dbname?sslmode=require`

---

## 2. SET ENVIRONMENT VARIABLES

Create a `.env` file in the project root (or set system environment variables):

```env
DATABASE_URL=jdbc:postgresql://your-neon-host:5432/your_database?ssl=true&sslmode=require
DATABASE_USERNAME=your_neon_username
DATABASE_PASSWORD=your_neon_password
JWT_SECRET=your_random_256_bit_hex_string
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

**To generate a JWT secret:**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## 3. INITIALIZE DATABASE SCHEMA

### Option A: Using psql
```bash
psql "postgresql://username:password@host:5432/dbname?sslmode=require"
\i database/schema.sql
\i database/indexes.sql
```

### Option B: Using Neon SQL Editor
1. Open Neon Dashboard → SQL Editor
2. Paste contents of `database/schema.sql` → Run
3. Paste contents of `database/indexes.sql` → Run

---

## 4. VERIFY SCHEMA

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

SELECT COUNT(*) FROM information_schema.table_constraints
WHERE constraint_type = 'FOREIGN KEY';
```

Expected: 9 tables, 0 foreign keys

---

## 5. START BACKEND

```bash
cd backend

# Set environment variables
export DATABASE_URL="jdbc:postgresql://..."
export DATABASE_USERNAME="..."
export DATABASE_PASSWORD="..."
export JWT_SECRET="..."
export CORS_ALLOWED_ORIGINS="http://localhost:3000"

# Build and run
mvn clean package -DskipTests
java -jar target/inventory-management-*.jar
```

**Important:** The application will auto-create default users (admin, manager, testuser) on first startup.

---

## 6. START FRONTEND

```bash
cd frontend
npm install
npm start
```

---

## 7. TEST DATABASE CONNECTIVITY

```bash
# Test backend health
curl http://localhost:8080/api/health

# Test login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 8. RECREATE DATABASE FROM SCRATCH

```sql
DROP TABLE IF EXISTS stock_reports CASCADE;
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS purchase_items CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

Then re-run `schema.sql` and `indexes.sql`.

---

## 9. TROUBLESHOOTING

### Hibernate validation fails
- Ensure `schema.sql` was run successfully
- Check all 9 tables exist with correct column names

### Connection refused
- Verify Neon database is active
- Check `DATABASE_URL` includes `?ssl=true&sslmode=require`

### JWT errors
- Ensure `JWT_SECRET` is set and is a valid hex string

### Default users not created
- Check application logs for `Initializing default users...`
- The `@PostConstruct` method runs on every startup

---

## 10. PRODUCTION DEPLOYMENT (Render)

### Backend
- Build: `cd backend && mvn clean package -DskipTests`
- Start: `java -jar target/inventory-management-*.jar`
- Env vars: DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD, JWT_SECRET

### Frontend
- Build: `cd frontend && npm install && npm run build`
- Publish: `frontend/build`
- Env var: REACT_APP_API_URL=https://your-backend.onrender.com/api
