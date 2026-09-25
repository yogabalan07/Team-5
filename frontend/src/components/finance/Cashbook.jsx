// src/components/finance/Cashbook.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  TextField,
  InputAdornment,
  LinearProgress,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Search, AccountBalance, Download } from '@mui/icons-material';
import { toast } from 'react-toastify';
import financeService, { PAYMENT_MODES } from '../../services/financeService';

const TYPE_COLORS = {
  RECEIPT: 'success',
  BILL_PAYMENT: 'error',
  EXPENSE: 'warning',
  PAYMENT_VOUCHER: 'secondary',
};

const Cashbook = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalElements, setTotalElements] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({ paymentMode: '', startDate: '', endDate: '' });

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeService.getCashbook(page, rowsPerPage, search, filters);
      setRows(data.content || []);
      setTotalElements(data.totalElements || 0);
      setSummary(data.summary || null);
    } catch (e) {
      toast.error('Failed to load cashbook');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, filters]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await financeService.exportCashbook({ ...filters, search });
      toast.success('Cashbook exported');
    } catch (e) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <AccountBalance sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">Cash & Bank Book</Typography>
            <Typography variant="body2" color="textSecondary">
              Every money movement with running balance — receipts, supplier payments, expenses and vouchers
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={handleExport} disabled={exporting}>
            Export CSV
          </Button>
          <Button variant="outlined" onClick={() => navigate('/accounts/summary')}>
            Financial Summary
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="textSecondary">Total Inflow</Typography>
          <Typography variant="h6" fontWeight="bold" color="success.main">
            ₹{(summary ? summary.totalIn : 0).toFixed(2)}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="textSecondary">Total Outflow</Typography>
          <Typography variant="h6" fontWeight="bold" color="error.main">
            ₹{(summary ? summary.totalOut : 0).toFixed(2)}
          </Typography>
        </Paper>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" color="textSecondary">Net Balance</Typography>
          <Typography variant="h6" fontWeight="bold" color="primary.main">
            ₹{(summary ? summary.balance : 0).toFixed(2)}
          </Typography>
        </Paper>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search number, party, description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Account</InputLabel>
              <Select
                value={filters.paymentMode}
                label="Account"
                onChange={(e) => {
                  setFilters({ ...filters, paymentMode: e.target.value });
                  setPage(0);
                }}
              >
                <MenuItem value="">All Accounts</MenuItem>
                {PAYMENT_MODES.map((m) => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From"
              value={filters.startDate}
              onChange={(e) => {
                setFilters({ ...filters, startDate: e.target.value });
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To"
              value={filters.endDate}
              onChange={(e) => {
                setFilters({ ...filters, endDate: e.target.value });
                setPage(0);
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              size="small"
              onClick={() => {
                setFilters({ paymentMode: '', startDate: '', endDate: '' });
                setSearch('');
                setPage(0);
              }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
        {summary && (
          <Box mt={2} display="flex" gap={1} flexWrap="wrap">
            {Object.keys(summary.byMode || {}).map((m) => (
              <Chip
                key={m}
                label={`${m}: ₹${(summary.byMode[m] || 0).toFixed(2)}`}
                color={(summary.byMode[m] || 0) >= 0 ? 'success' : 'error'}
                variant="outlined"
              />
            ))}
          </Box>
        )}
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Number</strong></TableCell>
              <TableCell><strong>Party / Category</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell align="right"><strong>In</strong></TableCell>
              <TableCell align="right"><strong>Out</strong></TableCell>
              <TableCell align="right"><strong>Balance</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={`${row.type}_${row.id}`} hover>
                  <TableCell>{row.date || '-'}</TableCell>
                  <TableCell>
                    <Chip label={row.type.replace(/_/g, ' ')} color={TYPE_COLORS[row.type] || 'default'} size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="700">{row.number || '-'}</Typography>
                  </TableCell>
                  <TableCell>{row.party || '-'}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell align="right" sx={{ color: 'success.main', fontWeight: 700 }}>
                    {row.inflow > 0 ? `₹${row.inflow.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'error.main', fontWeight: 700 }}>
                    {row.outflow > 0 ? `₹${row.outflow.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="700">₹{(row.balance || 0).toFixed(2)}</Typography>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {loading ? 'Loading cashbook...' : 'No cash/bank transactions found'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
    </Box>
  );
};

export default Cashbook;
