import React, { useState } from 'react';
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
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Reply,
  Search,
  Save,
  Cancel,
  Receipt,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { purchaseService } from '../../services/purchaseService';
import { returnService } from '../../services/returnService';

const PurchaseReturn = () => {
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
      const data = await purchaseService.getInvoiceByInvoiceNo(invoiceNo);
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
    if (qty <= updated[index].receivedQuantity) {
      updated[index].returnQuantity = qty;
      updated[index].selected = qty > 0;
    } else {
      toast.warning('Return quantity cannot exceed received quantity');
    }
    setReturnItems(updated);
  };

  const handleSelectAll = (checked) => {
    const updated = returnItems.map(item => ({
      ...item,
      selected: checked,
      returnQuantity: checked ? item.receivedQuantity : 0,
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
        itemId: item.itemId,
        quantity: item.returnQuantity,
        unitPrice: item.unitPrice,
      })),
    };

    setSubmitting(true);
    try {
      const response = await returnService.createPurchaseReturn(requestData);
      toast.success('Purchase return created successfully!');
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

  const handleReset = () => {
    setInvoice(null);
    setReturnItems([]);
    setInvoiceNo('');
    setNotes('');
    setError('');
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Reply sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Purchase Return
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Process supplier returns
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
            fullWidth
            label="Purchase Invoice Number"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            placeholder="Enter purchase invoice number"
            disabled={loading}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleSearchInvoice}
            disabled={loading || !invoiceNo.trim()}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Search'}
          </Button>
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </Button>
        </Box>
      </Paper>

      {invoice && (
        <>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Invoice Details
                </Typography>
                <Typography variant="body1">
                  <strong>Invoice No:</strong> {invoice.invoiceNo}
                </Typography>
                <Typography variant="body1">
                  <strong>Date:</strong> {new Date(invoice.invoiceDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body1">
                  <strong>Supplier:</strong> {invoice.supplierName}
                </Typography>
                <Typography variant="body1">
                  <strong>Phone:</strong> {invoice.supplierPhone || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Invoice Summary
                </Typography>
                <Typography variant="body1">
                  <strong>Total Amount:</strong> ₹{invoice.totalAmount?.toFixed(2) || '0.00'}
                </Typography>
                <Typography variant="body1">
                  <strong>Net Amount:</strong> ₹{invoice.netAmount?.toFixed(2) || '0.00'}
                </Typography>
                <Box mt={1}>
                  <Chip
                    label={invoice.paymentType || 'N/A'}
                    color={invoice.paymentType === 'CASH' ? 'success' : 'warning'}
                    size="small"
                  />
                  {invoice.isReturned && (
                    <Chip
                      label="Returned"
                      color="error"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Items to Return
              </Typography>
              <Box>
                <Button
                  size="small"
                  onClick={() => handleSelectAll(true)}
                  sx={{ mr: 1 }}
                >
                  Select All
                </Button>
                <Button
                  size="small"
                  onClick={() => handleSelectAll(false)}
                >
                  Deselect All
                </Button>
              </Box>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={returnItems.length > 0 && returnItems.every(item => item.selected)}
                        indeterminate={
                          returnItems.some(item => item.selected) && 
                          !returnItems.every(item => item.selected)
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Received Qty</TableCell>
                    <TableCell align="right">Return Qty</TableCell>
                    <TableCell align="right">Unit Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {returnItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography color="textSecondary">
                          No items found in this invoice
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    returnItems.map((item, index) => (
                      <TableRow key={item.id || index} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={item.selected}
                            onChange={(e) => {
                              const updated = [...returnItems];
                              updated[index].selected = e.target.checked;
                              if (!e.target.checked) {
                                updated[index].returnQuantity = 0;
                              } else if (updated[index].returnQuantity === 0) {
                                updated[index].returnQuantity = updated[index].receivedQuantity;
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
                        <TableCell align="right">{item.receivedQuantity}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={item.returnQuantity}
                            onChange={(e) => handleQuantityChange(index, e.target.value)}
                            disabled={!item.selected}
                            InputProps={{
                              inputProps: { min: 0, max: item.receivedQuantity },
                            }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell align="right">₹{item.unitPrice?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell align="right">
                          ₹{(item.returnQuantity * (item.unitPrice || 0)).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Return Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  multiline
                  rows={2}
                  placeholder="Reason for return"
                />
              </Grid>
            </Grid>

            <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleReset}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSubmit}
                disabled={
                  submitting || 
                  returnItems.length === 0 || 
                  returnItems.every(item => !item.selected)
                }
              >
                {submitting ? 'Processing...' : 'Create Return'}
              </Button>
            </Box>
          </Paper>
        </>
      )}

      {!invoice && !loading && invoiceNo && (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="textSecondary">
            Enter a purchase invoice number and click "Search" to find the invoice.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default PurchaseReturn;