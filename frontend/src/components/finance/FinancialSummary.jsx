// src/components/finance/FinancialSummary.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  TrendingDown,
  AccountBalanceWallet,
  ReceiptLong,
  Payment,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import financeService from '../../services/financeService';
import { todayISO } from '../../services/businessLogic';

const StatCard = ({ label, value, sub, color = 'primary', icon }) => (
  <Paper sx={{ p: 2.5, height: '100%' }}>
    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Typography variant="body2" color="textSecondary">{label}</Typography>
        <Typography variant="h5" fontWeight="bold" color={`${color}.main`}>{value}</Typography>
        {sub && (
          <Typography variant="caption" color="textSecondary">{sub}</Typography>
        )}
      </Box>
      <Box color={`${color}.main`}>{icon}</Box>
    </Box>
  </Paper>
);

const FinancialSummary = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financeService.getFinancialSummary(filters);
      setData(res);
    } catch (e) {
      toast.error('Failed to load financial summary');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const money = (n) => `₹${(Number(n) || 0).toFixed(2)}`;
  const period = (data && data.period) || {};

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <AccountBalanceWallet sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">Financial Summary</Typography>
            <Typography variant="body2" color="textSecondary">
              Position now and performance for the selected period
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={() => navigate('/accounts/cashbook')}>Cash & Bank</Button>
          <Button variant="outlined" onClick={() => navigate('/accounts/receivables')}>Receivables</Button>
          <Button variant="outlined" onClick={() => navigate('/accounts/payables')}>Payables</Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            type="date"
            label="Period From"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            type="date"
            label="Period To"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            size="small"
            onClick={() => setFilters({ startDate: todayISO().slice(0, 8) + '01', endDate: todayISO() })}
          >
            This Month
          </Button>
          <Button size="small" onClick={() => setFilters({ startDate: '', endDate: '' })}>
            All Time
          </Button>
        </Box>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Typography variant="subtitle1" fontWeight="bold" mb={1}>Current Position</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard
          label="Accounts Receivable"
          value={money(data && data.totalReceivables)}
          sub={`${(data && data.openInvoices && data.openInvoices.receivable) || 0} open invoices`}
          color="primary"
          icon={<TrendingUp />}
        />
        <StatCard
          label="Accounts Payable"
          value={money(data && data.totalPayables)}
          sub={`${(data && data.openInvoices && data.openInvoices.payable) || 0} open bills`}
          color="warning"
          icon={<TrendingDown />}
        />
        <StatCard
          label="Cash & Bank Balance"
          value={money(data && data.cashBalance)}
          sub={
            data && data.cashByMode
              ? `Cash ${money(data.cashByMode.CASH)} · Bank ${money(data.cashByMode.BANK)} · Cheque ${money(data.cashByMode.CHEQUE)}`
              : ''
          }
          color="success"
          icon={<AccountBalance />}
        />
        <StatCard
          label="Overdue Receivables"
          value={money(data && data.overdueReceivables)}
          sub={`${(data && data.overdueCount) || 0} invoices past due date`}
          color="error"
          icon={<ReceiptLong />}
        />
      </Box>

      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
        Period Performance{period.startDate || period.endDate ? ` (${period.startDate || 'start'} → ${period.endDate || 'today'})` : ' (all time)'}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <StatCard label="Sales (Invoiced)" value={money(period.sales)} color="primary" icon={<TrendingUp />} />
        <StatCard label="Purchases (Billed)" value={money(period.purchases)} color="warning" icon={<TrendingDown />} />
        <StatCard
          label="Expenses"
          value={money(period.expenses)}
          sub={`Vouchers ${money(period.vouchers)}`}
          color="error"
          icon={<Payment />}
        />
        <StatCard label="Money In (Receipts)" value={money(period.moneyIn)} color="success" icon={<TrendingUp />} />
        <StatCard label="Money Out (Supplier Payments)" value={money(period.moneyOut)} color="error" icon={<TrendingDown />} />
        <StatCard
          label="Net (Sales − Purchases − Expenses)"
          value={money(period.net)}
          sub="Indicative, before tax and adjustments"
          color={(Number(period.net) || 0) >= 0 ? 'success' : 'error'}
          icon={<AccountBalanceWallet />}
        />
      </Box>

      <Box display="flex" gap={1} flexWrap="wrap">
        <Chip label="Aging: 0-30 / 31-60 / 61-90 / 90+ on Receivables & Payables" variant="outlined" />
        <Chip label="Cashbook merges receipts, payments, expenses and vouchers" variant="outlined" />
        <Chip label="Figures update from live Firestore data" variant="outlined" />
      </Box>
    </Box>
  );
};

export default FinancialSummary;
