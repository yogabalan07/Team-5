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
  Stack,
} from '@mui/material';
import {
  Print,
  ArrowBack,
  Receipt,
  Business,
  Phone,
  Email,
  LocationOn,
  QrCode,
  CheckCircle,
} from '@mui/icons-material';
import { salesService } from '../../services/salesService';

const SalesPrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [printTriggered, setPrintTriggered] = useState(false);

  // Company Details
  const company = {
    name: 'Inventory Pro Solutions',
    address: '123 Business District, MG Road, Mumbai - 400001',
    phone: '+91 98765 43210',
    email: 'info@inventorypro.com',
    gst: 'GSTIN: 27AABCI1234D1ZP',
    pan: 'PAN: AABCI1234D',
    cin: 'CIN: U74999MH2020PTC123456',
    website: 'www.inventorypro.com',
  };

  useEffect(() => {
    if (id) {
      fetchInvoiceData(id);
    } else {
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

      const response = await salesService.getInvoiceById(invoiceId);
      
      if (!response) {
        setError('Invoice not found');
        setLoading(false);
        return;
      }
      
      setInvoice(response);
      setLoading(false);
      
      if (!printTriggered) {
        setTimeout(() => {
          window.print();
          setPrintTriggered(true);
        }, 800);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      if (error.response?.status === 404) {
        setError(`Invoice with ID ${invoiceId} not found.`);
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

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${parseFloat(amount).toFixed(2)}`;
  };

  const numberToWords = (num) => {
    if (!num) return 'Zero';
    const words = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
    return words[num] || num.toString();
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={handleBack} startIcon={<ArrowBack />} fullWidth>
          Return to Sales List
        </Button>
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box p={3} maxWidth="600px" mx="auto">
        <Alert severity="warning" sx={{ mb: 3 }}>
          No invoice data found
        </Alert>
        <Button variant="contained" onClick={handleBack} startIcon={<ArrowBack />} fullWidth>
          Return to Sales List
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f0f2f5', minHeight: '100vh' }}>
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
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={handleBack}>
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
            background: 'linear-gradient(135deg, #1a237e, #0d47a1)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0d47a1, #1a237e)',
            }
          }}
        >
          Print Invoice
        </Button>
      </Box>

      {/* Invoice Content */}
      <Box sx={{ p: 3, maxWidth: '1100px', margin: '0 auto' }} id="invoice-content">
        <Paper sx={{ 
          p: 4, 
          borderRadius: 2, 
          boxShadow: '0 2px 30px rgba(0,0,0,0.08)',
          '@media print': {
            boxShadow: 'none',
            p: 3,
          }
        }}>
          {/* ===================== HEADER ===================== */}
          <Box sx={{ 
            borderBottom: '3px solid #1a237e',
            pb: 2,
            mb: 3,
            '@media print': {
              borderBottom: '3px solid #1a237e',
            }
          }}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item xs={12} md={7}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 1,
                      bgcolor: '#1a237e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Receipt sx={{ fontSize: 30, color: '#fff' }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight="bold" color="#1a237e">
                      {company.name}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography variant="caption" color="textSecondary" display="flex" alignItems="center" gap={0.5}>
                        <LocationOn sx={{ fontSize: 14 }} /> {company.address}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" mt={0.5}>
                      <Typography variant="caption" color="textSecondary" display="flex" alignItems="center" gap={0.5}>
                        <Phone sx={{ fontSize: 12 }} /> {company.phone}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" display="flex" alignItems="center" gap={0.5}>
                        <Email sx={{ fontSize: 12 }} /> {company.email}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box textAlign="right">
                  <Typography variant="h4" fontWeight="bold" color="#1a237e" sx={{ letterSpacing: 2 }}>
                    TAX INVOICE
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#333' }}>
                    {invoice.invoiceNo}
                  </Typography>
                  <Box mt={0.5}>
                    <Chip 
                      label={invoice.paymentType || 'N/A'} 
                      size="small"
                      color={invoice.paymentType === 'CREDIT' ? 'warning' : 'success'}
                      sx={{ fontWeight: 'bold' }}
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* ===================== BILL DETAILS ===================== */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: 2, 
                bgcolor: '#f8f9fa', 
                borderRadius: 1,
                borderLeft: '4px solid #1a237e',
              }}>
                <Typography variant="subtitle2" color="#1a237e" fontWeight="bold" gutterBottom>
                  BILL TO:
                </Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#333' }}>
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
                {invoice.customerGst && (
                  <Typography variant="body2" color="textSecondary">
                    GSTIN: {invoice.customerGst}
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: 2, 
                bgcolor: '#f8f9fa', 
                borderRadius: 1,
                borderLeft: '4px solid #0d47a1',
              }}>
                <Typography variant="subtitle2" color="#0d47a1" fontWeight="bold" gutterBottom>
                  INVOICE DETAILS:
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Invoice Date</Typography>
                    <Typography variant="body2" fontWeight="500">
                      {invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Due Date</Typography>
                    <Typography variant="body2" fontWeight="500">
                      {invoice.invoiceDate ? new Date(new Date(invoice.invoiceDate).setDate(new Date(invoice.invoiceDate).getDate() + 30)).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Payment Mode</Typography>
                    <Typography variant="body2" fontWeight="500">{invoice.paymentType || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="textSecondary">Status</Typography>
                    <Chip 
                      label={invoice.isReturned ? 'Returned' : 'Active'} 
                      size="small"
                      color={invoice.isReturned ? 'error' : 'success'}
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>

          {/* ===================== ITEMS TABLE ===================== */}
          <TableContainer sx={{ 
            borderRadius: 1, 
            border: '1px solid #e0e0e0',
            mb: 3,
            '@media print': {
              border: '1px solid #333',
            }
          }}>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  bgcolor: '#1a237e',
                  '@media print': {
                    bgcolor: '#1a237e !important',
                  }
                }}>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>#</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Item Description</TableCell>
                  <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>HSN/SAC</TableCell>
                  <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>Qty</TableCell>
                  <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>Rate (₹)</TableCell>
                  <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>Disc %</TableCell>
                  <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>Tax %</TableCell>
                  <TableCell align="right" sx={{ color: '#fff', fontWeight: 'bold' }}>Amount (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoice.items && invoice.items.length > 0 ? (
                  invoice.items.map((item, index) => (
                    <TableRow key={item.id || index} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="500">
                          {item.itemName || 'Unknown Item'}
                        </Typography>
                        {item.itemCode && (
                          <Typography variant="caption" color="textSecondary">
                            Code: {item.itemCode}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{item.hsnCode || '-'}</TableCell>
                      <TableCell align="right">{parseFloat(item.quantity).toFixed(0)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell align="right">{item.discountPercent || 0}%</TableCell>
                      <TableCell align="right">{item.taxPercent || 0}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(item.totalAmount)}
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

          {/* ===================== SUMMARY ===================== */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Box sx={{ 
                p: 2, 
                bgcolor: '#f8f9fa', 
                borderRadius: 1,
                border: '1px solid #e0e0e0',
              }}>
                <Typography variant="subtitle2" color="#1a237e" fontWeight="bold" gutterBottom>
                  Amount in Words:
                </Typography>
                <Typography variant="body2" fontWeight="500" sx={{ textTransform: 'capitalize' }}>
                  {invoice.netAmount ? `${numberToWords(Math.floor(invoice.netAmount))} Rupees Only` : 'Zero Rupees Only'}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="textSecondary">
                    Terms & Conditions:
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    1. Goods once sold cannot be returned
                  </Typography>
                </Box>
                <Typography variant="caption" color="textSecondary" display="block">
                  2. Payment due within 30 days
                </Typography>
                {invoice.notes && (
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
                    Note: {invoice.notes}
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ 
                p: 2, 
                bgcolor: '#f8f9fa', 
                borderRadius: 1,
                border: '1px solid #e0e0e0',
              }}>
                <Typography variant="subtitle2" color="#1a237e" fontWeight="bold" gutterBottom>
                  Payment Summary:
                </Typography>
                <Box display="flex" justifyContent="space-between" py={0.5}>
                  <Typography color="textSecondary">Subtotal</Typography>
                  <Typography>{formatCurrency(invoice.totalAmount)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" py={0.5}>
                  <Typography color="textSecondary">Discount</Typography>
                  <Typography color="success.main">-{formatCurrency(invoice.discountAmount)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" py={0.5}>
                  <Typography color="textSecondary">Tax (GST)</Typography>
                  <Typography>+{formatCurrency(invoice.taxAmount)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between" py={0.5}>
                  <Typography variant="h6" fontWeight="bold">Total</Typography>
                  <Typography variant="h6" fontWeight="bold" color="#1a237e">
                    {formatCurrency(invoice.netAmount)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between" py={0.5}>
                  <Typography color="textSecondary">Paid</Typography>
                  <Typography>{formatCurrency(invoice.paidAmount)}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" py={0.5}>
                  <Typography color="textSecondary">Balance</Typography>
                  <Typography 
                    fontWeight="bold" 
                    color={invoice.balanceAmount > 0 ? '#ed6c02' : '#2e7d32'}
                  >
                    {formatCurrency(invoice.balanceAmount)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* ===================== FOOTER ===================== */}
          <Box sx={{ 
            mt: 4, 
            pt: 3, 
            borderTop: '2px solid #1a237e',
            '@media print': {
              borderTop: '2px solid #1a237e',
            }
          }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="caption" color="textSecondary" display="block">
                  <strong>Company:</strong> {company.name}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  {company.gst}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  {company.pan}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4} textAlign="center">
                <Box display="flex" flexDirection="column" alignItems="center">
                  <QrCode sx={{ fontSize: 60, color: '#333' }} />
                  <Typography variant="caption" color="textSecondary">
                    Scan to Verify
                  </Typography>
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                    This is a computer-generated invoice
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4} textAlign="right">
                <Typography variant="caption" color="textSecondary" display="block">
                  <strong>Contact:</strong> {company.phone}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  {company.email}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  {company.website}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1, fontSize: '0.6rem' }}>
                  Generated: {new Date().toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
            <Box textAlign="center" sx={{ mt: 2 }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.6rem' }}>
                &copy; {new Date().getFullYear()} {company.name}. All rights reserved.
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default SalesPrint;
