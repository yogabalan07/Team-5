import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import { Print, ArrowBack, Receipt } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { salesService } from '../../services/salesService';

const SalesInvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const data = await salesService.getInvoiceById(id);
      setInvoice(data);
    } catch (error) {
      toast.error('Failed to fetch invoice details');
      navigate('/sales');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!invoice) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6">Invoice not found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Receipt sx={{ fontSize: 40, color: '#1976d2' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Invoice #{invoice.invoiceNo}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              View invoice details
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
          <Button
            variant="contained"
            startIcon={<Print />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 2 }} id="invoice-print">
        {/* Invoice Header */}
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight="bold" color="primary">
              📦 Inventory Pro
            </Typography>
            <Typography variant="body2" color="textSecondary">
              123 Business Street, City
            </Typography>
            <Typography variant="body2" color="textSecondary">
              GST: GST123456789
            </Typography>
          </Box>
          <Box textAlign="right">
            <Chip
              label={invoice.paymentType}
              color={invoice.paymentType === 'CASH' ? 'success' : 'warning'}
              sx={{ fontWeight: 500 }}
            />
            <Typography variant="body2" color="textSecondary" mt={1}>
              Date: {new Date(invoice.invoiceDate).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Invoice: #{invoice.invoiceNo}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Customer & Invoice Details */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Bill To:
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {invoice.customerName}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Phone: {invoice.customerPhone}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Invoice Details:
            </Typography>
            <Typography variant="body2">
              Status: <Chip size="small" label={invoice.isReturned ? 'Returned' : 'Active'} />
            </Typography>
            <Typography variant="body2">
              Payment: {invoice.paymentType}
            </Typography>
            {invoice.referenceNo && (
              <Typography variant="body2">
                Reference: {invoice.referenceNo}
              </Typography>
            )}
          </Grid>
        </Grid>

        {/* Items Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                <TableCell>#</TableCell>
                <TableCell>Item</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Discount</TableCell>
                <TableCell align="right">Tax</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {item.itemName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Code: {item.itemCode}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">₹{item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell align="right">{item.discountPercent}%</TableCell>
                  <TableCell align="right">{item.taxPercent}%</TableCell>
                  <TableCell align="right">₹{item.totalAmount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider sx={{ my: 2 }} />

        {/* Summary */}
        <Box display="flex" justifyContent="flex-end">
          <Box sx={{ width: 300 }}>
            <Box display="flex" justifyContent="space-between" py={1}>
              <Typography color="textSecondary">Subtotal</Typography>
              <Typography>₹{invoice.totalAmount.toFixed(2)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" py={1}>
              <Typography color="textSecondary">Discount</Typography>
              <Typography color="success.main">
                -₹{invoice.discountAmount.toFixed(2)}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" py={1}>
              <Typography color="textSecondary">Tax</Typography>
              <Typography>+₹{invoice.taxAmount.toFixed(2)}</Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box display="flex" justifyContent="space-between" py={1}>
              <Typography variant="h6">Total</Typography>
              <Typography variant="h6" color="primary">
                ₹{invoice.netAmount.toFixed(2)}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" py={1}>
              <Typography color="textSecondary">Paid</Typography>
              <Typography>₹{invoice.paidAmount.toFixed(2)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" py={1}>
              <Typography color="textSecondary">Balance</Typography>
              <Typography fontWeight={500} color={invoice.balanceAmount > 0 ? 'warning.main' : 'success.main'}>
                ₹{invoice.balanceAmount.toFixed(2)}
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
        </Box>
      </Paper>
    </Box>
  );
};

export default SalesInvoiceView;