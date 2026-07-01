import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Collapse,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  People,
  LocalShipping,
  Inventory,
  ShoppingCart,
  Storefront,
  AccountBalance,
  BarChart,
  Settings,
  ExpandLess,
  ExpandMore,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const drawerWidth = 260;

const menuItems = [
  {
    text: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
  },
  {
    text: 'Customers',
    icon: <People />,
    path: '/customers',
  },
  {
    text: 'Suppliers',
    icon: <LocalShipping />,
    path: '/suppliers',
  },
  {
    text: 'Items',
    icon: <Inventory />,
    path: '/items',
    subItems: [
      { text: 'All Items', path: '/items' },
      { text: 'Brands', path: '/items/brands' },
      { text: 'Groups', path: '/items/groups' },
      { text: 'Sections', path: '/items/sections' },
      { text: 'Units', path: '/items/units' },
      { text: 'Taxes', path: '/items/taxes' },
    ],
  },
  {
    text: 'Sales',
    icon: <ShoppingCart />,
    path: '/sales/list',
    subItems: [
      { text: 'Sales Entry', path: '/sales/list' },
      { text: 'Sales Return', path: '/sales/return' },
    ],
  },
  {
    text: 'Purchases',
    icon: <Storefront />,
    path: '/purchases/list',
    subItems: [
      { text: 'Purchase Orders', path: '/purchases/orders' },
      { text: 'Purchase Entry', path: '/purchases/list' },
      { text: 'Purchase Return', path: '/purchases/return' },
      { text: 'GRN Verification', path: '/purchases/grn' },
    ],
  },
  {
    text: 'Accounts',
    icon: <AccountBalance />,
    path: '/accounts/ledger',
    subItems: [
      { text: 'Bill Receipts', path: '/accounts/receipts' },
      { text: 'Bill Payments', path: '/accounts/payments' },
      { text: 'Ledger', path: '/accounts/ledger' },
    ],
  },
  {
    text: 'Reports',
    icon: <BarChart />,
    path: '/reports/sales',
    subItems: [
      { text: 'Sales Bills Report', path: '/reports/sales' },
      { text: 'Sales Bills Details', path: '/reports/sales-details' },
      { text: 'Purchase Bills Report', path: '/reports/purchases' },
      { text: 'Purchase Bills Details', path: '/reports/purchase-details' },
      { text: 'Customer Receipts', path: '/reports/customer-receipts' },
      { text: 'Supplier Payments', path: '/reports/supplier-payments' },
      { text: 'Stock Report', path: '/reports/stock' },
    ],
  },
  {
    text: 'Admin',
    icon: <AdminPanelSettings />,
    path: '/admin/users',
    subItems: [
      { text: 'User Management', path: '/admin/users' },
    ],
  },
  
];

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const [openSubMenus, setOpenSubMenus] = useState({
    Items: false,
    Sales: false,
    Purchases: false,
    Accounts: false,
    Reports: false,
    Admin: false,
  });

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter((item) => {
    // Only show Admin menu if user is admin
    if (item.text === 'Admin') {
      return isAdmin();
    }
    return true;
  });

  const handleSubMenuToggle = (text) => {
    setOpenSubMenus((prev) => ({
      ...prev,
      [text]: !prev[text],
    }));
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isSubItemActive = (subItems) => {
    return subItems?.some((sub) => location.pathname === sub.path);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (mobileOpen) handleDrawerToggle();
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Toolbar
        sx={{
          backgroundColor: '#1976d2',
          minHeight: 64,
          px: 2,
        }}
      >
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
          📦 Inventory Pro
        </Typography>
      </Toolbar>

      {/* User Info */}
      <Box sx={{ p: 2, bgcolor: '#f5f7fa', borderBottom: '1px solid #e0e0e0' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: '#1976d2' }}>
            {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {user?.fullName || user?.username || 'User'}
            </Typography>
            <Box display="flex" gap={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
              {user?.roles?.map((role) => (
                <Chip
                  key={role.id}
                  label={role.name.replace('ROLE_', '')}
                  size="small"
                  color={role.name === 'ROLE_ADMIN' ? 'error' : 'primary'}
                  sx={{ height: 20, fontSize: '0.625rem' }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Menu */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', pt: 1 }}>
        <List>
          {filteredMenuItems.map((item) => {
            const isItemActive =
              isActive(item.path) || isSubItemActive(item.subItems);
            const hasSubItems = item.subItems && item.subItems.length > 0;

            return (
              <React.Fragment key={item.text}>
                <ListItem
                  button
                  onClick={() => {
                    if (hasSubItems) {
                      handleSubMenuToggle(item.text);
                    } else {
                      handleNavigation(item.path);
                    }
                  }}
                  sx={{
                    mx: 1,
                    borderRadius: 2,
                    mb: 0.5,
                    backgroundColor: isItemActive ? '#1976d2' : 'transparent',
                    color: isItemActive ? 'white' : 'inherit',
                    '&:hover': {
                      backgroundColor: isItemActive ? '#1565c0' : '#e3f2fd',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isItemActive ? 'white' : '#1976d2',
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: isItemActive ? 600 : 400,
                      fontSize: '0.9rem',
                    }}
                  />
                  {hasSubItems &&
                    (openSubMenus[item.text] ? <ExpandLess /> : <ExpandMore />)}
                </ListItem>

                {hasSubItems && (
                  <Collapse
                    in={openSubMenus[item.text]}
                    timeout="auto"
                    unmountOnExit
                  >
                    <List component="div" disablePadding>
                      {item.subItems.map((subItem) => (
                        <ListItem
                          button
                          key={subItem.text}
                          onClick={() => handleNavigation(subItem.path)}
                          sx={{
                            pl: 4,
                            mx: 1,
                            borderRadius: 2,
                            mb: 0.5,
                            backgroundColor: isActive(subItem.path)
                              ? '#e3f2fd'
                              : 'transparent',
                            '&:hover': {
                              backgroundColor: '#f5f7fa',
                            },
                          }}
                        >
                          <ListItemText
                            primary={subItem.text}
                            primaryTypographyProps={{
                              fontSize: '0.85rem',
                              fontWeight: isActive(subItem.path) ? 500 : 400,
                              color: isActive(subItem.path)
                                ? '#1976d2'
                                : 'inherit',
                            }}
                          />
                          {isActive(subItem.path) && (
                            <Box
                              sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                bgcolor: '#1976d2',
                              }}
                            />
                          )}
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            );
          })}
        </List>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid #e0e0e0',
          bgcolor: '#f8f9fa',
          mt: 'auto',
        }}
      >
        <Typography
          variant="caption"
          color="textSecondary"
          display="block"
          align="center"
        >
          Inventory Pro v1.0.0
        </Typography>
        <Typography
          variant="caption"
          color="textSecondary"
          display="block"
          align="center"
        >
          © {new Date().getFullYear()} All rights reserved
        </Typography>
        {isAdmin() && (
          <Chip
            label="🔑 Admin Access"
            size="small"
            color="error"
            sx={{
              mt: 1,
              width: '100%',
              height: 24,
              fontSize: '0.65rem',
              fontWeight: 600,
            }}
          />
        )}
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
    >
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            borderRight: '1px solid #e0e0e0',
            backgroundColor: '#ffffff',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;