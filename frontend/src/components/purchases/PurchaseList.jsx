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
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { purchaseService } from '../../services/purchaseService';
import { supplierService } from '../../services/supplierService';

const PurchaseList = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [error, setError] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [filters, setFilters] = useState({
    supplierId: '',
    paymentType: '',
    startDate: '',
    endDate: '',
    dateType: 'INVOICE_DATE',
  });
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
  }, [page, rowsPerPage]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Fetching purchase invoices...');
      
      let data;
      if (search) {
        data = await purchaseService.search(search, page, rowsPerPage);
      } else if (filters.startDate && filters.endDate) {
        data = await purchaseService.getInvoicesByDateRange(
          filters.startDate, 
          filters.endDate,
          filters.dateType,
          page, 
          rowsPerPage
        );
      } else if (filters.supplierId) {
        data = await purchaseService.getInvoicesBySupplier(
          filters.supplierId, 
          page, 
          rowsPerPage
        );
      } else {
        data = await purchaseService.getAllInvoices(page, rowsPerPage);
      }
      
      setPurchases(data.content || []);
      setTotalElements(data.totalElements || 0);
      console.log('✅ Purchase invoices loaded:', data.content?.length || 0);
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setError('Failed to fetch purchase invoices');
      toast.error('Failed to fetch purchase invoices');
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
      fetchPurchases();
    }, 500);
    setSearchTimeout(timeout);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await purchaseService.deleteInvoice(selectedPurchase.id);
      toast.success('Purchase invoice deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedPurchase(null);
      await fetchPurchases();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = (purchase) => {
    window.printPurchaseData = purchase;
    window.open(`/purchases/print/${purchase.id}`, '_blank');
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const applyFilters = () => {
    setPage(0);
    fetchPurchases();
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      supplierId: '',
      paymentType: '',
      startDate: '',
      endDate: '',
      dateType: 'INVOICE_DATE',
    });
    setPage(0);
    setTimeout(fetchPurchases, 100);
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

  const getStatusChip = (purchase) => {
    if (purchase.isReturned) {
      return <Chip label="Returned" color="error" size="small" />;
    }
    if (purchase.balanceAmount > 0) {
      return <Chip label="Pending" color="warning" size="small" />;
    }
    return <Chip label="Paid" color="success" size="small" />;
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Purchase Invoices
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View and manage all purchase invoices
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/purchases/entry')}
          sx={{ borderRadius: 2 }}
        >
          New Purchase
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
            placeholder="Search by invoice no or supplier..."
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
            color={Object.values(filters).some(v => v && v !== 'INVOICE_DATE') ? 'primary' : 'inherit'}
          >
            Filter
          </Button>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchPurchases}
            size="medium"
          >
            Refresh
          </Button>
        </Box>

        {/* Filter Section */}
        {filterOpen && (
          <Box sx={{ p: 2, bgcolor: '#f5f7fa', borderRadius: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={2}>
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
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Date Type</InputLabel>
                  <Select
                    name="dateType"
                    value={filters.dateType}
                    onChange={handleFilterChange}
                    label="Date Type"
                  >
                    <MenuItem value="INVOICE_DATE">Invoice Date</MenuItem>
                    <MenuItem value="RECEIVED_DATE">Received Date</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Box display="flex" gap={1}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={applyFilters}
                  >
                    Apply
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
              Loading purchase invoices...
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableCell>Invoice No</TableCell>
                    <TableCell>Invoice Date</TableCell>
                    <TableCell>Received Date</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Net Amount</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="textSecondary">
                          No purchase invoices found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchases.map((purchase) => (
                      <TableRow key={purchase.id} hover className="table-row-hover">
                        <TableCell>
                          <Typography fontWeight={500}>
                            {purchase.invoiceNo}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(purchase.invoiceDate)}</TableCell>
                        <TableCell>{purchase.receivedDate ? formatDate(purchase.receivedDate) : '-'}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocalShipping sx={{ color: '#1976d2', fontSize: 16 }} />
                            <Typography variant="body2">
                              {purchase.supplierName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography fontWeight={600} color="primary">
                            ₹{purchase.netAmount?.toFixed(2) || '0.00'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {getPaymentTypeChip(purchase.paymentType)}
                        </TableCell>
                        <TableCell>
                          {getStatusChip(purchase)}
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/purchases/edit/${purchase.id}`)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => navigate(`/purchases/invoice/${purchase.id}`)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Print">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handlePrint(purchase)}
                            >
                              <Print />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setSelectedPurchase(purchase);
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
        <DialogTitle>Delete Purchase Invoice</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete purchase invoice "{selectedPurchase?.invoiceNo}"?
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

export default PurchaseList;