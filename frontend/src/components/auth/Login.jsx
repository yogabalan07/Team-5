import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  Person,
  Login as LoginIcon,
  Inventory,
  Dashboard,
  TrendingUp,
  Warehouse,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        position: 'relative',
        overflow: 'hidden',
        p: 2,
      }}
    >
      {/* Animated floating particles */}
      {[...Array(30)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: Math.random() * 6 + 2,
            height: Math.random() * 6 + 2,
            borderRadius: '50%',
            background: `rgba(102, 126, 234, ${Math.random() * 0.3 + 0.1})`,
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            animation: `float ${Math.random() * 15 + 10}s infinite ease-in-out`,
            animationDelay: `${Math.random() * 5}s`,
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) translateX(0px)' },
              '25%': { transform: `translateY(-${Math.random() * 30 + 10}px) translateX(${Math.random() * 20 - 10}px)` },
              '50%': { transform: `translateY(${Math.random() * 20 + 5}px) translateX(${Math.random() * 20 - 10}px)` },
              '75%': { transform: `translateY(-${Math.random() * 20 + 5}px) translateX(${Math.random() * 20 - 10}px)` },
            },
          }}
        />
      ))}

      {/* Decorative background elements */}
      <Box
        sx={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%)',
          top: '-300px',
          right: '-200px',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(118, 75, 162, 0.15) 0%, transparent 70%)',
          bottom: '-200px',
          left: '-150px',
        }}
      />

      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 5 },
            borderRadius: 4,
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Header */}
          <Box textAlign="center" mb={4}>
            {/* Inventory Icon */}
            <Box
              sx={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
              }}
            >
              <Inventory sx={{ fontSize: 35, color: '#fff' }} />
            </Box>

            <Typography 
              variant="h5" 
              sx={{ 
                color: '#fff',
                fontWeight: 'bold',
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
                mb: 0.5,
              }}
            >
              Inventory Pro
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255,255,255,0.6)',
                fontSize: '0.85rem',
              }}
            >
              Enterprise Inventory Management System
            </Typography>
          </Box>

          {/* Feature badges */}
          <Box 
            display="flex" 
            justifyContent="center" 
            gap={2} 
            sx={{ mb: 3 }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.7rem',
              }}
            >
              <Dashboard sx={{ fontSize: 14 }} />
              <span>Dashboard</span>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.7rem',
              }}
            >
              <Warehouse sx={{ fontSize: 14 }} />
              <span>Stock</span>
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.7rem',
              }}
            >
              <TrendingUp sx={{ fontSize: 14 }} />
              <span>Analytics</span>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Login Text */}
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                mb: 1,
                fontSize: '0.85rem',
                fontWeight: 'bold',
              }}
            >
              Log In
            </Typography>

            {/* Contact Administrator link */}
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255,255,255,0.4)',
                mb: 3,
                fontSize: '0.8rem',
              }}
            >
              Have an account?{' '}
              <Link 
                to="/contact-admin" 
                style={{ 
                  color: '#667eea', 
                  textDecoration: 'none',
                }}
              >
                Contact Administrator
              </Link>
            </Typography>

            {/* Username Field */}
            <TextField
              fullWidth
              label="Username"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              placeholder="Enter your username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: '#667eea' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: '#667eea' },
                  '&.Mui-focused fieldset': { borderColor: '#667eea' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#667eea' },
                '& .MuiInputLabel-root.MuiFormLabel-filled': { color: '#667eea' },
              }}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              placeholder="Enter your password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#667eea' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff sx={{ color: 'rgba(255,255,255,0.5)' }} /> : <Visibility sx={{ color: 'rgba(255,255,255,0.5)' }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: '#667eea' },
                  '&.Mui-focused fieldset': { borderColor: '#667eea' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#667eea' },
                '& .MuiInputLabel-root.MuiFormLabel-filled': { color: '#667eea' },
              }}
            />

            {/* Login Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={<LoginIcon />}
              sx={{
                mt: 3,
                py: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 'bold',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                '&:hover': {
                  transform: 'scale(1.02)',
                  transition: 'transform 0.2s',
                  boxShadow: '0 6px 30px rgba(102, 126, 234, 0.4)',
                },
              }}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>

          {/* Footer Links */}
          <Box mt={3} textAlign="center">
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.75rem',
              }}
            >
              Forgot your password?{' '}
              <Link 
                to="/forgot-password" 
                style={{ 
                  color: '#667eea', 
                  textDecoration: 'none',
                }}
              >
                Contact Administrator
              </Link>
            </Typography>

            <Divider 
              sx={{ 
                my: 2, 
                borderColor: 'rgba(255,255,255,0.05)',
              }} 
            />

            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255,255,255,0.2)',
                fontSize: '0.65rem',
              }}
            >
              © {new Date().getFullYear()} Inventory Pro. All rights reserved.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
