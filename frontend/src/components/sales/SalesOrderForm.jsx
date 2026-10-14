import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Save,
  Cancel,
  Add,
  Delete,
  ShoppingCart,
  CheckCircle,
  Warning,
  LocalShipping,
  Receipt,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { salesService } from '../../services/salesService';
import { customerService } from '../../services/customerService';
import { itemService } from '../../services/itemService';
import { invoiceTotals, round2, todayISO } from '../../services/businessLogic';

const SalesOrderForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    orderDate: todayISO(),
    expectedDeliveryDate: '',
    quotationId: '',
    quotationNumber: '',
    customerId: '',
    customerName: '',
    customerPhone: '',
    shippingAddress: '',
    billingAddress: '',
    salespersonName: '',
    paymentTerms: '30 Days Net',
    freightCharges: 0,
    status: 'CONFIRMED',
    notes: '',
  });

  const [items, setItems] = useState([
    { itemId: '', itemName: '', itemCode: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0, totalAmount: 0 },
  ]);

  const [stockCheck, setStockCheck] = useState({ allAvailable: true, items: [] });
  const [checkingStock, setCheckingStock] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMasters();
    const params = new URLSearchParams(location.search);
    const quotationId = params.get('quotationId');
    if (quotationId) {
      loadFromQuotation(quotationId);
    } else if (isEdit) {
      fetchOrder();
    }
  }, [id, location.search, isEdit]);

  const fetchMasters = async () => {
    try {
      const [custs, prods] = await Promise.all([
        customerService.getAll(0, 500).catch(() => ({ content: [] })),
        itemService.getAll(0, 1000).catch(() => ({ content: [] })),
      ]);
      setCustomers((custs && custs.content) || []);
      setCatalogItems((prods && prods.content) || []);
    } catch (e) {
      console.error('Failed to load masters:', e);
    }
  };

  const loadFromQuotation = async (qtnId) => {
    try {
      setLoading(true);
      const qtn = await salesService.getQuotationById(qtnId);
      setFormData({
        orderDate: todayISO(),
        expectedDeliveryDate: qtn.validUntil || '',
        quotationId: qtn.id,
        quotationNumber: qtn.quotationNumber,
        customerId: qtn.customerId || '',
        customerName: qtn.customerName || '',
        customerPhone: qtn.customerPhone || '',
        shippingAddress: qtn.customerAddress || '',
        billingAddress: qtn.customerAddress || '',
        salespersonName: qtn.salespersonName || '',
        paymentTerms: '30 Days Net',
        freightCharges: qtn.freightCharges || 0,
        status: 'CONFIRMED',
        notes: `Converted from Quotation #${qtn.quotationNumber}`,
      });
      setItems(qtn.items || []);
      toast.info(`Prefilled from Quotation #${qtn.quotationNumber}`);
      verifyStock(qtn.items || []);
    } catch (err) {
      toast.error('Failed to load quotation details');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await salesService.getOrderById(id);
      setFormData({
        orderDate: data.orderDate || todayISO(),
        expectedDeliveryDate: data.expectedDeliveryDate || '',
        quotationId: data.quotationId || '',
        quotationNumber: data.quotationNumber || '',
        customerId: data.customerId || '',
        customerName: data.customerName || '',
        customerPhone: data.customerPhone || '',
        shippingAddress: data.shippingAddress || '',
        billingAddress: data.billingAddress || '',
        salespersonName: data.salespersonName || '',
        paymentTerms: data.paymentTerms || '30 Days Net',
        freightCharges: data.freightCharges || 0,
        status: data.status || 'CONFIRMED',
        notes: data.notes || '',
      });
      setItems(data.items || []);
      verifyStock(data.items || []);
    } catch (err) {
      toast.error('Failed to load order');
      navigate('/sales/orders');
    } finally {
      setLoading(false);
    }
  };

  const verifyStock = async (linesToVerify) => {
    setCheckingStock(true);
    try {
      const result = await salesService.checkStockAvailability(linesToVerify || items);
      setStockCheck(result);
    } catch (e) {
      console.error('Stock verification error:', e);
    } finally {
      setCheckingStock(false);
    }
  };

  const handleCustomerSelect = (e, customer) => {
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone || '',
        shippingAddress: customer.shippingAddress || customer.address || '',
        billingAddress: customer.billingAddress || customer.address || '',
        paymentTerms: `${customer.creditDays || 30} Days Net`,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerPhone: '',
        shippingAddress: '',
        billingAddress: '',
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const next = [...items];
    next[index][field] = value;

    if (field === 'itemId') {
      const selected = catalogItems.find((p) => p.id === value);
      if (selected) {
        next[index].itemName = selected.name;
        next[index].itemCode = selected.itemCode || selected.sku || '';
        next[index].unitPrice = selected.sellingPrice || 0;
        next[index].taxPercent = selected.gstRate || selected.taxRate || 0;
      }
    }

    const qty = Number(next[index].quantity) || 0;
    const price = Number(next[index].unitPrice) || 0;
    const disc = Number(next[index].discountPercent) || 0;
    const tax = Number(next[index].taxPercent) || 0;

    const base = qty * price;
    const discAmt = (base * disc) / 100;
    const taxAmt = ((base - discAmt) * tax) / 100;
    next[index].totalAmount = round2(base - discAmt + taxAmt);
    next[index].discountAmount = round2(discAmt);
    next[index].taxAmount = round2(taxAmt);

    setItems(next);
    verifyStock(next);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { itemId: '', itemName: '', itemCode: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0, totalAmount: 0 },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    verifyStock(next);
  };

  const totals = invoiceTotals(items);
  const grandTotal = round2(totals.netAmount + (Number(formData.freightCharges) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.customerName) {
      setError('Customer is required');
      return;
    }

    const validLines = items.filter((i) => i.itemName && Number(i.quantity) > 0);
    if (!validLines.length) {
      setError('Please add at least one line item');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        items: validLines,
      };

      if (isEdit) {
        await salesService.updateOrder(id, payload);
        toast.success('Sales order updated successfully');
      } else {
        const res = await salesService.createOrder(payload);
        toast.success(`Sales Order #${res.orderNumber} confirmed successfully!`);
      }
      navigate('/sales/orders');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save sales order');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amt || 0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <ShoppingCart sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {isEdit ? 'Edit Sales Order' : 'New Sales Order'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Confirm customer order, verify on-hand inventory availability, and trigger fulfillment
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Cancel />} onClick={() => navigate('/sales/orders')}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {isEdit ? 'Update Order' : 'Confirm Order'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stock Availability Alert Banner */}
      {!stockCheck.allAvailable && stockCheck.items.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<Warning />}>
          <Typography variant="subtitle2" fontWeight="bold">
            Stock Warning: One or more ordered items have insufficient warehouse stock!
          </Typography>
          <Box mt={0.5}>
            {stockCheck.items.filter((i) => !i.isAvailable).map((i) => (
              <Typography key={i.itemId} variant="caption" display="block">
                • <strong>{i.itemName}</strong>: Available {i.currentStock}, Ordered {i.requestedQuantity} (Shortage: {i.shortage})
              </Typography>
            ))}
          </Box>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Order Details & Customer
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Order Date"
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Expected Delivery Date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Order Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Order Status"
                >
                  <MenuItem value="DRAFT">DRAFT</MenuItem>
                  <MenuItem value="CONFIRMED">CONFIRMED</MenuItem>
                  <MenuItem value="PROCESSING">PROCESSING</MenuItem>
                  <MenuItem value="DISPATCHED">DISPATCHED</MenuItem>
                  <MenuItem value="DELIVERED">DELIVERED</MenuItem>
                  <MenuItem value="INVOICED">INVOICED</MenuItem>
                  <MenuItem value="CANCELLED">CANCELLED</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Assigned Salesperson"
                value={formData.salespersonName}
                onChange={(e) => setFormData({ ...formData, salespersonName: e.target.value })}
                placeholder="Sales agent name"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              <Autocomplete
                options={customers}
                getOptionLabel={(opt) => `${opt.name} (${opt.phone || opt.city || 'No phone'})`}
                value={customers.find((c) => c.id === formData.customerId) || null}
                onChange={handleCustomerSelect}
                renderInput={(params) => <TextField {...params} label="Select Customer Account" required />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Customer Phone"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Payment Terms"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Shipping / Delivery Address"
                value={formData.shippingAddress}
                onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Billing Address"
                value={formData.billingAddress}
                onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Line Items Table */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" fontWeight="600">
                Order Items
              </Typography>
              {checkingStock && <CircularProgress size={16} />}
            </Box>
            <Button variant="outlined" startIcon={<Add />} onClick={addItemRow}>
              Add Product Line
            </Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell width="32%"><strong>Product</strong></TableCell>
                  <TableCell width="12%"><strong>Availability</strong></TableCell>
                  <TableCell width="10%"><strong>Qty</strong></TableCell>
                  <TableCell width="14%"><strong>Unit Price (₹)</strong></TableCell>
                  <TableCell width="10%"><strong>Disc (%)</strong></TableCell>
                  <TableCell width="10%"><strong>Tax (%)</strong></TableCell>
                  <TableCell width="14%" align="right"><strong>Line Total (₹)</strong></TableCell>
                  <TableCell width="4%" align="center"><strong>Del</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((row, idx) => {
                  const check = stockCheck.items.find((c) => c.itemId === row.itemId);
                  const isAvailable = check ? check.isAvailable : true;
                  const availableQty = check ? check.currentStock : '-';

                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        <FormControl fullWidth size="small">
                          <Select
                            value={row.itemId}
                            onChange={(e) => handleItemChange(idx, 'itemId', e.target.value)}
                            displayEmpty
                          >
                            <MenuItem value=""><em>Select a Product...</em></MenuItem>
                            {catalogItems.map((p) => (
                              <MenuItem key={p.id} value={p.id}>
                                {p.name} ({p.itemCode || p.sku}) - Stock: {p.currentStock || 0}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        {row.itemId ? (
                          <Chip
                            size="small"
                            label={isAvailable ? `In Stock (${availableQty})` : `Short (${availableQty})`}
                            color={isAvailable ? 'success' : 'error'}
                            variant="outlined"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 1 }}
                          value={row.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0, step: '0.01' }}
                          value={row.unitPrice}
                          onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0, max: 100 }}
                          value={row.discountPercent}
                          onChange={(e) => handleItemChange(idx, 'discountPercent', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          inputProps={{ min: 0, max: 100 }}
                          value={row.taxPercent}
                          onChange={(e) => handleItemChange(idx, 'taxPercent', e.target.value)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="700">
                          {formatCurrency(row.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => removeItemRow(idx)} disabled={items.length <= 1}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 3 }} />

          {/* Totals Summary */}
          <Grid container spacing={3} justifyContent="flex-end">
            <Grid item xs={12} md={5}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Items Subtotal:</Typography>
                <Typography variant="body2" fontWeight="600">{formatCurrency(totals.totalAmount)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="error.main">Discount Total:</Typography>
                <Typography variant="body2" color="error.main">-{formatCurrency(totals.discountAmount)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">GST / Tax Amount:</Typography>
                <Typography variant="body2" fontWeight="600">+{formatCurrency(totals.taxAmount)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">Freight / Shipping:</Typography>
                <TextField
                  size="small"
                  type="number"
                  sx={{ width: 140 }}
                  value={formData.freightCharges}
                  onChange={(e) => setFormData({ ...formData, freightCharges: e.target.value })}
                />
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6" fontWeight="bold">Grand Total Amount:</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">{formatCurrency(grandTotal)}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Order Remarks & Instructions
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Special delivery instructions, packaging requirements, client reference..."
          />
        </Paper>
      </form>
    </Box>
  );
};

export default SalesOrderForm;
