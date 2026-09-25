import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
} from '@mui/material';
import { Save, Cancel, Add, Delete, RequestQuote, Send } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { salesService } from '../../services/salesService';
import { customerService } from '../../services/customerService';
import { itemService } from '../../services/itemService';
import { invoiceTotals, round2, todayISO } from '../../services/businessLogic';

const SalesQuotationForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    quotationDate: todayISO(),
    validUntil: '',
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    salespersonName: '',
    notes: 'Price valid for 15 days. Payment terms: 100% advance or 30 days credit as agreed.',
    freightCharges: 0,
    status: 'DRAFT',
  });

  const [items, setItems] = useState([
    { itemId: '', itemName: '', itemCode: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0, totalAmount: 0 },
  ]);

  const [customers, setCustomers] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMasters();
    if (isEdit) {
      fetchQuotation();
    }
  }, [id, isEdit]);

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

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const data = await salesService.getQuotationById(id);
      setFormData({
        quotationDate: data.quotationDate || todayISO(),
        validUntil: data.validUntil || '',
        customerId: data.customerId || '',
        customerName: data.customerName || '',
        customerPhone: data.customerPhone || '',
        customerAddress: data.customerAddress || '',
        salespersonName: data.salespersonName || '',
        notes: data.notes || '',
        freightCharges: data.freightCharges || 0,
        status: data.status || 'DRAFT',
      });
      setItems(data.items || []);
    } catch (err) {
      toast.error('Failed to load quotation');
      navigate('/sales/quotations');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (e, customer) => {
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone || '',
        customerAddress: customer.billingAddress || customer.address || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerPhone: '',
        customerAddress: '',
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
  };

  const addItemRow = () => {
    setItems([
      ...items,
      { itemId: '', itemName: '', itemCode: '', quantity: 1, unitPrice: 0, discountPercent: 0, taxPercent: 0, totalAmount: 0 },
    ]);
  };

  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totals = invoiceTotals(items);
  const grandTotal = round2(totals.netAmount + (Number(formData.freightCharges) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.customerName) {
      setError('Customer name is required');
      return;
    }

    const validLines = items.filter((i) => i.itemName && Number(i.quantity) > 0);
    if (!validLines.length) {
      setError('Please add at least one valid line item');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        items: validLines,
      };

      if (isEdit) {
        await salesService.updateQuotation(id, payload);
        toast.success('Quotation updated successfully');
      } else {
        const res = await salesService.createQuotation(payload);
        toast.success(`Quotation #${res.quotationNumber} created successfully`);
      }
      navigate('/sales/quotations');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to save quotation');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amt || 0);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <RequestQuote sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {isEdit ? 'Edit Sales Quotation' : 'Create Sales Quotation'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Prepare a commercial price estimate and quote for customer review
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Cancel />} onClick={() => navigate('/sales/quotations')}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {isEdit ? 'Update Quotation' : 'Save Quotation'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Quotation Header & Customer
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Quotation Date"
                value={formData.quotationDate}
                onChange={(e) => setFormData({ ...formData, quotationDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Valid Until Date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Quotation Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  label="Quotation Status"
                >
                  <MenuItem value="DRAFT">DRAFT</MenuItem>
                  <MenuItem value="SENT">SENT TO CLIENT</MenuItem>
                  <MenuItem value="ACCEPTED">ACCEPTED</MenuItem>
                  <MenuItem value="REJECTED">REJECTED</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Assigned Salesperson"
                value={formData.salespersonName}
                onChange={(e) => setFormData({ ...formData, salespersonName: e.target.value })}
                placeholder="e.g. Rahul Sharma"
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
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                fullWidth
                label="Customer Contact Phone"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Customer Address / Destination"
                value={formData.customerAddress}
                onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Quotation Line Items */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="600">
              Quotation Line Items
            </Typography>
            <Button variant="outlined" startIcon={<Add />} onClick={addItemRow}>
              Add Product Line
            </Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell width="35%"><strong>Product / Item</strong></TableCell>
                  <TableCell width="12%"><strong>Qty</strong></TableCell>
                  <TableCell width="15%"><strong>Unit Price (₹)</strong></TableCell>
                  <TableCell width="10%"><strong>Disc (%)</strong></TableCell>
                  <TableCell width="10%"><strong>Tax (%)</strong></TableCell>
                  <TableCell width="15%" align="right"><strong>Line Total (₹)</strong></TableCell>
                  <TableCell width="5%" align="center"><strong>Del</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((row, idx) => (
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
                              {p.name} ({p.itemCode || p.sku}) - {formatCurrency(p.sellingPrice)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
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
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 3 }} />

          {/* Totals Summary */}
          <Grid container spacing={3} justifyContent="flex-end">
            <Grid item xs={12} md={5}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Subtotal Amount:</Typography>
                <Typography variant="body2" fontWeight="600">{formatCurrency(totals.totalAmount)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2" color="error.main">Total Discount:</Typography>
                <Typography variant="body2" color="error.main">-{formatCurrency(totals.discountAmount)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Tax / GST Total:</Typography>
                <Typography variant="body2" fontWeight="600">+{formatCurrency(totals.taxAmount)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">Freight / Shipping Charges:</Typography>
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
                <Typography variant="h6" fontWeight="bold">Net Quotation Total:</Typography>
                <Typography variant="h6" fontWeight="bold" color="primary.main">{formatCurrency(grandTotal)}</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Notes & Terms */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Terms & Commercial Conditions
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Payment terms, delivery schedules, price validity..."
          />
        </Paper>
      </form>
    </Box>
  );
};

export default SalesQuotationForm;
