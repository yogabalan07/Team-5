// src/components/inventory/StockTransferList.jsx
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
  Autocomplete,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Add,
  Search,
  SwapVert,
  Close,
  Save,
  Inventory,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import warehouseService from '../../services/warehouseService';
import { todayISO } from '../../services/businessLogic';

const StockTransferList = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    transferDate: todayISO(),
    source: null,
    destination: null,
    notes: '',
    lines: [{ itemId: '', itemName: '', quantity: 1 }],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await warehouseService.getTransfers(page, rowsPerPage, search);
      setRows(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load stock transfers');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const loadMasters = async () => {
    try {
      const [whs, its] = await Promise.all([
        warehouseService.getAllWarehouses(),
        warehouseService.getStockForWarehouse('main', 0, 1000, ''),
      ]);
      setWarehouses(whs);
      setItems((its && its.content) || []);
    } catch (e) {
      toast.error('Failed to load warehouses or items');
    }
  };

  const openDialog = () => {
    setForm({
      transferDate: todayISO(),
      source: null,
      destination: null,
      notes: '',
      lines: [{ itemId: '', itemName: '', quantity: 1 }],
    });
    setError('');
    setDialogOpen(true);
    loadMasters();
  };

  const handleLineChange = (index, field, value) => {
    const next = form.lines.map((l) => ({ ...l }));
    next[index][field] = value;
    if (field === 'itemId') {
      const item = items.find((i) => i.itemId === value || i.id === value);
      if (item) next[index].itemName = item.itemName || item.name || '';
    }
    setForm({ ...form, lines: next });
  };

  const addLine = () => {
    setForm({ ...form, lines: [...form.lines, { itemId: '', itemName: '', quantity: 1 }] });
  };

  const removeLine = (index) => {
    if (form.lines.length <= 1) return;
    setForm({ ...form, lines: form.lines.filter((_, i) => i !== index) });
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.source || !form.destination) {
      setError('Select both source and destination warehouses');
      return;
    }
    if (form.source.id === form.destination.id) {
      setError('Source and destination must be different warehouses');
      return;
    }
    const lines = form.lines.filter((l) => l.itemId && Number(l.quantity) > 0);
    if (!lines.length) {
      setError('Add at least one item with quantity greater than zero');
      return;
    }

    setSaving(true);
    try {
      const res = await warehouseService.createTransfer({
        transferDate: form.transferDate,
        sourceId: form.source.id,
        destinationId: form.destination.id,
        items: lines.map((l) => ({ itemId: l.itemId, itemName: l.itemName, quantity: Number(l.quantity) })),
        notes: form.notes,
      });
      toast.success(`Transfer ${res.transferNumber} completed`);
      setDialogOpen(false);
      setPage(0);
      fetchRows();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Transfer failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <SwapVert sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Stock Transfers
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Move stock between warehouses — source out and destination in are committed atomically
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<Inventory />} onClick={() => navigate('/inventory')}>
            Current Stock
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={openDialog}>
            New Transfer
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by transfer number, warehouse names..."
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
              <TableCell><strong>Transfer #</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Source</strong></TableCell>
              <TableCell><strong>Destination</strong></TableCell>
              <TableCell align="right"><strong>Lines</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="700" color="primary.main">
                      {row.transferNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.transferDate}</TableCell>
                  <TableCell>{row.sourceName}</TableCell>
                  <TableCell>{row.destinationName}</TableCell>
                  <TableCell align="right">{(row.items || []).length}</TableCell>
                  <TableCell align="center">
                    <Chip label={row.status || 'COMPLETED'} color="success" size="small" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {loading ? 'Loading transfers...' : 'No stock transfers found'}
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>New Stock Transfer</DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="date"
                label="Transfer Date"
                value={form.transferDate}
                onChange={(e) => setForm({ ...form, transferDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={warehouses}
                getOptionLabel={(w) => `${w.code} — ${w.name}`}
                value={form.source}
                onChange={(e, w) => setForm({ ...form, source: w })}
                renderInput={(params) => <TextField {...params} label="Source Warehouse" />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Autocomplete
                options={warehouses}
                getOptionLabel={(w) => `${w.code} — ${w.name}`}
                value={form.destination}
                onChange={(e, w) => setForm({ ...form, destination: w })}
                renderInput={(params) => <TextField {...params} label="Destination Warehouse" />}
              />
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1" fontWeight="bold">Transfer Lines</Typography>
            <Button size="small" variant="outlined" onClick={addLine}>Add Line</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell width="60%"><strong>Item</strong></TableCell>
                  <TableCell width="25%"><strong>Quantity</strong></TableCell>
                  <TableCell width="15%" align="center"><strong>Del</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {form.lines.map((line, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Autocomplete
                        options={items}
                        getOptionLabel={(i) => `${i.itemName || i.name} (${i.itemCode || ''})`}
                        value={items.find((i) => (i.itemId || i.id) === line.itemId) || null}
                        onChange={(e, val) =>
                          handleLineChange(idx, 'itemId', val ? (val.itemId || val.id) : '')
                        }
                        renderInput={(params) => <TextField {...params} size="small" label="Item" />}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        fullWidth
                        inputProps={{ min: 1 }}
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="error" onClick={() => removeLine(idx)} disabled={form.lines.length <= 1}>
                        <Close fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            sx={{ mt: 2 }}
          />
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
            Execute Transfer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StockTransferList;
