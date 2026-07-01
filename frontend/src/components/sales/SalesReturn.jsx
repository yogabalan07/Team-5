import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Checkbox,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Reply,  // Use Reply instead of ReturnIcon
  Search,
  Save,
  Cancel,
  Receipt,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { salesService } from '../../services/salesService';
import { returnService } from '../../services/returnService';

const SalesReturn = () => {
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [returnItems, setReturnItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSearchInvoice = async () => {
    if (!invoiceNo.trim()) {
      setError('Please enter an invoice number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await salesService.getInvoiceByNo(invoiceNo);
      setInvoice(data);
      setReturnItems(data.items.map(item => ({
        ...item,
        returnQuantity: 0,
        selected: false,
      })));
    } catch (error) {
      setError('Invoice not found or invalid');
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (index, value) => {
    const updated = [...returnItems];
    const qty = parseFloat(value) || 0;
    if (qty <= updated[index].quantity) {
      updated[index].returnQuantity = qty;
      updated[index].selected = qty > 0;
    } else {
      toast.warning('Return quantity cannot exceed original quantity');
    }
    setReturnItems(updated);
  };

  const handleSelectAll = (checked) => {
    const updated = returnItems.map(item => ({
      ...item,
      selected: checked,
      returnQuantity: checked ? item.quantity : 0,
    }));
    setReturnItems(updated);
  };

  const handleSubmit = async () => {
    const selectedItems = returnItems.filter(item => item.selected && item.returnQuantity > 0);
    
    if (selectedItems.length === 0) {
      setError('Please select at least one item to return');
      return;
    }

    const requestData = {
      invoiceNo: invoiceNo,
      returnDate: new Date().toISOString().split('T')[0],
      notes: notes,
      items: selectedItems.map(item => ({
        invoiceItemId: item.id,
        quantity: item.returnQuantity,
      })),
    };

    setSubmitting(true);
    try {
      const response = await returnService.createSalesReturn(requestData);
      toast.success('Sales return created successfully!');
      setInvoice(null);
      setReturnItems([]);
      setInvoiceNo('');
      setNotes('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create return');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Reply sx={{ fontSize: 40, color: '#1976d2' }} />  {/* Changed from Return to Reply */}
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Sales Return
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Process customer returns
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            label="Invoice Number"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            placeholder="Enter invoice number"
            sx={{ flexGrow: 1 }}
            disabled={loading}
          />
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleSearchInvoice}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Search'}
          </Button>
        </Box>
      </Paper>

      {invoice && (
        <>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Invoice Details
                </Typography>
                <Typography variant="body1">
                  <strong>Invoice No:</strong> {invoice.invoiceNo}
                </Typography>
                <Typography variant="body1">
                  <strong>Date:</strong> {new Date(invoice.invoiceDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body1">
                  <strong>Customer:</strong> {invoice.customerName}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Invoice Summary
                </Typography>
                <Typography variant="body1">
                  <strong>Total Amount:</strong> ₹{invoice.totalAmount.toFixed(2)}
                </Typography>
                <Typography variant="body1">
                  <strong>Net Amount:</strong> ₹{invoice.netAmount.toFixed(2)}
                </Typography>
                <Chip
                  label={invoice.paymentType}
                  color={invoice.paymentType === 'CASH' ? 'success' : 'warning'}
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Items to Return
              </Typography>
              <Button
                size="small"
                onClick={() => handleSelectAll(true)}
              >
                Select All
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={returnItems.every(item => item.selected)}
                        indeterminate={returnItems.some(item => item.selected) && !returnItems.every(item => item.selected)}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Original Qty</TableCell>
                    <TableCell align="right">Return Qty</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {returnItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={item.selected}
                          onChange={(e) => {
                            const updated = [...returnItems];
                            updated[index].selected = e.target.checked;
                            if (!e.target.checked) {
                              updated[index].returnQuantity = 0;
                            } else if (updated[index].returnQuantity === 0) {
                              updated[index].returnQuantity = updated[index].quantity;
                            }
                            setReturnItems(updated);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {item.itemName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Code: {item.itemCode}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          value={item.returnQuantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          disabled={!item.selected}
                          InputProps={{
                            inputProps: { min: 0, max: item.quantity },
                          }}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell align="right">₹{item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        ₹{(item.returnQuantity * item.unitPrice).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 3 }} />

            <Box display="flex" gap={2}>
              <TextField
                label="Return Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={2}
                sx={{ flexGrow: 1 }}
                placeholder="Reason for return"
              />
            </Box>

            <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={() => {
                  setInvoice(null);
                  setReturnItems([]);
                  setInvoiceNo('');
                  setNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSubmit}
                disabled={submitting || returnItems.every(item => !item.selected)}
              >
                {submitting ? 'Processing...' : 'Create Return'}
              </Button>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default SalesReturn;