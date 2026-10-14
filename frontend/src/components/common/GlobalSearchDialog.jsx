import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import {
  Search,
  Dashboard,
  People,
  LocalShipping,
  Inventory,
  ShoppingCart,
  Receipt,
  AccountBalance,
  BarChart,
  AdminPanelSettings,
  History,
  QrCode,
  Warehouse,
  ArrowForward,
} from '@mui/icons-material';

const NAVIGATION_TARGETS = [
  { title: 'Dashboard Overview', category: 'Navigation', path: '/dashboard', icon: <Dashboard /> },
  { title: 'Customer Directory', category: 'Customers', path: '/customers', icon: <People /> },
  { title: 'Customer Groups & Credit Limits', category: 'Customers', path: '/customers/groups', icon: <People /> },
  { title: 'Supplier & Vendor Accounts', category: 'Suppliers', path: '/suppliers', icon: <LocalShipping /> },
  { title: 'Product Catalog & Master SKUs', category: 'Products', path: '/items', icon: <Inventory /> },
  { title: 'Batch & Lot Tracking', category: 'Products', path: '/items/batches', icon: <QrCode /> },
  { title: 'Serial Number Registry', category: 'Products', path: '/items/serials', icon: <QrCode /> },
  { title: 'Price Lists & Tiers', category: 'Products', path: '/items/price-lists', icon: <Inventory /> },
  { title: 'Sales Invoices & Billing', category: 'Sales', path: '/sales/list', icon: <ShoppingCart /> },
  { title: 'Sales Quotations (Draft/Accepted)', category: 'Sales', path: '/sales/quotations', icon: <ShoppingCart /> },
  { title: 'Sales Order Fulfillment', category: 'Sales', path: '/sales/orders', icon: <ShoppingCart /> },
  { title: 'Sales Returns & Credit Notes', category: 'Sales', path: '/sales/credit-notes', icon: <ShoppingCart /> },
  { title: 'Purchase Requisitions (PR)', category: 'Purchases', path: '/purchases/requisitions', icon: <Receipt /> },
  { title: 'Purchase Orders & Approvals', category: 'Purchases', path: '/purchases/orders', icon: <Receipt /> },
  { title: 'Goods Received Notes (GRN)', category: 'Purchases', path: '/purchases/grn', icon: <Receipt /> },
  { title: 'Multi-Warehouse Network', category: 'Warehouses', path: '/warehouses', icon: <Warehouse /> },
  { title: 'Live Stock Ledger', category: 'Inventory', path: '/inventory/ledger', icon: <Inventory /> },
  { title: 'Accounts Receivable & Payables', category: 'Finance', path: '/accounts/receivables', icon: <AccountBalance /> },
  { title: 'General Financial Summary', category: 'Finance', path: '/accounts/summary', icon: <AccountBalance /> },
  { title: 'Sales Performance Reports', category: 'Analytics', path: '/reports/sales', icon: <BarChart /> },
  { title: 'Stock Valuation Reports', category: 'Analytics', path: '/reports/stock', icon: <BarChart /> },
  { title: 'User Management & Access Control', category: 'Security', path: '/admin/users', icon: <AdminPanelSettings /> },
  { title: 'Role & Permission Matrices', category: 'Security', path: '/admin/roles', icon: <AdminPanelSettings /> },
  { title: 'Enterprise Audit Trail Logs', category: 'Security', path: '/admin/audit-logs', icon: <History /> },
];

const GlobalSearchDialog = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filtered = NAVIGATION_TARGETS.filter((target) => {
    return (
      query === '' ||
      target.title.toLowerCase().includes(query.toLowerCase()) ||
      target.category.toLowerCase().includes(query.toLowerCase())
    );
  });

  const handleSelect = (path) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, top: -100 } }}>
      <DialogContent sx={{ p: 2 }}>
        <TextField
          autoFocus
          fullWidth
          variant="outlined"
          size="medium"
          placeholder="Type a screen, command, customer, SKU, or module..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="primary" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Chip size="small" label="ESC to close" variant="outlined" sx={{ fontSize: '0.7rem' }} />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ mt: 2, maxHeight: 380, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                No matching enterprise records or navigation targets found for "{query}".
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {filtered.map((item, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => handleSelect(item.path)}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.5,
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 38, color: 'primary.main' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight={600}>{item.title}</Typography>}
                    secondary={<Typography variant="caption" color="text.secondary">{item.category}</Typography>}
                  />
                  <ArrowForward fontSize="small" sx={{ color: 'text.disabled', opacity: 0.5 }} />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default GlobalSearchDialog;
