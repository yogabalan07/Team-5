// src/components/sales/DeliveryList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
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
  Autocomplete,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Search,
  LocalShipping,
  Close,
  Save,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { salesService } from '../../services/salesService';
import { todayISO } from '../../services/businessLogic';

const STATUS_COLORS = {
  PACKED: 'warning',
  DISPATCHED: 'info',
  IN_TRANSIT: 'primary',
  DELIVERED: 'success',
};

const emptyForm = () => ({
  deliveryDate: todayISO(),
  salesOrderId: '',
  orderNumber: '',
  customerId: '',
  customerName: '',
  shippingAddress: '',
  transporterName: '',
  vehicleNumber: '',
  trackingId: '',
  status: 'DISPATCHED',
  notes: '',
  items: [],
});

const DeliveryList = () => {
  const location = useLocation();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [orders, setOrders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await salesService.getDeliveries(page, rowsPerPage, search);
      setDeliveries(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const openDialog = async () => {
    setError('');
    setForm(emptyForm());
    setDialogOpen(true);
    try {
      const data = await salesService.getOrders(0, 500, '');
      setOrders((data.content || []).filter((o) => o.status !== 'CANCELLED'));
    } catch (e) {
      toast.error('Could not load sales orders');
    }
  };

  useEffect(() => {
    const state = location.state;
    if (state && state.newDelivery) {
      openDialog().then(() => {
        if (state.salesOrderId) {
          applyOrder({
            id: state.salesOrderId,
            orderNumber: state.orderNumber,
            customerId: state.customerId,
            customerName: state.customerName,
            shippingAddress: state.shippingAddress,
            items: state.items || [],
          });
        }
      });
      window.history.replaceState({}, '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const applyOrder = (order) => {
    if (!order) {
      setForm((prev) => ({ ...prev, salesOrderId: '', orderNumber: '', customerId: '', customerName: '', shippingAddress: '', items: [] }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      salesOrderId: order.id || '',
      orderNumber: order.orderNumber || '',
      customerId: order.customerId || '',
      customerName: order.customerName || '',
      shippingAddress: order.shippingAddress || '',
      items: (order.items || []).map((i) => ({
        itemId: i.itemId || '',
        itemName: i.itemName || '',
        itemCode: i.itemCode || '',
        quantity: Number(i.quantity) || 0,
        unitPrice: Number(i.unitPrice) || 0,
      })),
    }));
  };

  const handleQuantityChange = (index, value) => {
    const next = [...form.items];
    next[index] = { ...next[index], quantity: Math.max(0, Number(value) || 0) };
    setForm({ ...form, items: next });
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.customerName) {
      setError('Please select a sales order or customer for this delivery');
      return;
    }
    const validItems = form.items.filter((i) => i.itemName && Number(i.quantity) > 0);
    if (!validItems.length) {
      setError('Delivery must contain at least one item with quantity greater than zero');
      return;
    }

    setSaving(true);
    try {
      const res = await salesService.createDelivery({ ...form, items: validItems });
      toast.success(`Delivery note ${res.deliveryNo} created successfully`);
      setDialogOpen(false);
      setPage(0);
      fetchDeliveries();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create delivery');
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
          <LocalShipping sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Deliveries & Dispatch
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Pick, pack and dispatch confirmed sales orders to customers
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openDialog} sx={{ borderRadius: 2 }}>
          New Delivery Note
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by delivery number, order number, customer, tracking id..."
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
              <TableCell><strong>Delivery #</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Order #</strong></TableCell>
              <TableCell><strong>Customer</strong></TableCell>
              <TableCell><strong>Transport</strong></TableCell>
              <TableCell align="right"><strong>Lines</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deliveries.length > 0 ? (
              deliveries.map((d) => (
                <TableRow key={d.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="700" color="primary.main">
                      {d.deliveryNo}
                    </Typography>
                  </TableCell>
                  <TableCell>{d.deliveryDate}</TableCell>
                  <TableCell>{d.orderNumber || '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">{d.customerName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{d.transporterName || '-'}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {[d.vehicleNumber, d.trackingId].filter(Boolean).join(' / ')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{(d.items || []).length}</TableCell>
                  <TableCell align="center">
                    <Chip label={d.status || 'DISPATCHED'} color={STATUS_COLORS[d.status] || 'default'} size="small" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {loading ? 'Loading deliveries...' : 'No deliveries found'}
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

      {/* New Delivery Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Create Delivery Note
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                options={orders}
                getOptionLabel={(o) => `${o.orderNumber} — ${o.customerName} (${(o.items || []).length} lines)`}
                value={orders.find((o) => o.id === form.salesOrderId) || null}
                onChange={(e, order) => applyOrder(order)}
                renderInput={(params) => (
                  <TextField {...params} label="Linked Sales Order (optional)" placeholder="Select a confirmed order..." />
                )}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Delivery Date"
                value={form.deliveryDate}
                onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="PACKED">PACKED</MenuItem>
                  <MenuItem value="DISPATCHED">DISPATCHED</MenuItem>
                  <MenuItem value="IN_TRANSIT">IN TRANSIT</MenuItem>
                  <MenuItem value="DELIVERED">DELIVERED</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Customer Name"
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Shipping Address"
                value={form.shippingAddress}
                onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Transporter"
                value={form.transporterName}
                onChange={(e) => setForm({ ...form, transporterName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Vehicle Number"
                value={form.vehicleNumber}
                onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Tracking / LR Number"
                value={form.trackingId}
                onChange={(e) => setForm({ ...form, trackingId: e.target.value })}
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle1" fontWeight="bold" mb={1}>
            Dispatch Lines
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell><strong>Item</strong></TableCell>
                  <TableCell><strong>SKU</strong></TableCell>
                  <TableCell align="right"><strong>Order Qty</strong></TableCell>
                  <TableCell align="right"><strong>Dispatch Qty</strong></TableCell>
                  <TableCell align="right"><strong>Unit Price</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {form.items.length > 0 ? (
                  form.items.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.itemName}</TableCell>
                      <TableCell>{row.itemCode || '-'}</TableCell>
                      <TableCell align="right">{row.quantity}</TableCell>
                      <TableCell align="right" width={140}>
                        <TextField
                          size="small"
                          type="number"
                          fullWidth
                          inputProps={{ min: 0 }}
                          value={row.quantity}
                          onChange={(e) => handleQuantityChange(idx, e.target.value)}
                        />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(row.unitPrice)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="textSecondary">
                        Select a sales order to load its lines, or dispatch manually with customer details above.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Dispatch Notes"
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
            Create Delivery
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeliveryList;
