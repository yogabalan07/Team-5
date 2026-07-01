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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Search,
  Person,
  AttachMoney,
  Save,
  Cancel,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { accountService } from '../../services/accountService';
import { customerService } from '../../services/customerService';
import { salesService } from '../../services/salesService';
import CustomerSearch from '../customers/CustomerSearch';

const BillReceipt = () => {
  const [customer, setCustomer] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [receipt, setReceipt] = useState({
    receiptDate: new Date().toISOString().split('T')[0],
    paymentMode: 'CASH',
    referenceNo: '',
    notes: '',
    adjustAmount: 0,
  });
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCustomerSelect = async (selectedCustomer) => {
    setCustomer(selectedCustomer);
    setSelectedInvoice(null);
    try {
      const data = await salesService.getInvoicesByCustomer(selectedCustomer.id);
      const pendingInvoices = data.content?.filter(
        (inv) => inv.balanceAmount > 0
      ) || [];
      setInvoices(pendingInvoices);
    } catch (error) {
      toast.error('Failed to fetch customer invoices');
    }
  };

  const handleInvoiceSelect = (invoice) => {
    setSelectedInvoice(invoice);
    setReceipt({
      ...receipt,
      adjustAmount: invoice.balanceAmount,
    });
  };

  const handleSubmit = async () => {
    if (!customer) {
      setError('Please select a customer');
      return;
    }

    if (!selectedInvoice) {
      setError('Please select an invoice');
      return;
    }

    if (receipt.adjustAmount <= 0) {
      setError('Adjust amount must be greater than 0');
      return;
    }

    const requestData = {
      receiptDate: receipt.receiptDate,
      customerId: customer.id,
      invoiceId: selectedInvoice.id,
      totalAmount: selectedInvoice.balanceAmount,
      adjustAmount: receipt.adjustAmount,
      balanceAmount: selectedInvoice.balanceAmount - receipt.adjustAmount,
      paymentMode: receipt.paymentMode,
      referenceNo: receipt.referenceNo || '',
      notes: receipt.notes,
    };

    setLoading(true);
    try {
      const response = await accountService.createReceipt(requestData);
      toast.success('Receipt created successfully!');
      setSelectedInvoice(null);
      setCustomer(null);
      setInvoices([]);
      setReceipt({
        receiptDate: new Date().toISOString().split('T')[0],
        paymentMode: 'CASH',
        referenceNo: '',
        notes: '',
        adjustAmount: 0,
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <AttachMoney sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Bill Receipt
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Record customer payments against credit invoices
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Customer Selection
            </Typography>

            <Box display="flex" gap={2} mb={3}>
              <TextField
                fullWidth
                label="Customer"
                value={customer?.name || ''}
                placeholder="Search for customer..."
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton onClick={() => setCustomerSearchOpen(true)}>
                      <Search />
                    </IconButton>
                  ),
                }}
              />
              {customer && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setCustomer(null);
                    setInvoices([]);
                    setSelectedInvoice(null);
                  }}
                >
                  Clear
                </Button>
              )}
            </Box>

            {customer && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Pending Invoices
                </Typography>

                {invoices.length === 0 ? (
                  <Alert severity="info">
                    No pending invoices for this customer.
                  </Alert>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                          <TableCell>Invoice No</TableCell>
                          <TableCell align="right">Date</TableCell>
                          <TableCell align="right">Total</TableCell>
                          <TableCell align="right">Balance</TableCell>
                          <TableCell align="right">Days</TableCell>
                          <TableCell align="center">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoices.map((inv) => (
                          <TableRow
                            key={inv.id}
                            hover
                            selected={selectedInvoice?.id === inv.id}
                            onClick={() => handleInvoiceSelect(inv)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell>{inv.invoiceNo}</TableCell>
                            <TableCell align="right">
                              {new Date(inv.invoiceDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell align="right">
                              ₹{inv.netAmount.toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              <Typography color="warning.main" fontWeight={500}>
                                ₹{inv.balanceAmount.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              {Math.ceil(
                                (new Date() - new Date(inv.invoiceDate)) /
                                (1000 * 60 * 60 * 24)
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label="Select"
                                color={selectedInvoice?.id === inv.id ? 'primary' : 'default'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 2, position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Receipt Details
              </Typography>

              {selectedInvoice ? (
                <Box>
                  <Box
                    sx={{
                      bgcolor: '#f5f7fa',
                      p: 2,
                      borderRadius: 1,
                      mb: 2,
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Selected Invoice
                    </Typography>
                    <Typography variant="body2">
                      <strong>Invoice:</strong> {selectedInvoice.invoiceNo}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Customer:</strong> {customer?.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Balance:</strong> ₹{selectedInvoice.balanceAmount.toFixed(2)}
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Receipt Date"
                        type="date"
                        value={receipt.receiptDate}
                        onChange={(e) =>
                          setReceipt({ ...receipt, receiptDate: e.target.value })
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Payment Mode</InputLabel>
                        <Select
                          value={receipt.paymentMode}
                          onChange={(e) =>
                            setReceipt({ ...receipt, paymentMode: e.target.value })
                          }
                          label="Payment Mode"
                        >
                          <MenuItem value="CASH">Cash</MenuItem>
                          <MenuItem value="BANK">Bank Transfer</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    {receipt.paymentMode === 'BANK' && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Reference Number"
                          value={receipt.referenceNo}
                          onChange={(e) =>
                            setReceipt({ ...receipt, referenceNo: e.target.value })
                          }
                          placeholder="Enter bank reference number"
                        />
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Amount to Adjust"
                        type="number"
                        value={receipt.adjustAmount}
                        onChange={(e) =>
                          setReceipt({
                            ...receipt,
                            adjustAmount: parseFloat(e.target.value) || 0,
                          })
                        }
                        InputProps={{ endAdornment: '₹' }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Notes"
                        multiline
                        rows={2}
                        value={receipt.notes}
                        onChange={(e) =>
                          setReceipt({ ...receipt, notes: e.target.value })
                        }
                      />
                    </Grid>
                  </Grid>

                  <Box mt={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<Save />}
                      onClick={handleSubmit}
                      disabled={loading || !selectedInvoice}
                    >
                      {loading ? 'Processing...' : 'Create Receipt'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box textAlign="center" py={4}>
                  <ReceiptIcon sx={{ fontSize: 60, color: '#ccc' }} />
                  <Typography color="textSecondary">
                    Please select a customer and invoice
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <CustomerSearch
        open={customerSearchOpen}
        onClose={() => setCustomerSearchOpen(false)}
        onSelect={handleCustomerSelect}
      />
    </Box>
  );
};

export default BillReceipt;