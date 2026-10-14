import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  Collapse,
  Avatar,
  Chip,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  LocalShipping as SupplierIcon,
  Inventory as InventoryIcon,
  ShoppingCart as SalesIcon,
  ReceiptLong as PurchaseIcon,
  AccountBalance as FinanceIcon,
  BarChart as ReportsIcon,
  AdminPanelSettings as AdminIcon,
  Warehouse as WarehouseIcon,
  ExpandLess,
  ExpandMore,
  QrCode,
  Security,
  History,
  PriceChange,
  FolderSpecial,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 72;

const NAV_MODULES = [
  {
    title: 'Dashboard',
    icon: <DashboardIcon fontSize="small" />,
    path: '/dashboard',
    allowedRoles: ['ADMIN', 'STORE_MANAGER', 'BILLING_CLERK', 'PURCHASE_MANAGER', 'ACCOUNTS', 'STAFF'],
  },
  {
    title: 'Administration',
    icon: <AdminIcon fontSize="small" />,
    path: '/admin',
    allowedRoles: ['ADMIN'],
    subItems: [
      { text: 'User Accounts', path: '/admin/users' },
      { text: 'Roles & Permissions', path: '/admin/roles' },
      { text: 'Audit Trail Logs', path: '/admin/audit-logs' },
    ],
  },
  {
    title: 'Product Master Data',
    icon: <InventoryIcon fontSize="small" />,
    path: '/items',
    allowedRoles: ['ADMIN', 'STORE_MANAGER', 'PURCHASE_MANAGER', 'STAFF'],
    subItems: [
      { text: 'All Catalog Items', path: '/items' },
      { text: 'Batch Tracking', path: '/items/batches' },
      { text: 'Serial Numbers', path: '/items/serials' },
      { text: 'Categories', path: '/items/categories' },
      { text: 'Brands', path: '/items/brands' },
      { text: 'Item Groups', path: '/items/groups' },
      { text: 'Sections', path: '/items/sections' },
      { text: 'Measurement Units', path: '/items/units' },
      { text: 'Tax / GST Rates', path: '/items/taxes' },
      { text: 'Price Lists', path: '/items/price-lists' },
    ],
  },
  {
    title: 'Customer Relations',
    icon: <PeopleIcon fontSize="small" />,
    path: '/customers',
    allowedRoles: ['ADMIN', 'BILLING_CLERK', 'ACCOUNTS', 'STAFF'],
    subItems: [
      { text: 'Customer Directory', path: '/customers' },
      { text: 'Customer Groups', path: '/customers/groups' },
    ],
  },
  {
    title: 'Supplier Network',
    icon: <SupplierIcon fontSize="small" />,
    path: '/suppliers',
    allowedRoles: ['ADMIN', 'PURCHASE_MANAGER', 'ACCOUNTS', 'STAFF'],
    subItems: [
      { text: 'Supplier Accounts', path: '/suppliers' },
      { text: 'Supplier Groups', path: '/suppliers/groups' },
    ],
  },
  {
    title: 'Sales & Billing',
    icon: <SalesIcon fontSize="small" />,
    path: '/sales',
    allowedRoles: ['ADMIN', 'BILLING_CLERK', 'STORE_MANAGER', 'STAFF'],
    subItems: [
      { text: 'Sales Invoices', path: '/sales/list' },
      { text: 'New Sales Invoice', path: '/sales/entry' },
      { text: 'Quotations', path: '/sales/quotations' },
      { text: 'Sales Orders', path: '/sales/orders' },
      { text: 'Deliveries & Dispatches', path: '/sales/deliveries' },
      { text: 'Credit Notes', path: '/sales/credit-notes' },
      { text: 'Sales Returns', path: '/sales/return' },
    ],
  },
  {
    title: 'Purchases & Procurement',
    icon: <PurchaseIcon fontSize="small" />,
    path: '/purchases',
    allowedRoles: ['ADMIN', 'PURCHASE_MANAGER', 'STORE_MANAGER', 'STAFF'],
    subItems: [
      { text: 'Purchase Invoices', path: '/purchases/list' },
      { text: 'New Purchase Entry', path: '/purchases/entry' },
      { text: 'Purchase Orders', path: '/purchases/orders' },
      { text: 'Requisitions (PR)', path: '/purchases/requisitions' },
      { text: 'Supplier RFQ Quotations', path: '/purchases/quotations' },
      { text: 'Goods Received (GRN)', path: '/purchases/grn' },
      { text: 'Debit Notes', path: '/purchases/debit-notes' },
      { text: 'Purchase Returns', path: '/purchases/return' },
    ],
  },
  {
    title: 'Warehouses & Stock',
    icon: <WarehouseIcon fontSize="small" />,
    path: '/inventory',
    allowedRoles: ['ADMIN', 'STORE_MANAGER', 'PURCHASE_MANAGER', 'STAFF'],
    subItems: [
      { text: 'Current Stock Balances', path: '/inventory' },
      { text: 'Low & Out of Stock', path: '/inventory/low-stock' },
      { text: 'Stock Movements Ledger', path: '/inventory/ledger' },
      { text: 'Warehouse Transfers', path: '/inventory/transfers' },
      { text: 'Warehouses', path: '/warehouses' },
      { text: 'Storage Bin Locations', path: '/warehouses/locations' },
      { text: 'Warehouse Stock View', path: '/warehouses/stock' },
    ],
  },
  {
    title: 'Financial Ledger',
    icon: <FinanceIcon fontSize="small" />,
    path: '/accounts',
    allowedRoles: ['ADMIN', 'ACCOUNTS', 'BILLING_CLERK'],
    subItems: [
      { text: 'Receivables (AR)', path: '/accounts/receivables' },
      { text: 'Payables (AP)', path: '/accounts/payables' },
      { text: 'Bill Receipts', path: '/accounts/receipts' },
      { text: 'Bill Payments', path: '/accounts/payments' },
      { text: 'General Ledger', path: '/accounts/ledger' },
      { text: 'Daily Cashbook', path: '/accounts/cashbook' },
      { text: 'Operational Expenses', path: '/accounts/expenses' },
      { text: 'Payment Vouchers', path: '/accounts/vouchers' },
      { text: 'Financial Statement', path: '/accounts/summary' },
    ],
  },
  {
    title: 'Reports & Analytics',
    icon: <ReportsIcon fontSize="small" />,
    path: '/reports',
    allowedRoles: ['ADMIN', 'STORE_MANAGER', 'PURCHASE_MANAGER', 'BILLING_CLERK', 'ACCOUNTS', 'STAFF'],
    subItems: [
      { text: 'Sales Performance', path: '/reports/sales' },
      { text: 'Sales Line Details', path: '/reports/sales-details' },
      { text: 'Procurement Report', path: '/reports/purchases' },
      { text: 'Purchase Line Details', path: '/reports/purchase-details' },
      { text: 'Stock Valuation', path: '/reports/stock' },
      { text: 'Customer Collections', path: '/reports/customer-receipts' },
      { text: 'Supplier Disbursements', path: '/reports/supplier-payments' },
    ],
  },
];

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { sidebarCollapsed } = useApp();

  const [openSections, setOpenSections] = useState(() => {
    // Automatically open active module on load
    const activeModule = NAV_MODULES.find(
      (m) => m.subItems && m.subItems.some((s) => location.pathname.startsWith(s.path))
    );
    return activeModule ? { [activeModule.title]: true } : { 'Product Master Data': true };
  });

  const userRole = (user?.role || 'ADMIN').replace(/^ROLE_/, '');

  const handleToggleSection = (title) => {
    if (sidebarCollapsed) return;
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isRouteActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand Header */}
      <Box
        sx={{
          height: 60,
          display: 'flex',
          alignItems: 'center',
          px: sidebarCollapsed ? 1.5 : 2.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          gap: 1.5,
        }}
      >
        <Avatar
          variant="rounded"
          sx={{
            bgcolor: 'primary.main',
            color: '#fff',
            width: 32,
            height: 32,
            fontSize: '0.9rem',
            fontWeight: 800,
            borderRadius: 1.5,
          }}
        >
          E
        </Avatar>
        {!sidebarCollapsed && (
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              EBMS
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', display: 'block' }}>
              Enterprise Operations
            </Typography>
          </Box>
        )}
      </Box>

      {/* Nav List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', py: 1.5, px: sidebarCollapsed ? 1 : 1.5 }}>
        <List dense disablePadding>
          {NAV_MODULES.map((module) => {
            // Role filter check
            if (module.allowedRoles && !module.allowedRoles.includes(userRole) && userRole !== 'ADMIN') {
              return null;
            }

            const hasSub = Boolean(module.subItems && module.subItems.length > 0);
            const isOpen = Boolean(openSections[module.title]);
            const isActive = isRouteActive(module.path);

            return (
              <Box key={module.title} sx={{ mb: 0.5 }}>
                <Tooltip title={sidebarCollapsed ? module.title : ''} placement="right" arrow>
                  <ListItemButton
                    onClick={() => {
                      if (hasSub) {
                        handleToggleSection(module.title);
                      } else {
                        navigate(module.path);
                        if (mobileOpen) handleDrawerToggle();
                      }
                    }}
                    sx={{
                      borderRadius: 1.5,
                      py: 0.8,
                      px: sidebarCollapsed ? 1.2 : 1.5,
                      justifyContent: sidebarCollapsed ? 'center' : 'initial',
                      bgcolor: isActive && !hasSub ? 'action.selected' : 'transparent',
                      color: isActive ? 'primary.main' : 'text.primary',
                      fontWeight: isActive ? 600 : 500,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: sidebarCollapsed ? 0 : 32,
                        mr: sidebarCollapsed ? 0 : 1,
                        justifyContent: 'center',
                        color: isActive ? 'primary.main' : 'text.secondary',
                      }}
                    >
                      {module.icon}
                    </ListItemIcon>

                    {!sidebarCollapsed && (
                      <>
                        <ListItemText
                          primary={module.title}
                          primaryTypographyProps={{
                            fontSize: '0.825rem',
                            fontWeight: isActive ? 600 : 500,
                            noWrap: true,
                          }}
                        />
                        {hasSub && (
                          isOpen ? <ExpandLess fontSize="small" sx={{ color: 'text.disabled' }} /> : <ExpandMore fontSize="small" sx={{ color: 'text.disabled' }} />
                        )}
                      </>
                    )}
                  </ListItemButton>
                </Tooltip>

                {/* Sub-menu items */}
                {hasSub && !sidebarCollapsed && (
                  <Collapse in={isOpen} timeout="auto" unmountOnExit>
                    <List dense disablePadding sx={{ pl: 3.5, mt: 0.3, mb: 0.8 }}>
                      {module.subItems.map((sub) => {
                        const isSubActive = location.pathname === sub.path;

                        return (
                          <ListItemButton
                            key={sub.path}
                            onClick={() => {
                              navigate(sub.path);
                              if (mobileOpen) handleDrawerToggle();
                            }}
                            sx={{
                              borderRadius: 1,
                              py: 0.5,
                              px: 1.5,
                              mb: 0.2,
                              bgcolor: isSubActive ? 'primary.main' : 'transparent',
                              color: isSubActive ? '#ffffff' : 'text.secondary',
                              '&:hover': {
                                bgcolor: isSubActive ? 'primary.dark' : 'action.hover',
                                color: isSubActive ? '#ffffff' : 'text.primary',
                              },
                            }}
                          >
                            <ListItemText
                              primary={sub.text}
                              primaryTypographyProps={{
                                fontSize: '0.775rem',
                                fontWeight: isSubActive ? 600 : 400,
                                noWrap: true,
                              }}
                            />
                          </ListItemButton>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </Box>
            );
          })}
        </List>
      </Box>

      {/* Footer System Status */}
      <Box
        sx={{
          p: sidebarCollapsed ? 1 : 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: sidebarCollapsed ? 'center' : 'left',
        }}
      >
        {!sidebarCollapsed ? (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
              EBMS Platform v2.6
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
              Session: {userRole}
            </Typography>
          </Box>
        ) : (
          <Tooltip title={`Session: ${userRole}`}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', mx: 'auto' }} />
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{
        width: { md: sidebarCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH },
        flexShrink: { md: 0 },
        transition: 'width 0.2s',
      }}
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
            width: EXPANDED_WIDTH,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: sidebarCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
            transition: 'width 0.2s',
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;