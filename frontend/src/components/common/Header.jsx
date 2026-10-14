import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Badge,
  Tooltip,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Breadcrumbs,
  Link,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Notifications,
  Person,
  Logout,
  LightMode,
  DarkMode,
  Search,
  Key,
  CheckCircle,
  MenuOpen,
  Menu as MenuIcon,
  Warning,
  Receipt,
  ShoppingCart,
  SwapHoriz,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { toast } from 'react-toastify';
import GlobalSearchDialog from './GlobalSearchDialog';

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    title: 'Low Stock Threshold Alert',
    description: 'SKU BEAR-6205-HP reached minimum reorder level (12 units remaining).',
    time: '12m ago',
    read: false,
    icon: <Warning color="warning" fontSize="small" />,
  },
  {
    id: 2,
    title: 'Purchase Order Approval Required',
    description: 'PO-20261010-000018 ($38,400) awaits Executive Director sign-off.',
    time: '45m ago',
    read: false,
    icon: <Receipt color="info" fontSize="small" />,
  },
  {
    id: 3,
    title: 'Payment Received',
    description: 'Received $14,250 wire transfer for Sales Invoice INV-20261002-000021.',
    time: '2h ago',
    read: true,
    icon: <ShoppingCart color="success" fontSize="small" />,
  },
];

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, loginDemo } = useAuth();
  const { themeMode, toggleTheme, sidebarCollapsed, toggleSidebar: toggleCollapse } = useApp();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [roleSwitchAnchor, setRoleSwitchAnchor] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleNotifOpen = (event) => setNotifAnchorEl(event.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.info('All notifications marked as read');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    toast.success('Account password updated successfully.');
    setPasswordDialogOpen(false);
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleQuickSwitchRole = async (targetRole) => {
    await loginDemo(targetRole);
    setRoleSwitchAnchor(null);
    handleMenuClose();
  };

  // Generate dynamic breadcrumb segments
  const pathnames = location.pathname.split('/').filter((x) => x);
  const formattedBreadcrumbs = pathnames.map((name, index) => {
    const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
    const isLast = index === pathnames.length - 1;
    const label = name
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return isLast ? (
      <Typography key={routeTo} variant="caption" sx={{ color: 'text.primary', fontWeight: 600 }}>
        {label}
      </Typography>
    ) : (
      <Link
        key={routeTo}
        component="button"
        underline="hover"
        color="inherit"
        variant="caption"
        onClick={() => navigate(routeTo)}
        sx={{ cursor: 'pointer' }}
      >
        {label}
      </Link>
    );
  });

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: 60, px: { xs: 2, md: 3 } }}>
          {/* Sidebar toggles */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleSidebar}
            sx={{ mr: 1, display: { md: 'none' } }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>

          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleCollapse}
            sx={{ mr: 2, display: { xs: 'none', md: 'inline-flex' } }}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <MenuOpen
              fontSize="small"
              sx={{
                transform: sidebarCollapsed ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </IconButton>

          {/* Breadcrumbs */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', mr: 2 }}>
            <Breadcrumbs separator="›" aria-label="breadcrumb">
              <Link
                component="button"
                underline="hover"
                color="inherit"
                variant="caption"
                onClick={() => navigate('/dashboard')}
                sx={{ cursor: 'pointer', fontWeight: 500 }}
              >
                EBMS
              </Link>
              {formattedBreadcrumbs}
            </Breadcrumbs>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Global Search Trigger */}
          <Tooltip title="Global Search (Ctrl+K)">
            <Box
              onClick={() => setSearchOpen(true)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.6,
                mr: 1.5,
                borderRadius: 2,
                bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)'),
                border: '1px solid',
                borderColor: 'divider',
                cursor: 'pointer',
                transition: 'all 0.15s',
                '&:hover': {
                  borderColor: 'primary.main',
                },
              }}
            >
              <Search fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' }, fontSize: '0.8rem' }}>
                Search system (Ctrl+K)...
              </Typography>
              <Chip
                size="small"
                label="⌘K"
                variant="outlined"
                sx={{ height: 18, fontSize: '0.65rem', display: { xs: 'none', md: 'inline-flex' } }}
              />
            </Box>
          </Tooltip>

          {/* Dark / Light Mode Toggle */}
          <Tooltip title={`Switch to ${themeMode === 'light' ? 'Dark' : 'Light'} Mode`}>
            <IconButton color="inherit" onClick={toggleTheme} sx={{ mr: 1 }}>
              {themeMode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Operational Notifications">
            <IconButton color="inherit" onClick={handleNotifOpen} sx={{ mr: 1.5 }}>
              <Badge badgeContent={unreadCount} color="error">
                <Notifications fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Notifications Menu */}
          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={handleNotifClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: { width: 340, maxHeight: 420, p: 0.5 },
            }}
          >
            <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Notifications ({unreadCount} unread)
              </Typography>
              {unreadCount > 0 && (
                <Button size="small" onClick={handleMarkAllRead} sx={{ fontSize: '0.75rem', p: 0 }}>
                  Mark all read
                </Button>
              )}
            </Box>
            <Divider />
            {notifications.map((n) => (
              <MenuItem
                key={n.id}
                onClick={handleNotifClose}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  py: 1.2,
                  bgcolor: n.read ? 'transparent' : 'action.hover',
                }}
              >
                <Box sx={{ mt: 0.3 }}>{n.icon}</Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight={n.read ? 500 : 700}>
                    {n.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    {n.description}
                  </Typography>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                    {n.time}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>

          {/* User Profile Pill */}
          <Box
            onClick={handleMenuOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.2,
              p: 0.5,
              borderRadius: 2,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 32,
                height: 32,
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              {user?.fullName?.charAt(0) || 'A'}
            </Avatar>
            <Box sx={{ display: { xs: 'none', md: 'block' }, textAlign: 'left' }}>
              <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
                {user?.fullName || 'Administrator'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {user?.role?.replace(/^ROLE_/, '') || 'ADMIN'}
              </Typography>
            </Box>
          </Box>

          {/* User Account Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: { minWidth: 230, mt: 1 },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                {user?.fullName || 'Alexander Vance'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {user?.email || 'admin@ebms.enterprise'}
              </Typography>
              <Chip
                size="small"
                label={user?.role?.replace(/^ROLE_/, '') || 'ADMIN'}
                color="primary"
                sx={{ mt: 1, height: 20, fontSize: '0.65rem', fontWeight: 600 }}
              />
            </Box>
            <Divider />

            <MenuItem onClick={() => { handleMenuClose(); setPasswordDialogOpen(true); }}>
              <ListItemIcon>
                <Key fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Change Password" />
            </MenuItem>

            <MenuItem onClick={(e) => setRoleSwitchAnchor(e.currentTarget)}>
              <ListItemIcon>
                <SwapHoriz fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Switch Active Role" />
            </MenuItem>

            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <ListItemIcon sx={{ color: 'error.main' }}>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Sign Out" />
            </MenuItem>
          </Menu>

          {/* Role Switch Nested Menu */}
          <Menu
            anchorEl={roleSwitchAnchor}
            open={Boolean(roleSwitchAnchor)}
            onClose={() => setRoleSwitchAnchor(null)}
          >
            <MenuItem onClick={() => handleQuickSwitchRole('ADMIN')}>System Admin (ADMIN)</MenuItem>
            <MenuItem onClick={() => handleQuickSwitchRole('STORE_MANAGER')}>Store Manager (STORE_MANAGER)</MenuItem>
            <MenuItem onClick={() => handleQuickSwitchRole('BILLING_CLERK')}>Billing Specialist (BILLING_CLERK)</MenuItem>
            <MenuItem onClick={() => handleQuickSwitchRole('PURCHASE_MANAGER')}>Procurement Director (PURCHASE_MANAGER)</MenuItem>
            <MenuItem onClick={() => handleQuickSwitchRole('ACCOUNTS')}>Financial Controller (ACCOUNTS)</MenuItem>
            <MenuItem onClick={() => handleQuickSwitchRole('STAFF')}>Operations Staff (STAFF)</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Global Search Palette Modal */}
      <GlobalSearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Security Credentials</DialogTitle>
        <form onSubmit={handlePasswordSubmit}>
          <DialogContent sx={{ pt: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Current Password"
                type="password"
                size="small"
                fullWidth
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
              <TextField
                label="New Password"
                type="password"
                size="small"
                fullWidth
                required
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                helperText="Minimum 6 characters with mixed characters."
              />
              <TextField
                label="Confirm New Password"
                type="password"
                size="small"
                fullWidth
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save Password
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default Header;