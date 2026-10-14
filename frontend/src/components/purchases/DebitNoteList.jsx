// src/components/purchases/DebitNoteList.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Search,
  Receipt,
  Close,
  Save,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import purchaseWorkflowService from '../../services/purchaseWorkflowService';
import { todayISO } from '../../services/businessLogic';

const DebitNoteList = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [form, setForm] = useState({
    invoiceNo: '',
    noteDate: todayISO(),
    amount: '',
    reason: '',
  });

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await purchaseWorkflowService.getDebitNotes(page, rowsPerPage, search);
      setRows(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load debit notes');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openDialog = () => {
    setForm({ invoiceNo: '', noteDate: todayISO(), amount: '', reason: '' });
    setInvoice(null);
    setError('');
    setLookupError('');
    setDialogOpen(true);
  };

  const lookupInvoice = async () => {
    setLookupError('');
    setInvoice(null);
    const invNo = form.invoiceNo.trim();
    if (!invNo) {
      setLookupError('Enter a purchase invoice number to look up');
      return;
    }
    try {
      const inv = await purchaseWorkflowService.getPurchaseInvoiceByNo(invNo);
      setInvoice(inv);
      if (!form.amount && Number(inv.balanceAmount) > 0) {
        setForm((prev) => ({ ...prev, amount: String(inv.balanceAmount) }));
      }
    } catch (e) {
      setLookupError(e.response?.data?.error || e.message || 'Purchase invoice not found');
    }
  };

  const handleSubmit = async () => {
    setError('');
    const amount = Number(form.amount);
    if (!invoice) {
      setError('Look up a valid purchase invoice first');
      return;
    }
    if (!amount || amount <= 0) {
      setError('Debit note amount must be greater than zero');
      return;
    }
    if (Number(invoice.balanceAmount) > 0 && amount > Number(invoice.balanceAmount)) {
      setError(`Amount exceeds outstanding invoice balance (${invoice.balanceAmount})`);
      return;
    }

    setSaving(true);
    try {
      const res = await purchaseWorkflowService.createDebitNote({
        noteDate: form.noteDate,
        purchaseInvoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        supplierId: invoice.supplierId,
        supplierName: invoice.supplierName,
        amount,
        reason: form.reason || 'Short delivery / price difference / damaged goods',
      });
      toast.success(`Debit note ${res.noteNumber} created successfully`);
      setDialogOpen(false);
      setPage(0);
      fetchRows();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create debit note');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amt || 0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <Receipt sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Debit Notes
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Debit supplier accounts for short deliveries, price differences and damaged goods
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openDialog} sx={{ borderRadius: 2 }}>
          New Debit Note
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by debit note number, invoice number, supplier..."
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
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Debit Note #</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Invoice #</strong></TableCell>
              <TableCell><strong>Supplier</strong></TableCell>
              <TableCell><strong>Reason</strong></TableCell>
              <TableCell align="right"><strong>Amount (₹)</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((n) => (
                <TableRow key={n.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="700" color="primary.main">
                      {n.noteNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{n.noteDate}</TableCell>
                  <TableCell>{n.invoiceNo || '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">{n.supplierName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">{n.reason || '-'}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Chip label={`- ${formatCurrency(n.amount)}`} color="error" size="small" variant="outlined" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {loading ? 'Loading debit notes...' : 'No debit notes found'}
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
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Create Debit Note</DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Purchase Invoice Number"
                value={form.invoiceNo}
                onChange={(e) => setForm({ ...form, invoiceNo: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') lookupInvoice();
                }}
                placeholder="e.g. PUR-20260925-000001"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button fullWidth variant="outlined" onClick={lookupInvoice} sx={{ height: '100%' }}>
                Look Up
              </Button>
            </Grid>

            {lookupError && (
              <Grid item xs={12}>
                <Alert severity="warning">{lookupError}</Alert>
              </Grid>
            )}

            {invoice && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <strong>{invoice.invoiceNo}</strong> — {invoice.supplierName} | Total:{' '}
                  {formatCurrency(invoice.grandTotal)} | Outstanding: {formatCurrency(invoice.balanceAmount)}
                </Alert>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Debit Note Date"
                value={form.noteDate}
                onChange={(e) => setForm({ ...form, noteDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Debit Amount (₹)"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                inputProps={{ min: 0, step: '0.01' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Reason"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Short delivery, price difference, damaged goods..."
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
            Create Debit Note
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DebitNoteList;
