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
  LocalShipping,
  Search,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { purchaseService } from '../../services/purchaseService';
import { supplierService } from '../../services/supplierService';
import { itemService } from '../../services/itemService';

const PurchaseOrder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [po, setPo] = useState({
    poDate: new Date().toISOString().split('T')[0],
    supplierId: '',
    supplier: null,
    expectedDeliveryDate: '',
    notes: '',
    items: [],
  });
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchPurchaseOrderForEdit();
    } else {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [suppliersData, itemsData] = await Promise.all([
        supplierService.getAll(0, 1000),
        itemService.getAll(0, 1000),
      ]);
      setSuppliers(suppliersData.content || []);
      setItems(itemsData.content || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchPurchaseOrderForEdit = async () => {
    setLoadingData(true);
    try {
      // Fetch the purchase order by ID
      const data = await purchaseService.getOrderById(id);
      console.log('📋 Purchase Order data:', data);
      
      // Populate the form with existing data
      setPo({
        poDate: data.poDate,
        supplierId: data.supplierId,
        supplier: { id: data.supplierId, name: data.supplierName },
        expectedDeliveryDate: data.expectedDeliveryDate || '',
        notes: data.notes || '',
        items: data.items.map(item => ({
          itemId: item.itemId,
          itemName: item.itemName,
          itemCode: item.itemCode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: item.totalAmount,
        })),
      });
      
      // Fetch suppliers and items for dropdowns
      const [suppliersData, itemsData] = await Promise.all([
        supplierService.getAll(0, 1000),
        itemService.getAll(0, 1000),
      ]);
      setSuppliers(suppliersData.content || []);
      setItems(itemsData.content || []);
      
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      toast.error('Failed to load purchase order');
      navigate('/purchases/orders');
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedItem) {
      toast.warning('Please select an item');
      return;
    }

    const existingItem = po.items.find(
      (item) => item.itemId === selectedItem.id
    );

    if (existingItem) {
      toast.warning('Item already added');
      return;
    }

    const newItem = {
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      itemCode: selectedItem.code,
      quantity: quantity,
      unitPrice: unitPrice,
      totalAmount: quantity * unitPrice,
    };

    setPo({
      ...po,
      items: [...po.items, newItem],
    });

    setSelectedItem(null);
    setQuantity(1);
    setUnitPrice(0);
    toast.success('Item added to purchase order');
  };

  const handleRemoveItem = (index) => {
    const updatedItems = po.items.filter((_, i) => i !== index);
    setPo({ ...po, items: updatedItems });
  };

  const calculateTotal = () => {
    return po.items.reduce((sum, item) => sum + item.totalAmount, 0);
  };

  const handleSubmit = async () => {
    if (!po.supplierId) {
      setError('Please select a supplier');
      return;
    }

    if (po.items.length === 0) {
      setError('Please add at least one item');
      return;
    }

    const requestData = {
      poDate: po.poDate,
      supplierId: po.supplierId,
      expectedDeliveryDate: po.expectedDeliveryDate,
      notes: po.notes,
      items: po.items.map((item) => ({
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    };

    setLoading(true);
    setError('');
    try {
      let response;
      if (isEdit) {
        // Update existing purchase order
        response = await purchaseService.updateOrder(id, requestData);
        toast.success(`Purchase Order ${response.poNumber} updated successfully!`);
      } else {
        // Create new purchase order
        response = await purchaseService.createOrder(requestData);
        toast.success(`Purchase Order ${response.poNumber} created successfully!`);
      }
      navigate('/purchases/orders');
    } catch (error) {
      console.error('Save error:', error);
      setError(error.response?.data?.error || 'Failed to save purchase order');
    } finally {
      setLoading(false);
    }
  };

  const total = calculateTotal();

  if (loadingData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <LocalShipping sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {isEdit ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {isEdit ? 'Update existing purchase order' : 'Create a new purchase order'}
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
              Order Details
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Order Date"
                  type="date"
                  value={po.poDate}
                  onChange={(e) => setPo({ ...po, poDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Supplier</InputLabel>
                  <Select
                    value={po.supplierId}
                    onChange={(e) => {
                      const supplier = suppliers.find(s => s.id === e.target.value);
                      setPo({
                        ...po,
                        supplierId: e.target.value,
                        supplier: supplier,
                      });
                    }}
                    label="Supplier"
                  >
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.name} - {supplier.phone}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Expected Delivery Date"
                  type="date"
                  value={po.expectedDeliveryDate}
                  onChange={(e) =>
                    setPo({ ...po, expectedDeliveryDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  value={po.notes}
                  onChange={(e) => setPo({ ...po, notes: e.target.value })}
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
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Rate</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {po.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography color="textSecondary">
                          No items added yet.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    po.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.itemCode}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
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
                Order Summary
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography color="textSecondary">Total Items</Typography>
                  <Typography fontWeight={500}>{po.items.length}</Typography>
                </Box>
                <Divider />
                <Box display="flex" justifyContent="space-between" py={1}>
                  <Typography color="textSecondary">Total Amount</Typography>
                  <Typography fontWeight={500}>₹{total.toFixed(2)}</Typography>
                </Box>
              </Box>

              <Box mt={3}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  startIcon={<Save />}
                  onClick={handleSubmit}
                  disabled={loading || po.items.length === 0}
                  sx={{ mb: 1 }}
                >
                  {loading ? 'Saving...' : isEdit ? 'Update Order' : 'Create Order'}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Cancel />}
                  onClick={() => navigate('/purchases/orders')}
                >
                  Cancel
                </Button>
              </Box>

              {po.supplier && (
                <Box mt={2} p={2} bgcolor="#f5f7fa" borderRadius={1}>
                  <Typography variant="subtitle2" gutterBottom>
                    Supplier Details
                  </Typography>
                  <Typography variant="body2">
                    <strong>Name:</strong> {po.supplier.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Phone:</strong> {po.supplier.phone}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PurchaseOrder;