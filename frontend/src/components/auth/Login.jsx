import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock,
  Person,
  Login as LoginIcon,
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
        background: 'linear-gradient(135deg, #0c0e1a 0%, #1a1a3e 50%, #2d1b69 100%)',
        position: 'relative',
        overflow: 'hidden',
        p: 2,
      }}
    >
      {/* Animated floating particles */}
      {[...Array(20)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: Math.random() * 6 + 2,
            height: Math.random() * 6 + 2,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            animation: `float ${Math.random() * 10 + 5}s infinite ease-in-out`,
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: `translateY(-${Math.random() * 30 + 10}px)` },
            },
          }}
        />
      ))}

      <Container maxWidth="sm">
        <Paper
          sx={{
            p: { xs: 4, sm: 5 },
            borderRadius: 4,
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Box textAlign="center" mb={4}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                fontSize: 40,
              }}
            >
              📦
            </Box>
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              sx={{ 
                color: '#fff',
                fontSize: { xs: '1.75rem', sm: '2rem' }
              }}
            >
              Welcome Back
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                mt: 1
              }}
            >
              Sign in to continue to Inventory Pro
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
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
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover fieldset': { borderColor: '#667eea' },
                  '&.Mui-focused fieldset': { borderColor: '#667eea' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#667eea' },
              }}
            />

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
                      {showPassword ? <VisibilityOff sx={{ color: 'rgba(255,255,255,0.7)' }} /> : <Visibility sx={{ color: 'rgba(255,255,255,0.7)' }} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&:hover fieldset': { borderColor: '#667eea' },
                  '&.Mui-focused fieldset': { borderColor: '#667eea' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                '& .MuiInputLabel-root.Mui-focused': { color: '#667eea' },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.5,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 'bold',
                '&:hover': {
                  transform: 'scale(1.02)',
                  transition: 'transform 0.2s',
                },
              }}
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </Button>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
