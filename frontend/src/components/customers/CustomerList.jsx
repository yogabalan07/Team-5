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
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Phone,
  Email,
  Person,
  Refresh,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { customerService } from '../../services/customerService';

const CustomerList = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [page, rowsPerPage]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Fetching customers...');
      const data = await customerService.getAll(page, rowsPerPage, search);
      setCustomers(data.content || []);
      setTotalElements(data.totalElements || 0);
      console.log('✅ Customers loaded:', data.content?.length || 0);
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setError('Failed to fetch customers');
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(0);
    
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      fetchCustomers();
    }, 500);
    setSearchTimeout(timeout);
  };

  const handleDelete = async () => {
    console.log('🔴 Delete button clicked!');
    console.log('Selected customer:', selectedCustomer);
    
    if (!selectedCustomer || !selectedCustomer.id) {
      console.error('❌ No customer selected!');
      toast.error('No customer selected');
      return;
    }
    
    try {
      setLoading(true);
      console.log(`🗑️ Attempting to delete customer ID: ${selectedCustomer.id}, Name: ${selectedCustomer.name}`);
      
      const response = await customerService.delete(selectedCustomer.id);
      console.log('✅ Delete response:', response);
      
      toast.success(`Customer "${selectedCustomer.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
      
      // Refresh the list
      console.log('🔄 Refreshing customer list...');
      await fetchCustomers();
      console.log('✅ List refreshed');
      
    } catch (error) {
      console.error('❌ Delete error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      const errorMsg = error.response?.data?.error || 
                      error.response?.data?.message || 
                      error.message ||
                      'Failed to delete customer';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      console.log('🏁 Delete operation complete');
    }
  };

  const openDeleteDialog = (customer) => {
    console.log('🔴 Opening delete dialog for:', customer);
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  };

  const isNewItem = (createdAt) => {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const now = new Date();
    const diffHours = (now - created) / (1000 * 60 * 60);
    return diffHours < 24;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Customers
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your customer database
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/customers/new')}
          sx={{ borderRadius: 2 }}
        >
          Add Customer
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <TextField
            placeholder="Search customers by name or phone..."
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
            startIcon={<Refresh />}
            onClick={fetchCustomers}
            size="medium"
          >
            Refresh
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ width: '100%', py: 4 }}>
            <LinearProgress />
            <Typography textAlign="center" sx={{ mt: 2 }} color="textSecondary">
              Loading customers...
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableCell>#</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Area</TableCell>
                    <TableCell align="right">Credit Limit</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="textSecondary">
                          No customers found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    customers.map((customer, index) => (
                      <TableRow 
                        key={customer.id} 
                        hover
                        className="table-row-hover"
                      >
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Person sx={{ color: '#1976d2', fontSize: 20 }} />
                            <Box>
                              <Typography fontWeight={500}>{customer.name}</Typography>
                              {isNewItem(customer.createdAt) && (
                                <Chip 
                                  label="NEW" 
                                  color="primary" 
                                  size="small" 
                                  sx={{ ml: 1, height: 18, fontSize: '0.6rem' }}
                                />
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Phone sx={{ fontSize: 16, color: 'text.secondary' }} />
                            {customer.phone}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                            {customer.email || '-'}
                          </Box>
                        </TableCell>
                        <TableCell>{customer.area || '-'}</TableCell>
                        <TableCell align="right">₹{customer.creditLimit?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontSize="0.75rem">
                            {formatDate(customer.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={customer.isActive ? 'Active' : 'Inactive'}
                            color={customer.isActive ? 'success' : 'error'}
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/customers/edit/${customer.id}`)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteDialog(customer)}
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
        <DialogTitle>Delete Customer</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete customer "{selectedCustomer?.name}"?
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

export default CustomerList;