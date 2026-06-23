# Clever Cloud Database Integration Guide

## ✅ Backend Configuration Updated

Your backend is now configured to connect to the Clever Cloud remote database. The default credentials have been set in `application.properties`.

## 📋 Database Details

| Property | Value |
|----------|-------|
| Host | bz58dt6f4ypdlmtgr532-mysql.services.clever-cloud.com |
| Port | 3306 |
| Database | bz58dt6f4ypdlmtgr532 |
| Username | urwqfcd0yvwfhmhr |
| Password | OnhBsTU6JujYP38qOd4C |

## 🚀 Quick Setup

### Step 1: Create Database Schema

Run the following MySQL command to create the tables:

```bash
mysql -h bz58dt6f4ypdlmtgr532-mysql.services.clever-cloud.com \
  -P 3306 \
  -u urwqfcd0yvwfhmhr \
  -p bz58dt6f4ypdlmtgr532 < database/schema.sql
```

When prompted for password, enter: `OnhBsTU6JujYP38qOd4C`

### Step 2: Verify Connection

```bash
mysql -h bz58dt6f4ypdlmtgr532-mysql.services.clever-cloud.com \
  -P 3306 \
  -u urwqfcd0yvwfhmhr \
  -p -e "SELECT 1;"
```

### Step 3: Start Backend

```bash
cd backend
mvn spring-boot:run
```

The backend will automatically:
1. Connect to Clever Cloud database
2. Create/update tables via Hibernate
3. Initialize admin user if it doesn't exist

### Step 4: Start Frontend

```bash
npm run dev
```

## 🔧 Environment Variables (Optional)

If you want to override the credentials with environment variables:

**Windows (PowerShell as Admin):**
```powershell
[System.Environment]::SetEnvironmentVariable("DB_URL", "jdbc:mysql://bz58dt6f4ypdlmtgr532-mysql.services.clever-cloud.com:3306/bz58dt6f4ypdlmtgr532", "User")
[System.Environment]::SetEnvironmentVariable("DB_USERNAME", "urwqfcd0yvwfhmhr", "User")
[System.Environment]::SetEnvironmentVariable("DB_PASSWORD", "OnhBsTU6JujYP38qOd4C", "User")
```

**Linux/Mac:**
```bash
export DB_URL="jdbc:mysql://bz58dt6f4ypdlmtgr532-mysql.services.clever-cloud.com:3306/bz58dt6f4ypdlmtgr532"
export DB_USERNAME="urwqfcd0yvwfhmhr"
export DB_PASSWORD="OnhBsTU6JujYP38qOd4C"
```

## ✅ Verification

### Check Database Connection

```bash
# Connect to database
mysql -h bz58dt6f4ypdlmtgr532-mysql.services.clever-cloud.com \
  -P 3306 \
  -u urwqfcd0yvwfhmhr \
  -p bz58dt6f4ypdlmtgr532

# View tables
SHOW TABLES;

# Check users table
SELECT * FROM users;
```

### Check Backend Health

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

### Test Login

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "role": "ADMIN"
  }'
```

## 🎯 Workflow

1. **Local Development:**
   - Backend uses Clever Cloud remote database
   - Frontend connects to localhost:8080
   - All changes persist in cloud database

2. **Data Persistence:**
   - All data is stored on Clever Cloud
   - Can access from anywhere
   - Multiple team members can work simultaneously

3. **Deployment:**
   - No local database needed
   - Just deploy backend + frontend
   - Database is already in production

## ⚠️ Important Notes

### Security
- These credentials should NOT be committed to git
- Already configured with environment variable fallback
- Consider rotating credentials periodically
- Use HTTPS in production

### Backups
- Clever Cloud provides automated backups
- Configure backup policy in Clever Cloud console
- Test restore procedures regularly

### Performance
- Monitor database performance in Clever Cloud dashboard
- Check slow query logs
- Optimize indexes as needed

### Scaling
- Database can be scaled within Clever Cloud
- Monitor connection limits
- Implement connection pooling (already done in Spring)

## 🔗 Useful Links

- **Clever Cloud Console:** https://console.clever-cloud.com
- **MySQL Documentation:** https://dev.mysql.com/doc/
- **Connection String Format:** `jdbc:mysql://host:port/database`

## 📝 Connection String Reference

| Format | Value |
|--------|-------|
| JDBC URL | `jdbc:mysql://bz58dt6f4ypdlmtgr532-mysql.services.clever-cloud.com:3306/bz58dt6f4ypdlmtgr532` |
| MySQL CLI | `mysql -h bz58dt6f4ypdlmtgr532-mysql.services.clever-cloud.com -u urwqfcd0yvwfhmhr -p` |
| URI | `mysql://urwqfcd0yvwfhmhr:OnhBsTU6JujYP38qOd4C@bz58dt6f4ypdlmtgr532-mysql.services.clever-cloud.com:3306/bz58dt6f4ypdlmtgr532` |

## 🚨 Troubleshooting

### "Can't connect to MySQL server"
```
✓ Check internet connection
✓ Verify credentials are correct
✓ Ensure Clever Cloud IP whitelist includes your IP
✓ Check firewall settings
```

### "Access denied for user"
```
✓ Double-check username and password
✓ Ensure database name is correct
✓ Verify user has privileges for the database
```

### "Unknown database"
```
✓ Run schema.sql to create tables
✓ Check database name in connection string
✓ Verify database was created successfully
```

### Application won't start
```
✓ Check backend logs for database connection errors
✓ Verify environment variables are set correctly
✓ Ensure schema has been imported
✓ Check that admin user initialization doesn't fail
```

## ✨ Next Steps

1. ✅ Backend configured for Clever Cloud
2. ⬜ Import schema into remote database
3. ⬜ Start backend and test connection
4. ⬜ Test login functionality
5. ⬜ Deploy to production

## 📞 Support

For Clever Cloud-specific issues:
- Check Clever Cloud documentation
- Contact Clever Cloud support
- Monitor database metrics in console

For backend issues:
- Check Spring Boot logs
- Verify JDBC driver compatibility
- Check connection pool settings

---

**Database:** Clever Cloud MySQL  
**Status:** ✅ Configured  
**Last Updated:** 2024
