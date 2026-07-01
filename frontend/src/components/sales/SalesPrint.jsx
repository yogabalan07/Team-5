import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Print, ArrowBack } from '@mui/icons-material';
import { salesService } from '../../services/salesService';

const SalesPrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchInvoiceData(id);
    } else {
      // Check if we have data from window (fallback)
      const printData = window.printSaleData;
      if (printData) {
        setInvoice(printData);
        setLoading(false);
        setTimeout(() => window.print(), 500);
      } else {
        setError('No invoice ID provided');
        setLoading(false);
      }
    }
  }, [id]);

  const fetchInvoiceData = async (invoiceId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      const response = await salesService.getInvoiceById(invoiceId);
      setInvoice(response);
      setLoading(false);
      
      // Auto print after data loads
      setTimeout(() => {
        window.print();
      }, 800);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError('Failed to load invoice data');
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate('/sales/list');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" flexDirection="column">
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading invoice...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
        <Button 
          variant="contained" 
          onClick={handleBack} 
          sx={{ mt: 2 }}
          startIcon={<ArrowBack />}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box p={3}>
        <Alert severity="warning">No invoice data found</Alert>
        <Button 
          variant="contained" 
          onClick={handleBack} 
          sx={{ mt: 2 }}
          startIcon={<ArrowBack />}
        >
          Go Back
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Print Controls - Hidden when printing */}
      <Box 
        sx={{ 
          p: 2, 
          bgcolor: '#f5f7fa', 
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          '@media print': {
            display: 'none'
          }
        }}
      >
        <Button 
          variant="outlined" 
          startIcon={<ArrowBack />}
          onClick={handleBack}
        >
          Back
        </Button>
        <Typography variant="h6">
          Invoice Preview
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Print />}
          onClick={handlePrint}
        >
          Print Invoice
        </Button>
      </Box>

      {/* Invoice Content */}
      <Box sx={{ p: 4, maxWidth: '1000px', margin: '0 auto' }} id="invoice-content">
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={3}>
            <Box>
              <Typography variant="h4" fontWeight="bold" color="primary">
                📦 Inventory Pro
              </Typography>
              <Typography variant="body2" color="textSecondary">
                123 Business Street, City - 400001
              </Typography>
              <Typography variant="body2" color="textSecondary">
                GST: GST123456789
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Phone: +91 9876543210
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Email: info@inventorypro.com
              </Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="h5" fontWeight="bold" color="primary">
                TAX INVOICE
              </Typography>
              <Typography variant="h6" fontWeight={500}>
                {invoice.invoiceNo}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Date: {new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Payment: {invoice.paymentType}
              </Typography>
              {invoice.referenceNo && (
                <Typography variant="body2" color="textSecondary">
                  Ref: {invoice.referenceNo}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Customer Details */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Bill To:
              </Typography>
              <Typography variant="h6" fontWeight={500}>
                {invoice.customerName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Phone: {invoice.customerPhone || 'N/A'}
              </Typography>
              {invoice.customerEmail && (
                <Typography variant="body2" color="textSecondary">
                  Email: {invoice.customerEmail}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Invoice Details:
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {invoice.isReturned ? 'Returned' : 'Active'}
              </Typography>
              <Typography variant="body2">
                <strong>Payment Type:</strong> {invoice.paymentType}
              </Typography>
              <Typography variant="body2">
                <strong>Total Items:</strong> {invoice.items?.length || 0}
              </Typography>
            </Grid>
          </Grid>

          {/* Items Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                  <TableCell>#</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Discount</TableCell>
                  <TableCell align="right">Tax</TableCell>
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {item.itemName}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.itemCode}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">₹{item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">{item.discountPercent}%</TableCell>
                      <TableCell align="right">{item.taxPercent}%</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={500}>
                          ₹{item.totalAmount.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      No items found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 2 }} />

          {/* Summary */}
          <Box display="flex" justifyContent="flex-end">
            <Box sx={{ width: 350 }}>
              <Box display="flex" justifyContent="space-between" py={0.5}>
                <Typography color="textSecondary">Subtotal</Typography>
                <Typography>₹{invoice.totalAmount?.toFixed(2) || '0.00'}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" py={0.5}>
                <Typography color="textSecondary">Discount</Typography>
                <Typography color="success.main">
                  -₹{invoice.discountAmount?.toFixed(2) || '0.00'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" py={0.5}>
                <Typography color="textSecondary">Tax</Typography>
                <Typography>+₹{invoice.taxAmount?.toFixed(2) || '0.00'}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between" py={0.5}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" color="primary">
                  ₹{invoice.netAmount?.toFixed(2) || '0.00'}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" py={0.5}>
                <Typography color="textSecondary">Paid</Typography>
                <Typography>₹{invoice.paidAmount?.toFixed(2) || '0.00'}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" py={0.5}>
                <Typography color="textSecondary">Balance</Typography>
                <Typography 
                  fontWeight={500} 
                  color={invoice.balanceAmount > 0 ? 'warning.main' : 'success.main'}
                >
                  ₹{invoice.balanceAmount?.toFixed(2) || '0.00'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {invoice.notes && (
            <Box mt={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Notes:
              </Typography>
              <Typography variant="body2">{invoice.notes}</Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Footer */}
          <Box textAlign="center">
            <Typography variant="caption" color="textSecondary">
              Thank you for your business!
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block">
              This is a computer-generated invoice. No signature required.
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block" mt={1}>
              For queries, contact support@inventorypro.com
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default SalesPrint;