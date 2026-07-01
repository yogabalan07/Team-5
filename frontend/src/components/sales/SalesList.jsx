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
  Print,
  Refresh,
  FilterList,
  Clear,
  Receipt,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { salesService } from '../../services/salesService';
import { customerService } from '../../services/customerService';

const SalesList = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [error, setError] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [filters, setFilters] = useState({
    customerId: '',
    paymentType: '',
    startDate: '',
    endDate: '',
  });
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    fetchSales();
    fetchCustomers();
  }, [page, rowsPerPage]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Fetching sales...');
      
      let data;
      if (search) {
        data = await salesService.search(search, page, rowsPerPage);
      } else if (filters.startDate && filters.endDate) {
        data = await salesService.getInvoicesByDateRange(
          filters.startDate, 
          filters.endDate, 
          page, 
          rowsPerPage
        );
      } else if (filters.customerId) {
        data = await salesService.getInvoicesByCustomer(
          filters.customerId, 
          page, 
          rowsPerPage
        );
      } else {
        data = await salesService.getAllInvoices(page, rowsPerPage);
      }
      
      setSales(data.content || []);
      setTotalElements(data.totalElements || 0);
      console.log('✅ Sales loaded:', data.content?.length || 0);
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setError('Failed to fetch sales');
      toast.error('Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await customerService.getAll(0, 1000);
      setCustomers(data.content || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(0);
    
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      fetchSales();
    }, 500);
    setSearchTimeout(timeout);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await salesService.deleteInvoice(selectedSale.id);
      toast.success('Sales invoice deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedSale(null);
      await fetchSales();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const applyFilters = () => {
    setPage(0);
    fetchSales();
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      customerId: '',
      paymentType: '',
      startDate: '',
      endDate: '',
    });
    setPage(0);
    setTimeout(fetchSales, 100);
  };

  const handlePrint = (sale) => {
  // Open print page with invoice ID
  if (sale && sale.id) {
    window.open(`/sales/print/${sale.id}`, '_blank');
  } else {
    toast.error('No invoice data to print');
  }
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

  const getPaymentTypeChip = (type) => {
    const colors = {
      'CASH': 'success',
      'CREDIT': 'warning',
    };
    return (
      <Chip
        label={type}
        color={colors[type] || 'default'}
        size="small"
        sx={{ fontWeight: 500 }}
      />
    );
  };

  const getStatusChip = (sale) => {
    if (sale.isReturned) {
      return <Chip label="Returned" color="error" size="small" />;
    }
    if (sale.balanceAmount > 0) {
      return <Chip label="Pending" color="warning" size="small" />;
    }
    return <Chip label="Paid" color="success" size="small" />;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Sales Invoices
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View and manage all sales invoices
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/sales/entry')}
          sx={{ borderRadius: 2 }}
        >
          New Sale
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
            placeholder="Search by invoice no or customer..."
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
            onClick={fetchSales}
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
                  <InputLabel>Customer</InputLabel>
                  <Select
                    name="customerId"
                    value={filters.customerId}
                    onChange={handleFilterChange}
                    label="Customer"
                  >
                    <MenuItem value="">All Customers</MenuItem>
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payment Type</InputLabel>
                  <Select
                    name="paymentType"
                    value={filters.paymentType}
                    onChange={handleFilterChange}
                    label="Payment Type"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="CASH">Cash</MenuItem>
                    <MenuItem value="CREDIT">Credit</MenuItem>
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
              Loading sales invoices...
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableCell>Invoice No</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell align="right">Net Amount</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="textSecondary">
                          No sales invoices found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => (
                      <TableRow key={sale.id} hover className="table-row-hover">
                        <TableCell>
                          <Typography fontWeight={500}>
                            {sale.invoiceNo}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(sale.invoiceDate)}</TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {sale.customerName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {sale.customerPhone}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600} color="primary">
                            ₹{sale.netAmount?.toFixed(2) || '0.00'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getPaymentTypeChip(sale.paymentType)}
                        </TableCell>
                        <TableCell>
                          {getStatusChip(sale)}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit Invoice">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/sales/edit/${sale.id}`)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print Invoice">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handlePrint(sale)}
                            >
                              <Print />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedSale(sale);
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
        <DialogTitle>Delete Sales Invoice</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete sales invoice "{selectedSale?.invoiceNo}"?
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

export default SalesList;