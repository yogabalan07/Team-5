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
} from '@mui/material';
import {
  Add,
  Delete,
  Save,
  Cancel,
  ShoppingCart,
  Search,
  LocalShipping,
  CheckCircle,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { purchaseService } from '../../services/purchaseService';
import { supplierService } from '../../services/supplierService';
import { itemService } from '../../services/itemService';
import SupplierSearch from '../suppliers/SupplierSearch';

const PurchaseEntry = () => {
  const [invoice, setInvoice] = useState({
    invoiceDate: new Date().toISOString().split('T')[0],
    receivedDate: new Date().toISOString().split('T')[0],
    supplierId: '',
    supplier: null,
    poId: '',
    paymentType: 'CREDIT',
    notes: '',
    items: [],
  });
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdInvoice, setCreatedInvoice] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (invoice.supplierId) {
      fetchPurchaseOrders();
    }
  }, [invoice.supplierId]);

  const fetchItems = async () => {
    try {
      const data = await itemService.getAll(0, 100);
      setItems(data.content || []);
    } catch (error) {
      toast.error('Failed to fetch items');
    }
  };

  const fetchPurchaseOrders = async () => {
    try {
      const data = await purchaseService.getOrdersBySupplier(invoice.supplierId);
      setPurchaseOrders(data.content || []);
    } catch (error) {
      toast.error('Failed to fetch purchase orders');
    }
  };

  const handleSupplierSelect = (supplier) => {
    setInvoice({
      ...invoice,
      supplierId: supplier.id,
      supplier: supplier,
    });
  };

  const handleAddItem = () => {
    if (!selectedItem) {
      toast.warning('Please select an item');
      return;
    }

    const newItem = {
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      itemCode: selectedItem.code,
      orderedQuantity: quantity,
      receivedQuantity: quantity,
      unitPrice: unitPrice,
      discountPercent: 0,
      taxPercent: selectedItem.gstRate || 0,
      totalAmount: quantity * unitPrice,
    };

    setInvoice({
      ...invoice,
      items: [...invoice.items, newItem],
    });

    setSelectedItem(null);
    setQuantity(1);
    setUnitPrice(0);
    toast.success('Item added to purchase invoice');
  };

  const handleRemoveItem = (index) => {
    const updatedItems = invoice.items.filter((_, i) => i !== index);
    setInvoice({ ...invoice, items: updatedItems });
  };

  const calculateTotals = () => {
    let total = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    invoice.items.forEach((item) => {
      const lineTotal = item.receivedQuantity * item.unitPrice;
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
    if (!invoice.supplierId) {
      setError('Please select a supplier');
      return;
    }

    if (invoice.items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    const totals = calculateTotals();
    const requestData = {
      invoiceDate: invoice.invoiceDate,
      receivedDate: invoice.receivedDate,
      supplierId: invoice.supplierId,
      poId: invoice.poId || null,
      paymentType: invoice.paymentType,
      notes: invoice.notes,
      items: invoice.items.map((item) => ({
        itemId: item.itemId,
        poItemId: null,
        orderedQuantity: item.orderedQuantity,
        receivedQuantity: item.receivedQuantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        taxPercent: item.taxPercent,
      })),
    };

    setLoading(true);
    try {
      const response = await purchaseService.createInvoice(requestData);
      setCreatedInvoice(response);
      setSuccessDialogOpen(true);
      toast.success('Purchase invoice created successfully!');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create purchase invoice');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <LocalShipping sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Purchase Entry
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Record purchase invoices
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
              Purchase Details
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
                <TextField
                  fullWidth
                  label="Received Date"
                  type="date"
                  value={invoice.receivedDate}
                  onChange={(e) =>
                    setInvoice({ ...invoice, receivedDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={1}>
                  <TextField
                    fullWidth
                    label="Supplier"
                    value={invoice.supplier?.name || ''}
                    placeholder="Search supplier..."
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <IconButton onClick={() => setSupplierSearchOpen(true)}>
                          <Search />
                        </IconButton>
                      ),
                    }}
                  />
                  {invoice.supplier && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        setInvoice({
                          ...invoice,
                          supplierId: '',
                          supplier: null,
                          poId: '',
                        });
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </Box>
              </Grid>
              {invoice.supplier && purchaseOrders.length > 0 && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Purchase Order</InputLabel>
                    <Select
                      value={invoice.poId}
                      onChange={(e) =>
                        setInvoice({ ...invoice, poId: e.target.value })
                      }
                      label="Purchase Order"
                    >
                      <MenuItem value="">None</MenuItem>
                      {purchaseOrders.map((po) => (
                        <MenuItem key={po.id} value={po.id}>
                          {po.poNumber} - ₹{po.totalAmount}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
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
              <FormControl sx={{ flexGrow: 1, minWidth: 200 }}>
                <InputLabel>Select Item</InputLabel>
                <Select
                  value={selectedItem?.id || ''}
                  onChange={(e) => {
                    const item = items.find((i) => i.id === e.target.value);
                    setSelectedItem(item);
                    setUnitPrice(item?.purchasePrice || 0);
                  }}
                  label="Select Item"
                >
                  {items.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.code} - {item.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                sx={{ width: 120 }}
                InputProps={{ inputProps: { min: 1 } }}
              />
              <TextField
                label="Unit Price"
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                sx={{ width: 150 }}
                InputProps={{ startAdornment: '₹' }}
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddItem}
                disabled={!selectedItem || unitPrice <= 0}
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
                    <TableCell align="right">Ordered</TableCell>
                    <TableCell align="right">Received</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                        <Typography color="textSecondary">
                          No items added yet.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.itemCode}</TableCell>
                        <TableCell align="right">{item.orderedQuantity}</TableCell>
                        <TableCell align="right">{item.receivedQuantity}</TableCell>
                        <TableCell align="right">₹{item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{item.totalAmount.toFixed(2)}</TableCell>
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
                  disabled={loading || invoice.items.length === 0}
                  sx={{ mb: 1 }}
                >
                  {loading ? 'Creating...' : 'Create Purchase Invoice'}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={() => {
                    setInvoice({
                      invoiceDate: new Date().toISOString().split('T')[0],
                      receivedDate: new Date().toISOString().split('T')[0],
                      supplierId: '',
                      supplier: null,
                      poId: '',
                      paymentType: 'CREDIT',
                      notes: '',
                      items: [],
                    });
                    setError('');
                  }}
                >
                  Reset
                </Button>
              </Box>

              {invoice.supplier && (
                <Box mt={2} p={2} bgcolor="#f5f7fa" borderRadius={1}>
                  <Typography variant="subtitle2" gutterBottom>
                    Supplier Details
                  </Typography>
                  <Typography variant="body2">
                    <strong>Name:</strong> {invoice.supplier.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {invoice.supplier.phone}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <SupplierSearch
        open={supplierSearchOpen}
        onClose={() => setSupplierSearchOpen(false)}
        onSelect={handleSupplierSelect}
      />

      <Dialog open={successDialogOpen} onClose={() => setSuccessDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle color="success" />
            <Typography variant="h6">Purchase Invoice Created</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {createdInvoice && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Purchase invoice has been created successfully!
              </Alert>
              <Box sx={{ bgcolor: '#f5f7fa', p: 2, borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Invoice No:</strong> {createdInvoice.invoiceNo}
                </Typography>
                <Typography variant="body2">
                  <strong>Supplier:</strong> {createdInvoice.supplierName}
                </Typography>
                <Typography variant="body2">
                  <strong>Total:</strong> ₹{createdInvoice.netAmount?.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setSuccessDialogOpen(false);
              setInvoice({
                invoiceDate: new Date().toISOString().split('T')[0],
                receivedDate: new Date().toISOString().split('T')[0],
                supplierId: '',
                supplier: null,
                poId: '',
                paymentType: 'CREDIT',
                notes: '',
                items: [],
              });
            }}
          >
            New Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseEntry;