# Frontend Authentication Integration Guide

## React Setup

The frontend is already configured with authentication support. Here's what's implemented:

### 1. AuthContext (src/context/AuthContext.jsx)

Provides global authentication state and methods:

```javascript
import { useContext } from 'react';
import AuthContext from './context/AuthContext.jsx';

function MyComponent() {
  const { user, token, isAuthenticated, login, logout, error, isLoading } = useContext(AuthContext);
  
  // Use auth state and methods
}
```

**Available Properties:**
- `user` - Current authenticated user object
- `token` - JWT token string
- `isAuthenticated` - Boolean indicating if user is logged in
- `error` - Error message from last operation
- `isLoading` - Boolean indicating if operation is in progress

**Available Methods:**
- `login(username, password, role)` - Authenticate user
- `logout()` - Clear authentication

### 2. API Integration (src/services/api.js)

Pre-configured axios instance with:
- Automatic JWT token injection in request headers
- Automatic logout on 401 responses
- Error handling

**Usage:**
```javascript
import { login, healthCheck } from './services/api.js';

// Login
const response = await login('admin', 'admin123', 'ADMIN');
if (response.success) {
  // Token is automatically stored and user is logged in
}

// Health check
const health = await healthCheck();
```

### 3. Protected Routes (src/components/common/ProtectedRoute.jsx)

Routes wrapped with `ProtectedRoute` require authentication:

```javascript
<Route element={<ProtectedRoute><PageLayout /></ProtectedRoute>}>
  <Route path="/dashboard" element={<Dashboard />} />
  {/* Other protected routes */}
</Route>
```

### 4. Login Page (src/pages/Login.jsx)

Features:
- Form validation
- Error message display
- Loading state during authentication
- Automatic redirect to dashboard on successful login
- Integration with AuthContext

## Backend API Requirements

### Base URL
```
http://localhost:8080/api
```

### Login Endpoint
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "username": "string",
  "password": "string",
  "role": "ADMIN | MANAGER | STAFF"
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

## Token Storage

The JWT token is automatically stored in `localStorage`:
- Key: `token`
- Value: JWT token string

The user data is stored in `localStorage`:
- Key: `user`
- Value: JSON object with userId, username, role

## Adding Authentication to New Components

### Using AuthContext:

```javascript
import { useContext } from 'react';
import AuthContext from '../context/AuthContext.jsx';

function MyComponent() {
  const { user, logout } = useContext(AuthContext);
  
  return (
    <div>
      <p>Welcome, {user.username}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default MyComponent;
```

### Making Authenticated API Calls:

```javascript
import { apiClient } from '../services/api.js';

async function fetchProtectedData() {
  try {
    const response = await apiClient.get('/protected-endpoint');
    return response.data;
  } catch (error) {
    console.error('Error:', error.message);
  }
}
```

## Environment Variables

Create a `.env` file in the frontend root:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## Testing Login

1. Start the backend: `mvn spring-boot:run` (in backend folder)
2. Start the frontend: `npm run dev` (in root folder)
3. Navigate to `http://localhost:5173`
4. Enter credentials:
   - Username: `admin`
   - Password: `admin123`
   - Role: `ADMIN`
5. Click Login
6. Should redirect to Dashboard

## Logout Implementation

Add logout button to Navbar or any component:

```javascript
import { useContext } from 'react';
import AuthContext from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

function NavBar() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <nav>
      <span>{user?.username}</span>
      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
}

export default NavBar;
```

## Error Handling

Errors are automatically displayed on the login page. For other components:

```javascript
import { useContext } from 'react';
import AuthContext from '../context/AuthContext.jsx';

function LoginForm() {
  const { login, error, isLoading } = useContext(AuthContext);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login('username', 'password', 'ADMIN');
    
    if (!result) {
      console.log('Login error:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* Form fields */}
      <button disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

export default LoginForm;
```

## Common Issues

### Token Not Being Sent
- Check if token is in localStorage
- Verify Authorization header format: `Bearer <token>`
- Check CORS settings in backend

### Login Always Fails
- Verify backend is running on port 8080
- Check database connection
- Ensure admin user exists in database
- Verify credentials: admin / admin123

### Redirect Not Working
- Check if AuthContext is properly wrapped around app
- Verify isAuthenticated state is updating
- Check browser console for errors

## Next Steps

1. Implement Logout button in Navbar
2. Add user profile page
3. Implement password change functionality
4. Add user registration
5. Implement refresh token mechanism
6. Add remember me functionality
