// src/components/inventory/CurrentStock.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Inventory,
  Search,
  SwapVert,
  Warning,
  Close,
  Save,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import inventoryService, { ADJUSTMENT_REASONS } from '../../services/inventoryService';

const CurrentStock = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const lowOnly = location.pathname === '/inventory/low-stock';

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const [adjustItem, setAdjustItem] = useState(null);
  const [form, setForm] = useState({ reasonCode: 'COUNT_DIFFERENCE', quantity: 0, note: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = lowOnly
        ? await inventoryService.getReorderAlerts(page, rowsPerPage, search)
        : await inventoryService.getCurrentStock(page, rowsPerPage, search);
      setRows(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load stock');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, lowOnly]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openAdjust = (row) => {
    setAdjustItem(row);
    setForm({ reasonCode: 'COUNT_DIFFERENCE', quantity: Number(row.currentStock) || 0, note: '' });
    setError('');
    setSaving(false);
  };

  const handleAdjust = async () => {
    setError('');
    if (!adjustItem) return;
    try {
      setSaving(true);
      const res = await inventoryService.adjustStock({
        itemId: adjustItem.id,
        reasonCode: form.reasonCode,
        quantity: form.quantity,
        note: form.note,
      });
      toast.success(
        `${adjustItem.name}: ${res.stockBefore} → ${res.stockAfter} (${res.reason})`
      );
      setAdjustItem(null);
      fetchRows();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Adjustment failed');
    } finally {
      setSaving(false);
    }
  };

  const stockChip = (row) => {
    if (row.isOutOfStock || Number(row.currentStock) <= 0) {
      return <Chip label="OUT OF STOCK" color="error" size="small" />;
    }
    if (row.isLowStock) {
      return <Chip label="LOW" color="warning" size="small" />;
    }
    return <Chip label="OK" color="success" size="small" variant="outlined" />;
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amt || 0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <Inventory sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {lowOnly ? 'Reorder Management' : 'Current Stock'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {lowOnly
                ? 'Items at or below reorder level and items that are out of stock'
                : 'Live warehouse stock levels with adjustments, damaged/expired write-offs and opening stock'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={lowOnly ? 'outlined' : 'contained'}
            onClick={() => navigate('/inventory')}
            startIcon={<Inventory />}
          >
            All Stock
          </Button>
          <Button
            variant={lowOnly ? 'contained' : 'outlined'}
            onClick={() => navigate('/inventory/low-stock')}
            startIcon={<Warning />}
            color="warning"
          >
            Low / Out of Stock
          </Button>
          <Button variant="outlined" onClick={() => navigate('/inventory/ledger')} startIcon={<SwapVert />}>
            Stock Ledger
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by item name or SKU..."
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
              <TableCell><strong>Item</strong></TableCell>
              <TableCell><strong>SKU</strong></TableCell>
              <TableCell align="right"><strong>Current Stock</strong></TableCell>
              <TableCell align="right"><strong>Reorder Level</strong></TableCell>
              <TableCell align="right"><strong>Max Level</strong></TableCell>
              <TableCell align="right"><strong>Value (₹)</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">{row.name}</Typography>
                    <Typography variant="caption" color="textSecondary">{row.unit || ''}</Typography>
                  </TableCell>
                  <TableCell>{row.itemCode || row.sku || '-'}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="700">{row.currentStock}</Typography>
                  </TableCell>
                  <TableCell align="right">{row.minStock ?? '-'}</TableCell>
                  <TableCell align="right">{row.maxStock ?? '-'}</TableCell>
                  <TableCell align="right">
                    {formatCurrency((Number(row.currentStock) || 0) * (Number(row.purchasePrice) || 0))}
                  </TableCell>
                  <TableCell align="center">{stockChip(row)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Stock Adjustment">
                      <IconButton size="small" color="primary" onClick={() => openAdjust(row)}>
                        <SwapVert fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Ledger for this item">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => navigate(`/inventory/ledger?itemId=${row.id}`)}
                      >
                        <Search fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {loading ? 'Loading stock...' : lowOnly ? 'No low or out-of-stock items' : 'No items found'}
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

      {/* Adjustment Dialog */}
      <Dialog open={!!adjustItem} onClose={() => setAdjustItem(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Stock Adjustment — {adjustItem?.name}
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <Alert severity="info" sx={{ mb: 2 }}>
            Current stock: <strong>{adjustItem?.currentStock}</strong>. Every adjustment writes a
            traceable stock ledger entry with your user name and reason.
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Reason</InputLabel>
                <Select
                  value={form.reasonCode}
                  onChange={(e) => setForm({ ...form, reasonCode: e.target.value })}
                  label="Reason"
                >
                  {ADJUSTMENT_REASONS.map((r) => (
                    <MenuItem key={r.code} value={r.code}>{r.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label={
                  ADJUSTMENT_REASONS.find((r) => r.code === form.reasonCode)?.mode === 'SET'
                    ? 'New Counted Quantity'
                    : 'Quantity'
                }
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                inputProps={{ min: 0, step: '0.01' }}
                helperText={
                  ADJUSTMENT_REASONS.find((r) => r.code === form.reasonCode)?.mode === 'SET'
                    ? 'Stock will be set to this exact counted quantity'
                    : ADJUSTMENT_REASONS.find((r) => r.code === form.reasonCode)?.mode === 'OUT'
                      ? 'Stock will be reduced by this quantity (cannot go below zero)'
                      : 'Stock will be increased by this quantity'
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Note (optional)"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustItem(null)} startIcon={<Close />} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAdjust}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
            disabled={saving}
          >
            Apply Adjustment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CurrentStock;
