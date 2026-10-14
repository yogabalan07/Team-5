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
  Divider,
  Grid,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  EmailOutlined,
  Login as LoginIcon,
  ShieldOutlined,
  CheckCircle,
  AccountCircle,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import authService, { DEMO_USERS } from '../../services/authService';
import { toast } from 'react-toastify';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginDemo } = useAuth();
  const [email, setEmail] = useState('admin@ebms.enterprise');
  const [password, setPassword] = useState('Enterprise@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotDialogOpen, setForgotDialogOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Authentication failed. Please verify credentials.');
    }
    setLoading(false);
  };

  const handleQuickDemo = async (role) => {
    setLoading(true);
    const result = await loginDemo(role);
    if (result.success) {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  const handleSendReset = async () => {
    if (!forgotEmail || !forgotEmail.trim()) {
      toast.error('Please enter your account email address');
      return;
    }
    try {
      await authService.resetPassword(forgotEmail.trim());
      toast.success('Password recovery link sent. Check your inbox.');
      setForgotDialogOpen(false);
      setForgotEmail('');
    } catch (err) {
      toast.info('Password recovery instructions sent to provided email address.');
      setForgotDialogOpen(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          {/* Brand Header */}
          <Box textAlign="center" mb={3}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
              }}
            >
              <ShieldOutlined fontSize="medium" />
            </Box>
            <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.02em', color: 'text.primary' }}>
              EBMS
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Enterprise Business Management System
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Work Email"
              type="email"
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              label="Password"
              size="small"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlined fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                size="small"
                onClick={() => setForgotDialogOpen(true)}
                sx={{ textTransform: 'none', fontSize: '0.8rem', p: 0 }}
              >
                Forgot credentials?
              </Button>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={<LoginIcon />}
              sx={{ mt: 2.5, py: 1.2, fontWeight: 600 }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            </Button>
          </form>

          {/* Quick Demo Role Selector */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
              <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', color: 'text.secondary' }}>
                Instant Access — Select Role
              </Typography>
              <Chip size="small" label="Demo Ready" color="success" sx={{ height: 18, fontSize: '0.65rem' }} />
            </Box>

            <Grid container spacing={1}>
              {DEMO_USERS.map((u) => (
                <Grid item xs={6} key={u.role}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => handleQuickDemo(u.role)}
                    sx={{
                      justifyContent: 'flex-start',
                      py: 0.8,
                      px: 1.2,
                      textAlign: 'left',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography variant="caption" fontWeight={700} sx={{ display: 'block', lineHeight: 1.2, color: 'text.primary' }}>
                        {u.role.replace('_', ' ')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', noWrap: true }}>
                        {u.fullName}
                      </Typography>
                    </Box>
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Paper>
      </Container>

      {/* Forgot Password Modal */}
      <Dialog open={forgotDialogOpen} onClose={() => setForgotDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Reset Enterprise Password</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your authorized business email address. An encrypted password reset token will be dispatched.
          </Typography>
          <TextField
            fullWidth
            label="Work Email"
            type="email"
            size="small"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            placeholder="admin@ebms.enterprise"
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setForgotDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSendReset}>
            Send Reset Link
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Login;
