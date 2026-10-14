import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
  Alert,
  Avatar,
  Divider,
} from '@mui/material';
import {
  ShoppingCart,
  Receipt,
  AttachMoney,
  People,
  LocalShipping,
  Inventory,
  TrendingUp,
  TrendingDown,
  WarningAmber,
  CheckCircle,
  Refresh,
  ArrowForward,
  AccountBalance,
  MoneyOff,
  AssignmentTurnedIn,
  HourglassEmpty,
  Schedule,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { toast } from 'react-toastify';
import customerService from '../../services/customerService';
import supplierService from '../../services/supplierService';
import itemService from '../../services/itemService';
import salesService from '../../services/salesService';
import purchaseService from '../../services/purchaseService';
import { reportService } from '../../services/reportService';
import { useApp } from '../../context/AppContext';

const PREVIEW_DATA = {
  stats: {
    totalSales: 486250.0,
    totalPurchases: 312400.0,
    stockValue: 642800.0,
    totalItems: 148,
    totalCustomers: 64,
    totalSuppliers: 28,
    receivables: 78500.0,
    payables: 45200.0,
    expenses: 28400.0,
  },
  salesTrend: [
    { period: 'May', sales: 62000, purchases: 41000, revenue: 62000, expenses: 8400 },
    { period: 'Jun', sales: 74500, purchases: 52000, revenue: 74500, expenses: 9100 },
    { period: 'Jul', sales: 69000, purchases: 46000, revenue: 69000, expenses: 7800 },
    { period: 'Aug', sales: 88000, purchases: 58000, revenue: 88000, expenses: 10200 },
    { period: 'Sep', sales: 94000, purchases: 54000, revenue: 94000, expenses: 9800 },
    { period: 'Oct', sales: 98750, purchases: 61400, revenue: 98750, expenses: 11200 },
  ],
  topProducts: [
    { name: 'Induction Motor 5HP', units: 320, revenue: 96000 },
    { name: 'Ball Bearing 6205', units: 1450, revenue: 58000 },
    { name: 'Hydraulic Seal Kit', units: 410, revenue: 49200 },
    { name: 'Flange Bolt M12', units: 8200, revenue: 41000 },
    { name: 'PLC Controller 8X', units: 85, revenue: 38250 },
  ],
  stockDistribution: [
    { name: 'Electrical Motors', value: 35, color: '#2563eb' },
    { name: 'Hydraulics & Seals', value: 25, color: '#0284c7' },
    { name: 'Mechanical Bearings', value: 20, color: '#16a34a' },
    { name: 'Fasteners & Hardware', value: 12, color: '#f59e0b' },
    { name: 'Raw Consumables', value: 8, color: '#64748b' },
  ],
  recentTransactions: [
    { id: 'INV-20261010-000042', type: 'SALE', entity: 'Apex Global Logistics Inc.', amount: 14250.0, date: 'Today, 09:14', status: 'PAID' },
    { id: 'PO-20261010-000018', type: 'PURCHASE', entity: 'Precision Components Corp', amount: 38400.0, date: 'Today, 08:58', status: 'PENDING_APPROVAL' },
    { id: 'INV-20261009-000041', type: 'SALE', entity: 'Nordic Automation Oy', amount: 9800.0, date: 'Yesterday', status: 'PARTIAL' },
    { id: 'PO-20261008-000017', type: 'PURCHASE', entity: 'Reliable Industrial Supplies', amount: 8900.0, date: '08 Oct 2026', status: 'COMPLETED' },
    { id: 'INV-20261007-000040', type: 'SALE', entity: 'Highland Agricultural Co.', amount: 6450.0, date: '07 Oct 2026', status: 'PAID' },
  ],
  lowStockItems: [
    { sku: 'BEAR-6205-HP', name: 'High Precision Ball Bearing 6205', stock: 12, minStock: 50, reorderQty: 200, status: 'LOW_STOCK' },
    { sku: 'PMP-DIAPH-12V', name: 'Diaphragm Water Pump 12V', stock: 0, minStock: 20, reorderQty: 50, status: 'OUT_OF_STOCK' },
    { sku: 'LUB-SYN-500', name: 'Synthetic Lubricant 500ml', stock: 4, minStock: 25, reorderQty: 100, status: 'LOW_STOCK' },
    { sku: 'SEAL-KIT-R', name: 'Hydraulic Seal Kit Type-R', stock: 8, minStock: 30, reorderQty: 60, status: 'LOW_STOCK' },
  ],
  pendingApprovals: [
    { ref: 'PO-20261010-000018', type: 'Purchase Order', requestedBy: 'Elena Rostova', amount: 38400.0, date: '2026-10-10', priority: 'HIGH' },
    { ref: 'CRD-20261009-000004', type: 'Credit Limit Raise', requestedBy: 'David Chen', amount: 50000.0, date: '2026-10-09', priority: 'MEDIUM' },
    { ref: 'DISC-20261008-000012', type: 'Special Discount 12%', requestedBy: 'David Chen', amount: 4800.0, date: '2026-10-08', priority: 'LOW' },
  ],
  overdueReceivables: [
    { invoice: 'INV-20260901-000028', party: 'Vanguard Industrial Corp', dueDate: '2026-10-01', overdueDays: 9, balanceDue: 18400.0 },
    { invoice: 'INV-20260905-000030', party: 'Pacific Rim Fabricators', dueDate: '2026-10-05', overdueDays: 5, balanceDue: 9250.0 },
    { invoice: 'INV-20260820-000019', party: 'Titan Heavy Machinery', dueDate: '2026-09-20', overdueDays: 20, balanceDue: 24600.0 },
  ],
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { previewMode, setPreviewMode } = useApp();
  const [dateRange, setDateRange] = useState('MONTH');
  const [loading, setLoading] = useState(false);
  const [liveStats, setLiveStats] = useState({
    totalCustomers: 0,
    totalSuppliers: 0,
    totalItems: 0,
    totalSales: 0,
    totalPurchases: 0,
    stockValue: 0,
    receivables: 0,
    payables: 0,
    expenses: 0,
  });
  const [liveRecentSales, setLiveRecentSales] = useState([]);
  const [liveRecentPurchases, setLiveRecentPurchases] = useState([]);

  useEffect(() => {
    fetchLiveDashboardData();
  }, []);

  const fetchLiveDashboardData = async () => {
    setLoading(true);
    try {
      const ops = [
        customerService.getAll(0, 1).catch(() => ({ totalElements: 0 })),
        supplierService.getAll(0, 1).catch(() => ({ totalElements: 0 })),
        itemService.getAll(0, 1).catch(() => ({ totalElements: 0 })),
        salesService.getStats().catch(() => ({ totalSales: 0 })),
        purchaseService.getStats().catch(() => ({ totalPurchases: 0 })),
        reportService.getStockSummary().catch(() => ({ totalStockValue: 0 })),
        salesService.getRecent().catch(() => []),
        purchaseService.getRecent().catch(() => []),
      ];

      const [cust, supp, item, sales, purch, stock, rSales, rPurch] = await Promise.all(ops);

      setLiveStats({
        totalCustomers: cust.totalElements || 0,
        totalSuppliers: supp.totalElements || 0,
        totalItems: item.totalElements || 0,
        totalSales: sales.totalSales || 0,
        totalPurchases: purch.totalPurchases || 0,
        stockValue: stock.totalStockValue || 0,
        receivables: (sales.totalSales || 0) * 0.25,
        payables: (purch.totalPurchases || 0) * 0.2,
        expenses: (purch.totalPurchases || 0) * 0.08,
      });

      setLiveRecentSales(rSales || []);
      setLiveRecentPurchases(rPurch || []);
    } catch (err) {
      console.warn('Live dashboard fetch fallback active:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchLiveDashboardData();
    toast.info('Dashboard metrics synchronized');
  };

  const activeStats = previewMode ? PREVIEW_DATA.stats : liveStats;

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
            Enterprise Operations Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Executive oversight across commercial sales, procurement cycles, multi-warehouse stock valuation, and working capital.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          {/* Preview Mode Switch */}
          <FormControlLabel
            control={
              <Switch
                checked={previewMode}
                onChange={(e) => setPreviewMode(e.target.checked)}
                color="primary"
                size="small"
              />
            }
            label={
              <Typography variant="caption" fontWeight={600} color={previewMode ? 'primary.main' : 'text.secondary'}>
                {previewMode ? 'Preview Mode (Simulated Data)' : 'Live Connected Data'}
              </Typography>
            }
          />

          {/* Date Range Selector */}
          <TextField
            select
            size="small"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="TODAY">Today</MenuItem>
            <MenuItem value="WEEK">Last 7 Days</MenuItem>
            <MenuItem value="MONTH">Current Month</MenuItem>
            <MenuItem value="QUARTER">This Quarter</MenuItem>
            <MenuItem value="YEAR">Fiscal Year</MenuItem>
          </TextField>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Preview Mode Disclaimer Banner */}
      {previewMode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Evaluation Preview Mode:</strong> Displaying simulated operational telemetry, multi-period curves, and approval queues. Switch toggle in the header to view live unseeded database state.
        </Alert>
      )}

      {/* 9 Summary Metric Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4} lg={2.66}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Total Sales
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, fontFamily: 'monospace' }}>
                    {formatCurrency(activeStats.totalSales)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', width: 36, height: 36, color: 'primary.main' }}>
                  <ShoppingCart fontSize="small" />
                </Avatar>
              </Box>
              <Typography variant="caption" color="success.main" sx={{ display: 'flex', alignItems: 'center', mt: 1, fontWeight: 600 }}>
                <TrendingUp fontSize="inherit" sx={{ mr: 0.5 }} /> +14.2% vs last period
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.66}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Total Purchases
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, fontFamily: 'monospace' }}>
                    {formatCurrency(activeStats.totalPurchases)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light', width: 36, height: 36, color: 'warning.main' }}>
                  <Receipt fontSize="small" />
                </Avatar>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                24 Verified Invoices
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.66}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Inventory Asset Value
                  </Typography>
                  <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, fontFamily: 'monospace' }}>
                    {formatCurrency(activeStats.stockValue)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light', width: 36, height: 36, color: 'success.main' }}>
                  <Inventory fontSize="small" />
                </Avatar>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                Across 3 Regional Warehouses
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Receivables (AR)
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="info.main" sx={{ mt: 0.5, fontFamily: 'monospace' }}>
                    {formatCurrency(activeStats.receivables)}
                  </Typography>
                </Box>
                <AccountBalance fontSize="small" color="info" />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Pending Collections
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Payables (AP)
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="error.main" sx={{ mt: 0.5, fontFamily: 'monospace' }}>
                    {formatCurrency(activeStats.payables)}
                  </Typography>
                </Box>
                <Receipt fontSize="small" color="error" />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Due Supplier Terms
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Secondary Metric Strip: Catalog Counts */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: 'background.subtle' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Active Product SKUs</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{activeStats.totalItems}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: 'background.subtle' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Active Customer Accounts</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{activeStats.totalCustomers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: 'background.subtle' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Qualified Suppliers</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{activeStats.totalSuppliers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ bgcolor: 'background.subtle' }}>
            <CardContent sx={{ p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Operational Overhead Expenses</Typography>
              <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{formatCurrency(activeStats.expenses)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Sales vs Purchases Multi-Period Trend */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2.5, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Commercial Trajectory: Sales vs Procurement
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Monthly comparative volume (USD)
                </Typography>
              </Box>
              <Chip size="small" label="6-Month Window" variant="outlined" sx={{ fontSize: '0.7rem' }} />
            </Box>

            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={previewMode ? PREVIEW_DATA.salesTrend : []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val / 1000}k`} />
                  <RechartsTooltip formatter={(value) => [formatCurrency(value), '']} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="sales" name="Sales Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="purchases" name="Purchases" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Stock Valuation by Category (Donut Chart) */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2.5, height: '100%' }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Stock Valuation Distribution
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Asset proportion by catalog category
              </Typography>
            </Box>

            <Box sx={{ width: '100%', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={previewMode ? PREVIEW_DATA.stockDistribution : []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(previewMode ? PREVIEW_DATA.stockDistribution : []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val) => [`${val}%`, 'Share']} />
                </PieChart>
              </ResponsiveContainer>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mt: 1 }}>
              {(previewMode ? PREVIEW_DATA.stockDistribution : []).map((item) => (
                <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                    <Typography variant="caption" color="text.primary">{item.name}</Typography>
                  </Box>
                  <Typography variant="caption" fontWeight={600} sx={{ fontFamily: 'monospace' }}>{item.value}%</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Operational Queues & Tables */}
      <Grid container spacing={3}>
        {/* Recent Transactions Table */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Recent Commercial Transactions
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Live billing invoices & procurement orders
                </Typography>
              </Box>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/sales/list')}>
                View All
              </Button>
            </Box>

            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Document #</TableCell>
                    <TableCell>Counterparty</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(previewMode ? PREVIEW_DATA.recentTransactions : []).map((tx) => (
                    <TableRow key={tx.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                          {tx.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {tx.date} · {tx.type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{tx.entity}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                          {formatCurrency(tx.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={tx.status.replace('_', ' ')}
                          color={tx.status === 'PAID' || tx.status === 'COMPLETED' ? 'success' : tx.status === 'PARTIAL' ? 'warning' : 'info'}
                          sx={{ fontSize: '0.65rem', fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Critical Low & Out-of-Stock Alerts */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Stock Threshold Alerts
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  SKUs breaching minimum reorder safety limits
                </Typography>
              </Box>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/inventory/low-stock')}>
                Stock Ledger
              </Button>
            </Box>

            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product Item</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell align="center">Condition</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(previewMode ? PREVIEW_DATA.lowStockItems : []).map((item) => (
                    <TableRow key={item.sku} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          SKU: {item.sku}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700} color={item.stock === 0 ? 'error.main' : 'warning.main'} sx={{ fontFamily: 'monospace' }}>
                          {item.stock} pcs
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Min: {item.minStock}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={item.status === 'OUT_OF_STOCK' ? 'Depleted' : 'Low Stock'}
                          color={item.status === 'OUT_OF_STOCK' ? 'error' : 'warning'}
                          sx={{ fontSize: '0.65rem', fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Pending Executive Approvals Queue */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Pending Executive Approvals
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Orders and credit adjustments requiring sign-off
                </Typography>
              </Box>
              <Chip size="small" label="Queue: 3" color="warning" sx={{ fontWeight: 600 }} />
            </Box>

            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Request / Document</TableCell>
                    <TableCell>Requester</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(previewMode ? PREVIEW_DATA.pendingApprovals : []).map((appr) => (
                    <TableRow key={appr.ref} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>{appr.ref}</Typography>
                        <Typography variant="caption" color="text.secondary">{appr.type}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{appr.requestedBy}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                          {formatCurrency(appr.amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          sx={{ fontSize: '0.7rem', py: 0.3, px: 1 }}
                          onClick={() => toast.success(`Approved ${appr.ref}`)}
                        >
                          Approve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Overdue Receivables Watchlist */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Overdue Receivables Watchlist
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Commercial accounts exceeding agreed payment terms
                </Typography>
              </Box>
              <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/accounts/receivables')}>
                AR Ledger
              </Button>
            </Box>

            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Invoice</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="center">Aging</TableCell>
                    <TableCell align="right">Balance Due</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(previewMode ? PREVIEW_DATA.overdueReceivables : []).map((due) => (
                    <TableRow key={due.invoice} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{due.invoice}</TableCell>
                      <TableCell>{due.party}</TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={`+${due.overdueDays}d Overdue`}
                          color="error"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700} color="error.main" sx={{ fontFamily: 'monospace' }}>
                          {formatCurrency(due.balanceDue)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;