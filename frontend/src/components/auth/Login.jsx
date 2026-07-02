import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
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
        background: '#f5f7fa',
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 1000,
          width: '100%',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        }}
      >
        <Grid container>
          <Grid item xs={12} md={6}>
            <Box sx={{ p: { xs: 4, sm: 5 } }}>
              <Box textAlign="center" mb={4}>
                <Typography 
                  variant="h4" 
                  fontWeight="bold" 
                  sx={{ 
                    color: '#1a1a2e',
                    fontSize: { xs: '1.5rem', sm: '1.75rem' }
                  }}
                >
                  Welcome Back
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Sign in to your account
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
                      '&:hover fieldset': { borderColor: '#667eea' },
                      '&.Mui-focused fieldset': { borderColor: '#667eea' },
                    },
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
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': { borderColor: '#667eea' },
                      '&.Mui-focused fieldset': { borderColor: '#667eea' },
                    },
                  }}
                />

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
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                    },
                  }}
                >
                  {loading ? 'Logging in...' : 'Sign In'}
                </Button>
              </form>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              sx={{
                height: '100%',
                minHeight: 300,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                color: '#fff',
                textAlign: 'center',
              }}
            >
              <Box sx={{ fontSize: 80, mb: 2 }}>📦</Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Inventory Pro
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Enterprise Inventory Management System
              </Typography>
              <Box
                sx={{
                  mt: 3,
                  px: 3,
                  py: 2,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Typography variant="caption">
                  🔒 Secure · Fast · Reliable
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Login;
