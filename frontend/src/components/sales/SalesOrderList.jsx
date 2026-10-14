// src/components/sales/SalesOrderList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  LocalShipping as DeliveryIcon,
  Receipt as InvoiceIcon,
  CheckCircle as AvailableIcon,
  Cancel as ShortageIcon,
  Inventory as StockIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import salesService from '../../services/salesService';
import Pagination from '../common/Pagination';

const STATUS_COLORS = {
  DRAFT: 'default',
  CONFIRMED: 'info',
  PROCESSING: 'warning',
  DISPATCHED: 'primary',
  DELIVERED: 'secondary',
  INVOICED: 'success',
  CANCELLED: 'error',
};

const SalesOrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const rowsPerPage = 10;

  // Stock check modal state
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [checkingStock, setCheckingStock] = useState(false);
  const [stockResults, setStockResults] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await salesService.getOrders(page, rowsPerPage, searchTerm);
      setOrders(res.content || []);
      setTotalPages(res.totalPages || 1);
      setTotalElements(res.totalElements || 0);
    } catch (err) {
      toast.error('Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleCheckStock = async (order) => {
    setSelectedOrder(order);
    setStockModalOpen(true);
    setCheckingStock(true);
    try {
      const res = await salesService.checkStockAvailability(order.items || []);
      setStockResults(res);
    } catch (err) {
      toast.error('Could not verify stock availability');
    } finally {
      setCheckingStock(false);
    }
  };

  const handleConvertToInvoice = (order) => {
    navigate('/sales/entry', {
      state: {
        fromOrder: true,
        salesOrderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        shippingAddress: order.shippingAddress,
        items: order.items,
        freightCharges: order.freightCharges,
        salespersonId: order.salespersonId,
        salespersonName: order.salespersonName,
      },
    });
  };

  const handleCreateDelivery = (order) => {
    navigate('/sales/deliveries', {
      state: {
        newDelivery: true,
        salesOrderId: order.id,
        orderNumber: order.orderNumber,
        customerId: order.customerId,
        customerName: order.customerName,
        shippingAddress: order.shippingAddress,
        items: order.items,
      },
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h5" fontWeight="bold">
            Sales Orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage customer purchase orders, verify warehouse inventory, and dispatch deliveries.
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchOrders}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/sales/orders/new')}
          >
            Create Sales Order
          </Button>
        </Box>
      </Box>

      {/* Filter and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ pb: '16px !important' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by order #, customer, phone..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <TableContainer component={Paper} elevation={0}>
          <Table>
            <TableHead sx={{ backgroundColor: 'grey.100' }}>
              <TableRow>
                <TableCell><strong>Order #</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Customer</strong></TableCell>
                <TableCell><strong>Delivery Due</strong></TableCell>
                <TableCell align="right"><strong>Items</strong></TableCell>
                <TableCell align="right"><strong>Grand Total</strong></TableCell>
                <TableCell align="center"><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No sales orders found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {order.orderNumber}
                      </Typography>
                      {order.quotationNumber && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Ref: {order.quotationNumber}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{order.orderDate}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {order.customerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.customerPhone}
                      </Typography>
                    </TableCell>
                    <TableCell>{order.expectedDeliveryDate || 'Immediate'}</TableCell>
                    <TableCell align="right">{(order.items || []).length} lines</TableCell>
                    <TableCell align="right">
                      <strong>₹{(Number(order.grandTotal) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={order.status || 'CONFIRMED'}
                        color={STATUS_COLORS[order.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <Tooltip title="Check Stock Availability">
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => handleCheckStock(order)}
                          >
                            <StockIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Create Delivery Note">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleCreateDelivery(order)}
                          >
                            <DeliveryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Convert to Sales Invoice">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleConvertToInvoice(order)}
                          >
                            <InvoiceIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Order">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/sales/orders/edit/${order.id}`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalElements={totalElements}
          rowsPerPage={rowsPerPage}
          onPageChange={(p) => setPage(p)}
        />
      </Card>

      {/* Stock Availability Dialog */}
      <Dialog
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Stock Availability Check: {selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent dividers>
          {checkingStock ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : stockResults ? (
            <Box>
              {stockResults.allAvailable ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  All items are available in warehouse inventory. Ready for dispatch!
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Some items have stock shortages. Please replenish inventory before fulfilling.
                </Alert>
              )}

              <List>
                {stockResults.items.map((item, idx) => (
                  <ListItem key={idx} divider>
                    <ListItemIcon>
                      {item.isAvailable ? (
                        <AvailableIcon color="success" />
                      ) : (
                        <ShortageIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {item.itemName} ({item.itemCode || 'No SKU'})
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            color={item.isAvailable ? 'success.main' : 'error.main'}
                          >
                            {item.isAvailable ? 'IN STOCK' : `SHORTAGE: ${item.shortage}`}
                          </Typography>
                        </Box>
                      }
                      secondary={`Required: ${item.requestedQuantity} | Available in Warehouse: ${item.currentStock}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStockModalOpen(false)}>Close</Button>
          {stockResults?.allAvailable && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setStockModalOpen(false);
                if (selectedOrder) handleCreateDelivery(selectedOrder);
              }}
            >
              Proceed to Dispatch
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesOrderList;
