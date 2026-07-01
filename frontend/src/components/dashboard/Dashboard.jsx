import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  LinearProgress,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ShoppingCart,
  People,
  Inventory,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Receipt,
  Payment,
  Add,
  Visibility,
  ArrowForward,
  Store,
  LocalShipping,
  Payment as PaymentIcon,
  Assessment,
  Sell,
  Purchase,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalSuppliers: 0,
    totalItems: 0,
    totalSales: 0,
    totalPurchases: 0,
    stockValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
  });
  const [recentSales, setRecentSales] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        customersRes,
        suppliersRes,
        itemsRes,
        salesRes,
        purchasesRes,
        stockSummaryRes,
        recentSalesRes,
        recentPurchasesRes,
      ] = await Promise.all([
        api.get('/customers?page=0&size=1'),
        api.get('/suppliers?page=0&size=1'),
        api.get('/items?page=0&size=1'),
        api.get('/sales/invoices?page=0&size=100'),
        api.get('/purchase-invoices?page=0&size=100'),
        api.get('/reports/stock/summary'),
        api.get('/sales/invoices?page=0&size=5&sort=createdAt,desc'),
        api.get('/purchase-invoices?page=0&size=5&sort=createdAt,desc'),
      ]);

      const totalSales = salesRes.data.content?.reduce(
        (sum, inv) => sum + (inv.netAmount || 0),
        0
      ) || 0;

      const totalPurchases = purchasesRes.data.content?.reduce(
        (sum, inv) => sum + (inv.netAmount || 0),
        0
      ) || 0;

      // Get recent sales
      const recentSalesData = recentSalesRes.data.content?.slice(0, 5) || [];
      setRecentSales(recentSalesData);

      // Get recent purchases
      const recentPurchasesData = recentPurchasesRes.data.content?.slice(0, 5) || [];
      setRecentPurchases(recentPurchasesData);

      // Get stock summary
      const stockSummary = stockSummaryRes.data || {};

      setStats({
        totalCustomers: customersRes.data.totalElements || 0,
        totalSuppliers: suppliersRes.data.totalElements || 0,
        totalItems: itemsRes.data.totalElements || 0,
        totalSales: totalSales,
        totalPurchases: totalPurchases,
        stockValue: stockSummary.totalStockValue || 0,
        lowStockItems: stockSummary.lowStockItems || 0,
        outOfStockItems: stockSummary.outOfStock || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const StatCard = ({ title, value, icon, color, onClick, subtitle, badge }) => (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: color + '20',
              borderRadius: 2,
              p: 1.5,
              position: 'relative',
            }}
          >
            {icon}
            {badge && (
              <Chip
                label={badge}
                size="small"
                color="error"
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  height: 20,
                  '& .MuiChip-label': {
                    fontSize: '0.6rem',
                    px: 0.5,
                  },
                }}
              />
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const TransactionItem = ({ transaction, type }) => (
    <ListItem 
      button
      onClick={() => {
        if (type === 'SALE') {
          navigate(`/sales/invoices/${transaction.id}`);
        } else {
          navigate(`/purchase/invoices/${transaction.id}`);
        }
      }}
    >
      <ListItemIcon>
        {type === 'SALE' ? (
          <Avatar sx={{ bgcolor: '#e3f2fd', color: '#1976d2' }}>
            <TrendingUp />
          </Avatar>
        ) : (
          <Avatar sx={{ bgcolor: '#fff3e0', color: '#ed6c02' }}>
            <TrendingDown />
          </Avatar>
        )}
      </ListItemIcon>
      <ListItemText
        primary={
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2" fontWeight={500}>
              {type === 'SALE' ? 'Sale' : 'Purchase'} #{transaction.invoiceNo || transaction.poNumber}
            </Typography>
            <Typography variant="body2" fontWeight="bold" color={type === 'SALE' ? 'primary' : 'warning.main'}>
              {formatCurrency(transaction.netAmount || transaction.totalAmount || 0)}
            </Typography>
          </Box>
        }
        secondary={
          <Box display="flex" justifyContent="space-between">
            <Typography variant="caption" color="textSecondary">
              {transaction.customerName || transaction.supplierName || 'N/A'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              {formatDate(transaction.createdAt)}
            </Typography>
          </Box>
        }
      />
    </ListItem>
  );

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
        <Typography textAlign="center" sx={{ mt: 2 }} color="textSecondary">
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Welcome back! Here's what's happening with your inventory today.
          </Typography>
        </Box>
      </Box>

      {/* Quick Actions - Above Transactions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<ShoppingCart />}
              onClick={() => navigate('/sales/entry')}
              sx={{ height: 56, borderRadius: 2 }}
            >
              New Sale
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button
              fullWidth
              variant="contained"
              color="warning"
              startIcon={<Receipt />}
              onClick={() => navigate('/purchases/entry')}
              sx={{ height: 56, borderRadius: 2 }}
            >
              New Purchase
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<PaymentIcon />}
              onClick={() => navigate('/accounts/receipts')}
              sx={{ height: 56, borderRadius: 2 }}
            >
              Receive Payment
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button
              fullWidth
              variant="outlined"
              color="warning"
              startIcon={<PaymentIcon />}
              onClick={() => navigate('/accounts/payments')}
              sx={{ height: 56, borderRadius: 2 }}
            >
              Make Payment
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button
              fullWidth
              variant="outlined"
              color="success"
              startIcon={<Inventory />}
              onClick={() => navigate('/items/new')}
              sx={{ height: 56, borderRadius: 2 }}
            >
              Add Item
            </Button>
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <Button
              fullWidth
              variant="outlined"
              color="info"
              startIcon={<Assessment />}
              onClick={() => navigate('/reports/stock')}
              sx={{ height: 56, borderRadius: 2 }}
            >
              Stock Report
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Customers"
            value={stats.totalCustomers}
            icon={<People sx={{ color: '#1976d2' }} />}
            color="#1976d2"
            onClick={() => navigate('/customers')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Suppliers"
            value={stats.totalSuppliers}
            icon={<LocalShipping sx={{ color: '#2e7d32' }} />}
            color="#2e7d32"
            onClick={() => navigate('/suppliers')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Items"
            value={stats.totalItems}
            icon={<Inventory sx={{ color: '#ed6c02' }} />}
            color="#ed6c02"
            onClick={() => navigate('/items')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Alert"
            value={stats.lowStockItems + stats.outOfStockItems}
            icon={<Warning sx={{ color: '#d32f2f' }} />}
            color="#d32f2f"
            badge={stats.outOfStockItems > 0 ? `${stats.outOfStockItems} out of stock` : null}
            onClick={() => navigate('/items?tab=low-stock')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} mt={1}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Sales"
            value={formatCurrency(stats.totalSales)}
            icon={<ShoppingCart sx={{ color: '#1976d2' }} />}
            color="#1976d2"
            onClick={() => navigate('/sales/list')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Purchases"
            value={formatCurrency(stats.totalPurchases)}
            icon={<Receipt sx={{ color: '#ed6c02' }} />}
            color="#ed6c02"
            onClick={() => navigate('/purchases/list')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Closing Stock Value"
            value={formatCurrency(stats.stockValue)}
            icon={<AttachMoney sx={{ color: '#2e7d32' }} />}
            color="#2e7d32"
            onClick={() => navigate('/reports/stock')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Items"
            value={stats.totalItems - (stats.lowStockItems + stats.outOfStockItems)}
            icon={<CheckCircle sx={{ color: '#4caf50' }} />}
            color="#4caf50"
            onClick={() => navigate('/items')}
          />
        </Grid>
      </Grid>

      {/* Recent Transactions - Separate Sale and Purchase */}
      <Grid container spacing={3} mt={1}>
        {/* Recent Sales */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <ShoppingCart sx={{ color: '#1976d2' }} />
                <Typography variant="h6">Recent Sales</Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowForward />}
                onClick={() => navigate('/sales/list')}
              >
                View All
              </Button>
            </Box>
            <List>
              {recentSales.length > 0 ? (
                recentSales.map((transaction, index) => (
                  <React.Fragment key={index}>
                    <TransactionItem transaction={transaction} type="SALE" />
                    {index < recentSales.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              ) : (
                <Typography color="textSecondary" textAlign="center" py={3}>
                  No recent sales
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Recent Purchases */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Receipt sx={{ color: '#ed6c02' }} />
                <Typography variant="h6">Recent Purchases</Typography>
              </Box>
              <Button
                size="small"
                endIcon={<ArrowForward />}
                onClick={() => navigate('/purchases/list')}
              >
                View All
              </Button>
            </Box>
            <List>
              {recentPurchases.length > 0 ? (
                recentPurchases.map((transaction, index) => (
                  <React.Fragment key={index}>
                    <TransactionItem transaction={transaction} type="PURCHASE" />
                    {index < recentPurchases.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              ) : (
                <Typography color="textSecondary" textAlign="center" py={3}>
                  No recent purchases
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;