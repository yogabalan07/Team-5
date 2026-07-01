import React, { useState } from 'react';
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
  Alert,
  Divider,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Verified,
  Search,
  Save,
  Cancel,
  CheckCircle,
  Warning,
  Add,
  Delete,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { purchaseService } from '../../services/purchaseService';
import { itemService } from '../../services/itemService';

const GRNVerification = () => {
  const [poNumber, setPoNumber] = useState('');
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifiedItems, setVerifiedItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [additionalQuantity, setAdditionalQuantity] = useState(1);
  const [additionalUnitPrice, setAdditionalUnitPrice] = useState(0);

  const handleSearchPO = async () => {
    if (!poNumber.trim()) {
      setError('Please enter a PO number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await purchaseService.getOrderByPoNumber(poNumber);
      setPurchaseOrder(data);
      setVerifiedItems(data.items.map(item => ({
        ...item,
        receivedQuantity: item.quantity,
        verified: true,
        difference: 0,
        isAdditional: false,
      })));
      
      // Fetch items for add item dropdown
      const itemsData = await itemService.getAll(0, 1000);
      setItems(itemsData.content || []);
      
    } catch (error) {
      setError('Purchase Order not found or already converted');
      setPurchaseOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedItem) {
      toast.warning('Please select an item');
      return;
    }

    // Check if item already exists in the list
    const existingItem = verifiedItems.find(item => item.itemId === selectedItem.id);
    if (existingItem) {
      toast.warning('Item already in the list');
      return;
    }

    const newItem = {
      id: Date.now(), // Temporary ID
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      itemCode: selectedItem.code,
      quantity: 0,
      receivedQuantity: additionalQuantity,
      unitPrice: additionalUnitPrice,
      verified: true,
      difference: 0,
      isAdditional: true,
    };

    setVerifiedItems([...verifiedItems, newItem]);
    setAddItemDialogOpen(false);
    setSelectedItem(null);
    setAdditionalQuantity(1);
    setAdditionalUnitPrice(0);
    toast.success('Item added successfully');
  };

  const handleRemoveItem = (index) => {
    const updated = verifiedItems.filter((_, i) => i !== index);
    setVerifiedItems(updated);
  };

  const handleQuantityChange = (index, value) => {
    const updated = [...verifiedItems];
    const qty = parseFloat(value) || 0;
    updated[index].receivedQuantity = qty;
    updated[index].difference = qty - (updated[index].quantity || 0);
    updated[index].verified = qty > 0;
    setVerifiedItems(updated);
  };

  const handleSubmit = async () => {
    const invalidItems = verifiedItems.filter(item => item.receivedQuantity < 0);
    if (invalidItems.length > 0) {
      setError('Received quantity cannot be negative');
      return;
    }

    setSubmitting(true);
    try {
      const response = await purchaseService.convertOrderToInvoice(purchaseOrder.id);
      setSuccessDialogOpen(true);
      toast.success('GRN verified and invoice created successfully!');
      setPurchaseOrder(null);
      setVerifiedItems([]);
      setPoNumber('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to verify GRN');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setPurchaseOrder(null);
    setVerifiedItems([]);
    setPoNumber('');
    setError('');
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Verified sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            GRN Verification
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Verify goods receipt against purchase order
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            label="Purchase Order Number"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            placeholder="Enter PO number"
            sx={{ flexGrow: 1 }}
            disabled={loading}
          />
          <Button
            variant="contained"
            startIcon={<Search />}
            onClick={handleSearchPO}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Search'}
          </Button>
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={loading}
          >
            Reset
          </Button>
        </Box>
      </Paper>

      {purchaseOrder && (
        <>
          <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Purchase Order Details
                </Typography>
                <Typography variant="body1">
                  <strong>PO Number:</strong> {purchaseOrder.poNumber}
                </Typography>
                <Typography variant="body1">
                  <strong>Date:</strong> {new Date(purchaseOrder.poDate).toLocaleDateString()}
                </Typography>
                <Typography variant="body1">
                  <strong>Supplier:</strong> {purchaseOrder.supplierName}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Order Summary
                </Typography>
                <Typography variant="body1">
                  <strong>Total Items:</strong> {verifiedItems.length}
                </Typography>
                <Typography variant="body1">
                  <strong>Total Amount:</strong> ₹{purchaseOrder.totalAmount?.toFixed(2)}
                </Typography>
                <Chip
                  label={purchaseOrder.isConverted ? 'Converted' : 'Pending'}
                  color={purchaseOrder.isConverted ? 'success' : 'warning'}
                  size="small"
                />
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Verify Received Items
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setAddItemDialogOpen(true)}
                size="small"
              >
                Add Item
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableCell>Item</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell align="right">Ordered Qty</TableCell>
                    <TableCell align="right">Received Qty</TableCell>
                    <TableCell align="right">Difference</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {verifiedItems.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {item.itemName}
                          {item.isAdditional && (
                            <Chip
                              label="Extra"
                              color="primary"
                              size="small"
                              sx={{ ml: 1, height: 18, fontSize: '0.6rem' }}
                            />
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.itemCode}</TableCell>
                      <TableCell align="right">{item.quantity || 0}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          size="small"
                          value={item.receivedQuantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          InputProps={{
                            inputProps: { min: 0 },
                          }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          color={item.difference > 0 ? 'warning.main' : 'success.main'}
                          fontWeight={item.difference !== 0 ? 'bold' : 'normal'}
                        >
                          {item.difference > 0 ? '+' : ''}{item.difference}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={item.verified ? <CheckCircle /> : <Warning />}
                          label={item.verified ? 'Verified' : 'Pending'}
                          color={item.verified ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {item.isAdditional && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
              <Button
                variant="outlined"
                startIcon={<Cancel />}
                onClick={handleReset}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSubmit}
                disabled={submitting || !verifiedItems.every(item => item.verified)}
              >
                {submitting ? 'Processing...' : 'Verify & Create Invoice'}
              </Button>
            </Box>
          </Paper>
        </>
      )}

      {/* Add Item Dialog */}
      <Dialog open={addItemDialogOpen} onClose={() => setAddItemDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Additional Item</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Select Item</InputLabel>
              <Select
                value={selectedItem?.id || ''}
                onChange={(e) => {
                  const item = items.find(i => i.id === e.target.value);
                  setSelectedItem(item);
                  setAdditionalUnitPrice(item?.purchasePrice || 0);
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
              fullWidth
              label="Quantity"
              type="number"
              value={additionalQuantity}
              onChange={(e) => setAdditionalQuantity(parseInt(e.target.value) || 1)}
              sx={{ mb: 2 }}
              InputProps={{ inputProps: { min: 1 } }}
            />
            <TextField
              fullWidth
              label="Unit Price"
              type="number"
              value={additionalUnitPrice}
              onChange={(e) => setAdditionalUnitPrice(parseFloat(e.target.value) || 0)}
              InputProps={{ startAdornment: '₹' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddItemDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddItem}
            variant="contained"
            startIcon={<Add />}
            disabled={!selectedItem || additionalQuantity <= 0 || additionalUnitPrice <= 0}
          >
            Add Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onClose={() => setSuccessDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle color="success" />
            <Typography variant="h6">GRN Verified Successfully</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            Purchase order has been converted to purchase invoice!
          </Alert>
          <Box sx={{ bgcolor: '#f5f7fa', p: 2, borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>PO Number:</strong> {purchaseOrder?.poNumber}
            </Typography>
            <Typography variant="body2">
              <strong>Status:</strong> Converted to Invoice
            </Typography>
            <Typography variant="body2">
              <strong>Total Items:</strong> {verifiedItems.length}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuccessDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setSuccessDialogOpen(false);
              handleReset();
            }}
          >
            New Verification
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GRNVerification;