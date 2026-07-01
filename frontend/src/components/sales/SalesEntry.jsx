import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Card,
  CardContent,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  Delete,
  Save,
  Cancel,
  Person,
  Print,
  Receipt,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { salesService } from '../../services/salesService';
import { customerService } from '../../services/customerService';
import { itemService } from '../../services/itemService';

const SalesEntry = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [invoice, setInvoice] = useState({
    invoiceDate: new Date().toISOString().split('T')[0],
    customerId: '',
    customer: null,
    paymentType: 'CASH',
    items: [],
    notes: '',
  });
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetchInvoiceForEdit();
    } else {
      fetchInitialData();
    }
  }, [id]);

  const fetchInitialData = async () => {
    setLoadingData(true);
    try {
      console.log('🔄 Fetching customers and items...');
      
      const customersData = await customerService.getAll(0, 1000);
      setCustomers(customersData.content || []);
      console.log('✅ Customers loaded:', customersData.content?.length || 0);
      
      const itemsData = await itemService.getAll(0, 1000);
      setItems(itemsData.content || []);
      console.log('✅ Items loaded:', itemsData.content?.length || 0);
      
    } catch (error) {
      console.error('❌ Error fetching data:', error);
      toast.error('Failed to load customers or items');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchInvoiceForEdit = async () => {
    try {
      setLoadingData(true);
      const data = await salesService.getInvoiceById(id);
      console.log('📋 Invoice data:', data);
      
      setInvoice({
        invoiceDate: data.invoiceDate,
        customerId: data.customerId,
        customer: { id: data.customerId, name: data.customerName },
        paymentType: data.paymentType || 'CASH',
        items: data.items.map(item => ({
          itemId: item.itemId,
          itemName: item.itemName,
          itemCode: item.itemCode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || 0,
          taxPercent: item.taxPercent || 0,
          totalAmount: item.totalAmount,
        })),
        notes: data.notes || '',
      });
      
      await fetchInitialData();
      
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice');
      navigate('/sales/list');
    } finally {
      setLoadingData(false);
    }
  };

  const handleCustomerSelect = (event, value) => {
    if (value) {
      setInvoice({
        ...invoice,
        customerId: value.id,
        customer: value,
      });
    } else {
      setInvoice({
        ...invoice,
        customerId: '',
        customer: null,
      });
    }
  };

  const handleAddItem = () => {
    if (!selectedItem) {
      toast.warning('Please select an item');
      return;
    }

    const existingItem = invoice.items.find(
      (item) => item.itemId === selectedItem.id
    );

    if (existingItem) {
      toast.warning('Item already added to invoice');
      return;
    }

    if (selectedItem.currentStock < quantity) {
      toast.error(`Insufficient stock! Available: ${selectedItem.currentStock}`);
      return;
    }

    const newItem = {
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      itemCode: selectedItem.code,
      quantity: quantity,
      unitPrice: selectedItem.sellingPrice || selectedItem.price || 0,
      discountPercent: 0,
      taxPercent: selectedItem.gstRate || 0,
      totalAmount: quantity * (selectedItem.sellingPrice || selectedItem.price || 0),
    };

    setInvoice({
      ...invoice,
      items: [...invoice.items, newItem],
    });

    setSelectedItem(null);
    setQuantity(1);
    toast.success('Item added to invoice');
  };

  const handleRemoveItem = (index) => {
    const updatedItems = invoice.items.filter((_, i) => i !== index);
    setInvoice({ ...invoice, items: updatedItems });
  };

  const handleItemQuantityChange = (index, value) => {
    const updatedItems = [...invoice.items];
    const qty = parseFloat(value) || 0;
    const item = items.find(i => i.id === updatedItems[index].itemId);
    
    if (item && qty > item.currentStock) {
      toast.error(`Insufficient stock! Available: ${item.currentStock}`);
      return;
    }
    
    updatedItems[index].quantity = qty;
    updatedItems[index].totalAmount = qty * updatedItems[index].unitPrice;
    setInvoice({ ...invoice, items: updatedItems });
  };

  const handleItemPriceChange = (index, value) => {
    const updatedItems = [...invoice.items];
    const price = parseFloat(value) || 0;
    
    updatedItems[index].unitPrice = price;
    updatedItems[index].totalAmount = updatedItems[index].quantity * price;
    setInvoice({ ...invoice, items: updatedItems });
  };

  const calculateTotals = () => {
    let total = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    invoice.items.forEach((item) => {
      const lineTotal = item.quantity * item.unitPrice;
      const discount = lineTotal * (item.discountPercent / 100);
      const tax = (lineTotal - discount) * (item.taxPercent / 100);
      total += lineTotal;
      totalDiscount += discount;
      totalTax += tax;
    });

    return {
      totalAmount: total,
      totalDiscount: totalDiscount,
      totalTax: totalTax,
      netAmount: total - totalDiscount + totalTax,
    };
  };

  const handleSubmit = async () => {
    // Validation
    if (!invoice.customerId) {
      setError('Please select a customer');
      toast.error('Please select a customer');
      return;
    }

    if (invoice.items.length === 0) {
      setError('Please add at least one item');
      toast.error('Please add at least one item');
      return;
    }

    const totals = calculateTotals();
    const requestData = {
      customerId: invoice.customerId,
      invoiceDate: invoice.invoiceDate,
      paymentType: invoice.paymentType,
      notes: invoice.notes || '',
      items: invoice.items.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent || 0,
        taxPercent: item.taxPercent || 0,
      })),
      totalAmount: totals.totalAmount,
      discountAmount: totals.totalDiscount,
      taxAmount: totals.totalTax,
      netAmount: totals.netAmount,
    };

    console.log('📤 Submitting invoice data:', JSON.stringify(requestData, null, 2));

    setIsSubmitting(true);
    setLoading(true);
    setError('');

    try {
      let response;
      if (isEdit) {
        console.log('🔄 Updating invoice:', id);
        response = await salesService.updateInvoice(id, requestData);
        toast.success(`Invoice ${response.invoiceNo || '#' + id} updated successfully!`);
        navigate('/sales/list');
      } else {
        console.log('📝 Creating new invoice');
        response = await salesService.createInvoice(requestData);
        setCreatedInvoice(response);
        toast.success(`Invoice ${response.invoiceNo} created successfully!`);
        setShowPrintDialog(true);
        
        // Reset form for new invoice
        setInvoice({
          invoiceDate: new Date().toISOString().split('T')[0],
          customerId: '',
          customer: null,
          paymentType: 'CASH',
          items: [],
          notes: '',
        });
      }
      
      // Refresh items to update stock
      const itemsData = await itemService.getAll(0, 1000);
      setItems(itemsData.content || []);
      
    } catch (error) {
      console.error('❌ Save invoice error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error data:', error.response?.data);
      
      // Extract error message
      let errorMessage = 'Failed to save invoice';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.errors) {
          errorMessage = error.response.data.errors.join(', ');
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    if (createdInvoice && createdInvoice.id) {
      window.open(`/sales/print/${createdInvoice.id}`, '_blank');
      setShowPrintDialog(false);
    } else if (isEdit && id) {
      window.open(`/sales/print/${id}`, '_blank');
    } else {
      toast.error('No invoice data to print');
    }
  };

  const totals = calculateTotals();

  if (loadingData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading data...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Receipt sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {isEdit ? 'Edit Sales Invoice' : 'Sales Entry'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {isEdit ? 'Update existing sales invoice' : 'Create a new sales invoice'}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Invoice Details
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Invoice Date"
                  type="date"
                  value={invoice.invoiceDate}
                  onChange={(e) =>
                    setInvoice({ ...invoice, invoiceDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(option) => `${option.name} (${option.phone})`}
                  value={invoice.customer}
                  onChange={handleCustomerSelect}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Customer"
                      placeholder="Type to search..."
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <Person sx={{ color: '#1976d2', mr: 1 }} />
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  noOptionsText="No customers found"
                  loading={loadingData}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Payment Type</InputLabel>
                  <Select
                    value={invoice.paymentType}
                    onChange={(e) =>
                      setInvoice({ ...invoice, paymentType: e.target.value })
                    }
                    label="Payment Type"
                  >
                    <MenuItem value="CASH">Cash</MenuItem>
                    <MenuItem value="CREDIT">Credit</MenuItem>
                    <MenuItem value="CARD">Card</MenuItem>
                    <MenuItem value="UPI">UPI</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={invoice.notes}
                  onChange={(e) =>
                    setInvoice({ ...invoice, notes: e.target.value })
                  }
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Items
            </Typography>

            <Box display="flex" gap={2} mb={2} flexWrap="wrap">
              <Autocomplete
                options={items}
                getOptionLabel={(option) => `${option.code} - ${option.name} (Stock: ${option.currentStock})`}
                value={selectedItem}
                onChange={(event, value) => {
                  setSelectedItem(value);
                  if (value) {
                    setQuantity(1);
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Item"
                    placeholder="Type to search..."
                    sx={{ flexGrow: 1, minWidth: 250 }}
                    size="small"
                  />
                )}
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                noOptionsText="No items found"
                disabled={loadingData}
              />
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                sx={{ width: 120 }}
                size="small"
                InputProps={{ inputProps: { min: 1 } }}
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddItem}
                disabled={!selectedItem}
              >
                Add
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableCell>Item</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="right">Discount</TableCell>
                    <TableCell align="right">Tax</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        <Typography color="textSecondary">
                          No items added yet. Please add items to the invoice.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.itemCode}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={item.quantity}
                            onChange={(e) => handleItemQuantityChange(index, e.target.value)}
                            sx={{ width: 80 }}
                            InputProps={{ inputProps: { min: 1 } }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={item.unitPrice}
                            onChange={(e) => handleItemPriceChange(index, e.target.value)}
                            sx={{ width: 100 }}
                            InputProps={{ inputProps: { min: 0 } }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={item.discountPercent}
                            onChange={(e) => {
                              const updatedItems = [...invoice.items];
                              updatedItems[index].discountPercent = parseFloat(e.target.value) || 0;
                              updatedItems[index].totalAmount = 
                                updatedItems[index].quantity * updatedItems[index].unitPrice * 
                                (1 - updatedItems[index].discountPercent / 100) * 
                                (1 + updatedItems[index].taxPercent / 100);
                              setInvoice({ ...invoice, items: updatedItems });
                            }}
                            sx={{ width: 70 }}
                            InputProps={{ endAdornment: '%' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          {item.taxPercent}%
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight="bold" color="primary">
                            ₹{item.totalAmount.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 2, position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Invoice Summary
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography color="textSecondary">Total Items</Typography>
                  <Typography fontWeight={500}>{invoice.items.length}</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography color="textSecondary">Total Amount</Typography>
                  <Typography fontWeight={500}>
                    ₹{totals.totalAmount.toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography color="textSecondary">Total Discount</Typography>
                  <Typography color="success.main" fontWeight={500}>
                    -₹{totals.totalDiscount.toFixed(2)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography color="textSecondary">Total Tax</Typography>
                  <Typography fontWeight={500}>
                    +₹{totals.totalTax.toFixed(2)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography variant="h6">Net Amount</Typography>
                  <Typography variant="h6" color="primary">
                    ₹{totals.netAmount.toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Box mt={3}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<Save />}
                  onClick={handleSubmit}
                  disabled={loading || invoice.items.length === 0 || isSubmitting}
                  sx={{ mb: 1 }}
                >
                  {loading ? 'Processing...' : isEdit ? 'Update Invoice' : 'Create Invoice'}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={() => {
                    if (isEdit) {
                      navigate('/sales/list');
                    } else {
                      setInvoice({
                        invoiceDate: new Date().toISOString().split('T')[0],
                        customerId: '',
                        customer: null,
                        paymentType: 'CASH',
                        items: [],
                        notes: '',
                      });
                      setError('');
                    }
                  }}
                >
                  {isEdit ? 'Cancel' : 'Reset'}
                </Button>
              </Box>

              {invoice.customer && (
                <Box mt={2} p={2} bgcolor="#f5f7fa" borderRadius={1}>
                  <Typography variant="subtitle2" gutterBottom>
                    Customer Details
                  </Typography>
                  <Typography variant="body2">
                    <strong>Name:</strong> {invoice.customer.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {invoice.customer.phone}
                  </Typography>
                  {invoice.customer.creditLimit > 0 && (
                    <Typography variant="body2">
                      <strong>Credit Limit:</strong> ₹{invoice.customer.creditLimit}
                    </Typography>
                  )}
                  <Typography variant="body2">
                    <strong>Credit Balance:</strong> ₹{invoice.customer.creditBalance || 0}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Print Dialog */}
      <Dialog open={showPrintDialog} onClose={() => setShowPrintDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Receipt sx={{ color: '#1976d2' }} />
            <Typography variant="h6">Invoice Created Successfully!</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            Invoice {createdInvoice?.invoiceNo} has been created successfully!
          </Alert>
          <Box sx={{ bgcolor: '#f5f7fa', p: 2, borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Invoice No:</strong> {createdInvoice?.invoiceNo}
            </Typography>
            <Typography variant="body2">
              <strong>Customer:</strong> {createdInvoice?.customerName}
            </Typography>
            <Typography variant="body2">
              <strong>Total Amount:</strong> ₹{createdInvoice?.netAmount?.toFixed(2)}
            </Typography>
            <Typography variant="body2">
              <strong>Payment Type:</strong> {createdInvoice?.paymentType}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPrintDialog(false)}>Close</Button>
          <Button 
            variant="contained" 
            startIcon={<Print />}
            onClick={handlePrint}
          >
            Print Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesEntry;