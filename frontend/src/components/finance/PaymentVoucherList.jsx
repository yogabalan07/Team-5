// src/components/finance/PaymentVoucherList.jsx
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Search,
  ReceiptLong,
  Close,
  Save,
  Download,
  Delete,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import ConfirmDialog from '../common/ConfirmDialog';
import financeService, { EXPENSE_CATEGORIES, PAYMENT_MODES } from '../../services/financeService';
import { todayISO } from '../../services/businessLogic';

const PaymentVoucherList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({ paymentMode: '', startDate: '', endDate: '' });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    voucherDate: todayISO(),
    payee: '',
    category: '',
    description: '',
    amount: '',
    paymentMode: 'CASH',
    referenceNo: '',
    note: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeService.getPaymentVouchers(page, rowsPerPage, search, filters);
      setRows(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (e) {
      toast.error('Failed to load payment vouchers');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, filters]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openDialog = () => {
    setForm({
      voucherDate: todayISO(),
      payee: '',
      category: '',
      description: '',
      amount: '',
      paymentMode: 'CASH',
      referenceNo: '',
      note: '',
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    setError('');
    if (!String(form.payee).trim()) {
      setError('Payee is required');
      return;
    }
    if (!(Number(form.amount) > 0)) {
      setError('Amount must be greater than zero');
      return;
    }
    setSaving(true);
    try {
      const res = await financeService.createPaymentVoucher(form);
      toast.success(`Voucher ${res.voucherNo} created`);
      setDialogOpen(false);
      setPage(0);
      fetchRows();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Failed to save voucher');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await financeService.deletePaymentVoucher(deleteTarget.id);
      toast.success('Voucher deleted');
      setDeleteTarget(null);
      fetchRows();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Delete failed');
      setDeleteTarget(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await financeService.exportVouchers({ ...filters, search });
      toast.success('Vouchers exported');
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
          <ReceiptLong sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">Payment Vouchers</Typography>
            <Typography variant="body2" color="textSecondary">
              Outgoing payments not tied to a purchase invoice — advances, reimbursements, one-off payouts
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Download />} onClick={handleExport} disabled={exporting}>
            Export CSV
          </Button>
          <Button variant="outlined" onClick={() => navigate('/accounts/expenses')}>
            Expenses
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={openDialog}>
            New Voucher
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search voucher no, payee, category..."
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
              <InputLabel>Mode</InputLabel>
              <Select
                value={filters.paymentMode}
                label="Mode"
                onChange={(e) => {
                  setFilters({ ...filters, paymentMode: e.target.value });
                  setPage(0);
                }}
              >
                <MenuItem value="">All Modes</MenuItem>
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
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Voucher #</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Payee</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell align="right"><strong>Amount</strong></TableCell>
              <TableCell align="center"><strong>Mode</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="700" color="primary.main">{row.voucherNo}</Typography>
                  </TableCell>
                  <TableCell>{row.voucherDate}</TableCell>
                  <TableCell>{row.payee}</TableCell>
                  <TableCell>{row.category || '-'}</TableCell>
                  <TableCell>{row.description || row.note || '-'}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="700">₹{(Number(row.amount) || 0).toFixed(2)}</Typography>
                  </TableCell>
                  <TableCell align="center"><Chip label={row.paymentMode || 'CASH'} size="small" color="info" variant="outlined" /></TableCell>
                  <TableCell align="center">
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {loading ? 'Loading vouchers...' : 'No payment vouchers found'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>New Payment Voucher</DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Voucher Date"
                value={form.voucherDate}
                onChange={(e) => setForm({ ...form, voucherDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payee"
                value={form.payee}
                onChange={(e) => setForm({ ...form, payee: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={form.category}
                  label="Category"
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <MenuItem value="">Uncategorised</MenuItem>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  value={form.paymentMode}
                  label="Payment Mode"
                  onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                >
                  {PAYMENT_MODES.map((m) => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                inputProps={{ min: 0, step: '0.01' }}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reference No"
                value={form.referenceNo}
                onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} startIcon={<Close />} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
            disabled={saving}
          >
            Save Voucher
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Payment Voucher"
        message={`Delete voucher "${deleteTarget?.voucherNo}"? This cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
};

export default PaymentVoucherList;
