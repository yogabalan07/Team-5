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
import { purchaseService } from '../../services/purchaseService';

const PurchaseOrderPrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrderData(id);
    } else {
      const printData = window.printOrderData;
      if (printData) {
        setOrder(printData);
        setLoading(false);
        setTimeout(() => window.print(), 500);
      } else {
        setError('No order data found');
        setLoading(false);
      }
    }
  }, [id]);

  const fetchOrderData = async (orderId) => {
    try {
      setLoading(true);
      console.log('🔄 Fetching order data for ID:', orderId);
      
      const response = await purchaseService.getOrderById(orderId);
      console.log('✅ Order data:', response);
      
      setOrder(response);
      setLoading(false);
      
      // Auto print after data loads
      setTimeout(() => {
        window.print();
      }, 800);
    } catch (error) {
      console.error('Error fetching order:', error);
      setError(error.response?.data?.error || 'Failed to load order data');
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    navigate('/purchases/orders');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" flexDirection="column">
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading purchase order...</Typography>
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box p={3}>
        <Alert severity="error">{error || 'No order data found'}</Alert>
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
          Purchase Order Preview
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Print />}
          onClick={handlePrint}
        >
          Print
        </Button>
      </Box>

      {/* Order Content */}
      <Box sx={{ p: 4, maxWidth: '1000px', margin: '0 auto' }} id="po-print-content">
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
            </Box>
            <Box textAlign="right">
              <Typography variant="h5" fontWeight="bold" color="primary">
                PURCHASE ORDER
              </Typography>
              <Typography variant="h6" fontWeight={500}>
                {order.poNumber}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Date: {new Date(order.poDate).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
              {order.expectedDeliveryDate && (
                <Typography variant="body2" color="textSecondary">
                  Expected Delivery: {new Date(order.expectedDeliveryDate).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Supplier Details */}
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Supplier:
              </Typography>
              <Typography variant="h6" fontWeight={500}>
                {order.supplierName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Phone: {order.supplierPhone || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Order Details:
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {order.isConverted ? 'Converted to Invoice' : 'Pending'}
              </Typography>
              <Typography variant="body2">
                <strong>Total Items:</strong> {order.items?.length || 0}
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
                  <TableCell align="right">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell>{item.itemCode}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">₹{item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell align="right">₹{item.totalAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
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
            <Box sx={{ width: 300 }}>
              <Box display="flex" justifyContent="space-between" py={0.5}>
                <Typography color="textSecondary">Total Amount</Typography>
                <Typography variant="h6" color="primary">
                  ₹{order.totalAmount?.toFixed(2) || '0.00'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {order.notes && (
            <Box mt={2}>
              <Typography variant="subtitle2" color="textSecondary">
                Notes:
              </Typography>
              <Typography variant="body2">{order.notes}</Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Footer */}
          <Box textAlign="center">
            <Typography variant="caption" color="textSecondary">
              Thank you for your business!
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block">
              This is a computer-generated purchase order. No signature required.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default PurchaseOrderPrint;