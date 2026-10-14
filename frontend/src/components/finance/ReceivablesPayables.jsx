// src/components/finance/ReceivablesPayables.jsx
// Accounts Receivable / Accounts Payable aging with party breakdown.
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
  Tabs,
  Tab,
} from '@mui/material';
import { Search, TrendingUp, TrendingDown, AccountBalanceWallet } from '@mui/icons-material';
import { toast } from 'react-toastify';
import financeService from '../../services/financeService';

const BUCKETS = ['0-30', '31-60', '61-90', '90+'];
const BUCKET_COLORS = { '0-30': 'success', '31-60': 'warning', '61-90': 'error', '90+': 'error' };

const ReceivablesPayables = ({ mode = 'AR' }) => {
  const navigate = useNavigate();
  const isAR = mode === 'AR';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = isAR ? await financeService.getReceivables() : await financeService.getPayables();
      setData(res);
    } catch (e) {
      toast.error(`Failed to load ${isAR ? 'receivables' : 'payables'}`);
    } finally {
      setLoading(false);
    }
  }, [isAR]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const rows = (data && data.rows) || [];
  const term = search.trim().toLowerCase();
  const filtered = term
    ? rows.filter((r) =>
        [r.invoiceNo, r.partyName].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))
      )
    : rows;
  const filteredParties = term
    ? ((data && data.parties) || []).filter((p) => String(p.partyName || '').toLowerCase().includes(term))
    : (data && data.parties) || [];

  const paged = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const summaryCards = data
    ? [
        {
          label: isAR ? 'Total Receivable' : 'Total Payable',
          value: `₹${(data.totalBalance || 0).toFixed(2)}`,
          icon: isAR ? <TrendingUp /> : <TrendingDown />,
          color: 'primary',
        },
        {
          label: isAR ? 'Overdue Receivable' : 'Overdue Payable',
          value: `₹${(data.overdueTotal || 0).toFixed(2)}`,
          icon: <AccountBalanceWallet />,
          color: 'error',
        },
        {
          label: 'Open Invoices',
          value: data.totalInvoices || 0,
          icon: <AccountBalanceWallet />,
          color: 'info',
        },
        {
          label: 'Overdue Invoices',
          value: data.overdueCount || 0,
          icon: <AccountBalanceWallet />,
          color: 'warning',
        },
      ]
    : [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            {isAR ? 'Accounts Receivable' : 'Accounts Payable'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {isAR
              ? 'Outstanding customer invoices with aging and overdue analysis'
              : 'Outstanding supplier bills with aging and overdue analysis'}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/accounts/summary')}>
          Financial Summary
        </Button>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {summaryCards.map((c) => (
          <Paper key={c.label} sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" color="textSecondary">{c.label}</Typography>
                <Typography variant="h6" fontWeight="bold" color={`${c.color}.main`}>{c.value}</Typography>
              </Box>
              <Box color={`${c.color}.main`}>{c.icon}</Box>
            </Box>
          </Paper>
        ))}
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder={`Search ${isAR ? 'invoice or customer' : 'invoice or supplier'}...`}
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
            sx={{ flexGrow: 1, minWidth: 240 }}
          />
        </Box>
        <Box mt={2} display="flex" gap={1} flexWrap="wrap">
          {BUCKETS.map((b) => (
            <Chip
              key={b}
              label={`${b} days: ₹${((data && data.totals && data.totals[b]) || 0).toFixed(2)}`}
              color={BUCKET_COLORS[b]}
              variant="outlined"
            />
          ))}
        </Box>
      </Paper>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, v) => { setTab(v); setPage(0); }} sx={{ px: 2, pt: 1 }}>
          <Tab label="Invoices" />
          <Tab label="By Party" />
        </Tabs>

        {tab === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>{isAR ? 'Invoice #' : 'Bill #'}</strong></TableCell>
                  <TableCell><strong>{isAR ? 'Customer' : 'Supplier'}</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell align="right"><strong>Total</strong></TableCell>
                  <TableCell align="right"><strong>Balance</strong></TableCell>
                  <TableCell align="right"><strong>Days</strong></TableCell>
                  <TableCell align="center"><strong>Aging</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.length > 0 ? (
                  paged.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="700" color="primary.main">{row.invoiceNo}</Typography>
                      </TableCell>
                      <TableCell>{row.partyName || '-'}</TableCell>
                      <TableCell>{row.date || '-'}</TableCell>
                      <TableCell align="right">₹{row.grandTotal.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="700" color="error.main">₹{row.balance.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell align="right">{row.days}</TableCell>
                      <TableCell align="center">
                        <Chip label={row.bucket} color={BUCKET_COLORS[row.bucket]} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="center">
                        {row.overdue ? (
                          <Chip label="OVERDUE" color="error" size="small" />
                        ) : (
                          <Chip label={row.paymentStatus || 'DUE'} color="warning" size="small" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        {loading ? 'Loading...' : `No open ${isAR ? 'receivables' : 'payables'}`}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={filtered.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, p) => setPage(p)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </TableContainer>
        )}

        {tab === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>{isAR ? 'Customer' : 'Supplier'}</strong></TableCell>
                  <TableCell align="right"><strong>Open Invoices</strong></TableCell>
                  <TableCell align="right"><strong>Balance</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredParties.length > 0 ? (
                  filteredParties.map((p, idx) => (
                    <TableRow key={p.partyId || idx} hover>
                      <TableCell>{p.partyName}</TableCell>
                      <TableCell align="right">{p.invoiceCount}</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="700" color="error.main">₹{p.balance.toFixed(2)}</Typography>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">No party balances</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default ReceivablesPayables;
