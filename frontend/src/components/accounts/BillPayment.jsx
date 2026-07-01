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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Search,
  Business,
  AttachMoney,
  Save,
  Cancel,
  Print,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { accountService } from '../../services/accountService';
import { supplierService } from '../../services/supplierService';
import { purchaseService } from '../../services/purchaseService';
import SupplierSearch from '../suppliers/SupplierSearch';

const BillPayment = () => {
  const [supplier, setSupplier] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payment, setPayment] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'CASH',
    referenceNo: '',
    notes: '',
    adjustAmount: 0,
  });
  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [createdPayment, setCreatedPayment] = useState(null);

  const handleSupplierSelect = async (selectedSupplier) => {
    setSupplier(selectedSupplier);
    setSelectedInvoice(null);
    try {
      const data = await purchaseService.getInvoicesBySupplier(selectedSupplier.id);
      const pendingInvoices = data.content?.filter(
        (inv) => inv.balanceAmount > 0
      ) || [];
      setInvoices(pendingInvoices);
    } catch (error) {
      toast.error('Failed to fetch supplier invoices');
    }
  };

  const handleInvoiceSelect = (invoice) => {
    setSelectedInvoice(invoice);
    setPayment({
      ...payment,
      adjustAmount: invoice.balanceAmount,
    });
  };

  const handleSubmit = async () => {
    if (!supplier) {
      setError('Please select a supplier');
      return;
    }

    if (!selectedInvoice) {
      setError('Please select an invoice');
      return;
    }

    if (payment.adjustAmount <= 0) {
      setError('Adjust amount must be greater than 0');
      return;
    }

    const requestData = {
      paymentDate: payment.paymentDate,
      supplierId: supplier.id,
      invoiceId: selectedInvoice.id,
      totalAmount: selectedInvoice.balanceAmount,
      adjustAmount: payment.adjustAmount,
      balanceAmount: selectedInvoice.balanceAmount - payment.adjustAmount,
      paymentMode: payment.paymentMode,
      referenceNo: payment.referenceNo || '',
      notes: payment.notes,
    };

    setLoading(true);
    try {
      const response = await accountService.createPayment(requestData);
      setCreatedPayment(response);
      setReceiptDialogOpen(true);
      toast.success('Payment created successfully!');
      setSelectedInvoice(null);
      setSupplier(null);
      setInvoices([]);
      setPayment({
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'CASH',
        referenceNo: '',
        notes: '',
        adjustAmount: 0,
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <AttachMoney sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Bill Payment
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Record supplier payments against purchase invoices
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
              Supplier Selection
            </Typography>

            <Box display="flex" gap={2} mb={3}>
              <TextField
                fullWidth
                label="Supplier"
                value={supplier?.name || ''}
                placeholder="Search for supplier..."
                InputProps={{
                  readOnly: true,
                  endAdornment: (
                    <IconButton onClick={() => setSupplierSearchOpen(true)}>
                      <Search />
                    </IconButton>
                  ),
                }}
              />
              {supplier && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setSupplier(null);
                    setInvoices([]);
                    setSelectedInvoice(null);
                  }}
                >
                  Clear
                </Button>
              )}
            </Box>

            {supplier && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Pending Invoices
                </Typography>

                {invoices.length === 0 ? (
                  <Alert severity="info">
                    No pending invoices for this supplier.
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
                Payment Details
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
                      <strong>Supplier:</strong> {supplier?.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Balance:</strong> ₹{selectedInvoice.balanceAmount.toFixed(2)}
                    </Typography>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Payment Date"
                        type="date"
                        value={payment.paymentDate}
                        onChange={(e) =>
                          setPayment({ ...payment, paymentDate: e.target.value })
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Payment Mode</InputLabel>
                        <Select
                          value={payment.paymentMode}
                          onChange={(e) =>
                            setPayment({ ...payment, paymentMode: e.target.value })
                          }
                          label="Payment Mode"
                        >
                          <MenuItem value="CASH">Cash</MenuItem>
                          <MenuItem value="BANK">Bank Transfer</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    {payment.paymentMode === 'BANK' && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Reference Number"
                          value={payment.referenceNo}
                          onChange={(e) =>
                            setPayment({ ...payment, referenceNo: e.target.value })
                          }
                          placeholder="Enter bank reference number"
                        />
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Amount to Pay"
                        type="number"
                        value={payment.adjustAmount}
                        onChange={(e) =>
                          setPayment({
                            ...payment,
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
                        value={payment.notes}
                        onChange={(e) =>
                          setPayment({ ...payment, notes: e.target.value })
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
                      {loading ? 'Processing...' : 'Create Payment'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box textAlign="center" py={4}>
                  <PaymentIcon sx={{ fontSize: 60, color: '#ccc' }} />
                  <Typography color="textSecondary">
                    Please select a supplier and invoice
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onClose={() => setReceiptDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PaymentIcon color="success" />
            <Typography variant="h6">Payment Confirmed</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {createdPayment && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Payment has been recorded successfully!
              </Alert>
              <Box sx={{ bgcolor: '#f5f7fa', p: 2, borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Payment No:</strong> {createdPayment.paymentNo}
                </Typography>
                <Typography variant="body2">
                  <strong>Supplier:</strong> {createdPayment.supplierName}
                </Typography>
                <Typography variant="body2">
                  <strong>Amount:</strong> ₹{createdPayment.adjustAmount?.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {new Date(createdPayment.paymentDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Mode:</strong> {createdPayment.paymentMode}
                </Typography>
                {createdPayment.referenceNo && (
                  <Typography variant="body2">
                    <strong>Reference:</strong> {createdPayment.referenceNo}
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<Print />} onClick={handlePrint}>
            Print
          </Button>
        </DialogActions>
      </Dialog>

      <SupplierSearch
        open={supplierSearchOpen}
        onClose={() => setSupplierSearchOpen(false)}
        onSelect={handleSupplierSelect}
      />
    </Box>
  );
};

export default BillPayment;