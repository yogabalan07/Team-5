import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Alert,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Visibility,
  Print,
  Refresh,
  FilterList,
  Clear,
  LocalShipping,
  CheckCircle,
  Pending,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { purchaseService } from '../../services/purchaseService';
import { supplierService } from '../../services/supplierService';

const PurchaseOrderList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [filters, setFilters] = useState({
    supplierId: '',
    startDate: '',
    endDate: '',
    isConverted: '',
  });
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
  }, [page, rowsPerPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Fetching purchase orders...');
      
      let data;
      if (search) {
        data = await purchaseService.searchOrders(search, page, rowsPerPage);
      } else if (filters.startDate && filters.endDate) {
        data = await purchaseService.getOrdersByDateRange(
          filters.startDate, 
          filters.endDate, 
          page, 
          rowsPerPage
        );
      } else if (filters.supplierId) {
        data = await purchaseService.getOrdersBySupplier(
          filters.supplierId, 
          page, 
          rowsPerPage
        );
      } else {
        data = await purchaseService.getAllOrders(page, rowsPerPage);
      }
      
      setOrders(data.content || []);
      setTotalElements(data.totalElements || 0);
      console.log('✅ Orders loaded:', data.content?.length || 0);
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setError('Failed to fetch purchase orders');
      toast.error('Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await supplierService.getAll(0, 1000);
      setSuppliers(data.content || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(0);
    
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      fetchOrders();
    }, 500);
    setSearchTimeout(timeout);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await purchaseService.deleteOrder(selectedOrder.id);
      toast.success('Purchase order deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
      await fetchOrders();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete order');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async (order) => {
    try {
      setLoading(true);
      await purchaseService.convertOrderToInvoice(order.id);
      toast.success(`Purchase Order ${order.poNumber} converted to invoice successfully!`);
      await fetchOrders();
    } catch (error) {
      console.error('Convert error:', error);
      toast.error(error.response?.data?.error || 'Failed to convert order');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (order) => {
    window.printOrderData = order;
    window.open(`/purchases/print-order/${order.id}`, '_blank');
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const applyFilters = () => {
    setPage(0);
    fetchOrders();
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      supplierId: '',
      startDate: '',
      endDate: '',
      isConverted: '',
    });
    setPage(0);
    setTimeout(fetchOrders, 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusChip = (order) => {
    if (order.isConverted) {
      return (
        <Chip
          icon={<CheckCircle />}
          label="Converted"
          color="success"
          size="small"
          sx={{ fontWeight: 500 }}
        />
      );
    }
    return (
      <Chip
        icon={<Pending />}
        label="Pending"
        color="warning"
        size="small"
        sx={{ fontWeight: 500 }}
      />
    );
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Purchase Orders
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View and manage all purchase orders
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/purchases/order')}
          sx={{ borderRadius: 2 }}
        >
          New Purchase Order
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Box display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
          <TextField
            placeholder="Search by PO number or supplier..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 200 }}
            size="small"
          />
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setFilterOpen(!filterOpen)}
            color={Object.values(filters).some(v => v) ? 'primary' : 'inherit'}
          >
            Filter
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchOrders}
            size="medium"
          >
            Refresh
          </Button>
        </Box>

        {/* Filter Section */}
        {filterOpen && (
          <Box sx={{ p: 2, bgcolor: '#f5f7fa', borderRadius: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Supplier</InputLabel>
                  <Select
                    name="supplierId"
                    value={filters.supplierId}
                    onChange={handleFilterChange}
                    label="Supplier"
                  >
                    <MenuItem value="">All Suppliers</MenuItem>
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Start Date"
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="End Date"
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="isConverted"
                    value={filters.isConverted}
                    onChange={handleFilterChange}
                    label="Status"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="false">Pending</MenuItem>
                    <MenuItem value="true">Converted</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box display="flex" gap={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={applyFilters}
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Clear />}
                    onClick={clearFilters}
                  >
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}

        {loading ? (
          <Box sx={{ width: '100%', py: 4 }}>
            <LinearProgress />
            <Typography textAlign="center" sx={{ mt: 2 }} color="textSecondary">
              Loading purchase orders...
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableCell>PO Number</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="textSecondary">
                          No purchase orders found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id} hover className="table-row-hover">
                        <TableCell>
                          <Typography fontWeight={500}>
                            {order.poNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(order.poDate)}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocalShipping sx={{ color: '#1976d2', fontSize: 16 }} />
                            <Typography variant="body2">
                              {order.supplierName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600} color="primary">
                            ₹{order.totalAmount?.toFixed(2) || '0.00'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(order)}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/purchases/edit-order/${order.id}`)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => navigate(`/purchases/order/${order.id}`)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          {!order.isConverted && (
                            <Tooltip title="Convert to Invoice">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleConvert(order)}
                              >
                                <CheckCircle />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Print">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handlePrint(order)}
                            >
                              <Print />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedOrder(order);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalElements}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Purchase Order</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete purchase order "{selectedOrder?.poNumber}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            startIcon={<Delete />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseOrderList;