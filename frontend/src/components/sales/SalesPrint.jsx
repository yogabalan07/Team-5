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
  Chip,
} from '@mui/material';
import { Print, ArrowBack, Receipt, CheckCircle, Cancel } from '@mui/icons-material';
import { salesService } from '../../services/salesService';

const SalesPrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [printTriggered, setPrintTriggered] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInvoiceData(id);
    } else {
      // Check if we have data from window (fallback for print from list)
      const printData = window.printSaleData;
      if (printData) {
        setInvoice(printData);
        setLoading(false);
        setTimeout(() => {
          window.print();
          setPrintTriggered(true);
        }, 500);
      } else {
        setError('No invoice ID provided');
        setLoading(false);
      }
    }
  }, [id]);

  const fetchInvoiceData = async (invoiceId) => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login first');
        setLoading(false);
        return;
      }

      console.log('📄 Fetching invoice with ID:', invoiceId);
      const response = await salesService.getInvoiceById(invoiceId);
      
      if (!response) {
        setError('Invoice not found');
        setLoading(false);
        return;
      }
      
      setInvoice(response);
      setLoading(false);
      
      // Auto print after data loads (only once)
      if (!printTriggered) {
        setTimeout(() => {
          window.print();
          setPrintTriggered(true);
        }, 800);
      }
    } catch (error) {
      console.error('❌ Error fetching invoice:', error);
      
      // Handle 404 specifically
      if (error.response?.status === 404) {
        setError(`Invoice with ID ${invoiceId} not found. It may have been deleted.`);
      } else if (error.response?.status === 500) {
        setError('Server error loading invoice. Please try again later.');
      } else {
        setError('Failed to load invoice data. Please try again.');
      }
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate('/sales/list');
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" flexDirection="column">
        <CircularProgress size={60} />
        <Typography sx={{ mt: 3, color: '#666' }}>Loading invoice...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3} maxWidth="600px" mx="auto">
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleBack}>
              Go Back
            </Button>
          }
        >
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={handleBack} 
          startIcon={<ArrowBack />}
          fullWidth
        >
          Return to Sales List
        </Button>
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box p={3} maxWidth="600px" mx="auto">
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleBack}>
              Go Back
            </Button>
          }
        >
          No invoice data found
        </Alert>
        <Button 
          variant="contained" 
          onClick={handleBack} 
          startIcon={<ArrowBack />}
          fullWidth
        >
          Return to Sales List
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh' }}>
      {/* Print Controls - Hidden when printing */}
      <Box 
        sx={{ 
          p: 2, 
          bgcolor: '#ffffff', 
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
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
        <Box display="flex" alignItems="center" gap={2}>
          <Chip 
            label={invoice.isReturned ? 'Returned' : 'Active'} 
            color={invoice.isReturned ? 'error' : 'success'}
            size="small"
          />
          <Typography variant="h6" fontWeight="bold">
            Invoice # {invoice.invoiceNo}
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Print />}
          onClick={handlePrint}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%)',
            }
          }}
        >
          Print Invoice
        </Button>
      </Box>

      {/* Invoice Content */}
      <Box sx={{ p: 3, maxWidth: '1000px', margin: '0 auto' }} id="invoice-content">
        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 2px 20px rgba(0,0,0,0.08)' }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="start" mb={3} flexWrap="wrap">
            <Box mb={2}>
              <Typography variant="h4" fontWeight="bold" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Receipt /> Inventory Pro
              </Typography>
              <Typography variant="body2" color="textSecondary">
                123 Business Street, City - 400001
              </Typography>
              <Typography variant="body2" color="textSecondary">
                GST: GST123456789 | Phone: +91 9876543210
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Email: info@inventorypro.com
              </Typography>
            </Box>
            <Box textAlign="right">
              <Typography variant="h5" fontWeight="bold" color="primary">
                TAX INVOICE
              </Typography>
              <Typography variant="h6" fontWeight={500} sx={{ color: '#333' }}>
                {invoice.invoiceNo}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Date: {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </Typography>
              <Chip 
                label={invoice.paymentType || 'N/A'} 
                size="small"
                color={invoice.paymentType === 'CREDIT' ? 'warning' : 'success'}
                sx={{ mt: 0.5 }}
              />
              {invoice.referenceNo && (
                <Typography variant="body2" color="textSecondary">
                  Ref: {invoice.referenceNo}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Customer Details */}
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Bill To:
              </Typography>
              <Typography variant="h6" fontWeight={500}>
                {invoice.customerName || 'Unknown Customer'}
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
                <strong>Payment Type:</strong> {invoice.paymentType || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Total Items:</strong> {invoice.items?.length || 0}
              </Typography>
            </Grid>
          </Grid>

          {/* Items Table */}
          <TableContainer sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Item</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Rate (₹)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Disc %</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Tax %</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Amount (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <TableRow key={item.id || index} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {item.itemName || 'Unknown Item'}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.itemCode || '-'}</TableCell>
                      <TableCell align="right">{parseFloat(item.quantity).toFixed(0)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell align="right">{item.discountPercent || 0}%</TableCell>
                      <TableCell align="right">{item.taxPercent || 0}%</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={500}>
                          {formatCurrency(item.totalAmount)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">No items found in this invoice</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 2 }} />

          {/* Summary */}
          <Box display="flex" justifyContent="flex-end">
            <Box sx={{ width: { xs: '100%', sm: 350 } }}>
              <Box display="flex" justifyContent="space-between" py={0.5}>
                <Typography color="textSecondary">Subtotal</Typography>
                <Typography>{formatCurrency(invoice.totalAmount)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" py={0.5}>
                <Typography color="textSecondary">Discount</Typography>
                <Typography color="success.main">
                  -{formatCurrency(invoice.discountAmount)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" py={0.5}>
                <Typography color="textSecondary">Tax</Typography>
                <Typography>+{formatCurrency(invoice.taxAmount)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between" py={0.5}>
                <Typography variant="h6">Total</Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(invoice.netAmount)}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" py={0.5}>
                <Typography color="textSecondary">Paid</Typography>
                <Typography>{formatCurrency(invoice.paidAmount)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" py={0.5}>
                <Typography color="textSecondary">Balance</Typography>
                <Typography 
                  fontWeight={500} 
                  color={invoice.balanceAmount > 0 ? '#ed6c02' : '#2e7d32'}
                >
                  {formatCurrency(invoice.balanceAmount)}
                </Typography>
              </Box>
            </Box>
          </Box>

          {invoice.notes && (
            <Box mt={3}>
              <Typography variant="subtitle2" color="textSecondary">
                Notes:
              </Typography>
              <Typography variant="body2" sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                {invoice.notes}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Footer */}
          <Box textAlign="center">
            <Typography variant="caption" color="textSecondary" display="block">
              Thank you for your business!
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block" sx={{ fontSize: '0.65rem' }}>
              This is a computer-generated invoice. No signature required.
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block" sx={{ fontSize: '0.65rem' }}>
              For queries, contact support@inventorypro.com
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block" sx={{ fontSize: '0.6rem', mt: 1 }}>
              Generated on: {new Date().toLocaleString()}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default SalesPrint;
