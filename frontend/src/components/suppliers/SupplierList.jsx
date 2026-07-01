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
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Phone,
  Email,
  LocalShipping,
  Refresh,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { supplierService } from '../../services/supplierService';

const SupplierList = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    fetchSuppliers();
  }, [page, rowsPerPage]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getAll(page, rowsPerPage, search);
      setSuppliers(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      toast.error('Failed to fetch suppliers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(0);
    
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      fetchSuppliers();
    }, 500);
    setSearchTimeout(timeout);
  };

  const handleDelete = async () => {
    try {
      await supplierService.delete(selectedSupplier.id);
      toast.success('Supplier deleted successfully');
      setDeleteDialogOpen(false);
      fetchSuppliers();
    } catch (error) {
      toast.error('Failed to delete supplier');
    }
  };

  const openDeleteDialog = (supplier) => {
    setSelectedSupplier(supplier);
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
            Suppliers
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage your supplier database
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/suppliers/new')}
          sx={{ borderRadius: 2 }}
        >
          Add Supplier
        </Button>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <TextField
            placeholder="Search suppliers by name or phone..."
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
            onClick={fetchSuppliers}
            size="medium"
          >
            Refresh
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ width: '100%', py: 4 }}>
            <LinearProgress />
            <Typography textAlign="center" sx={{ mt: 2 }} color="textSecondary">
              Loading suppliers...
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
                    <TableCell>GST No</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {suppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="textSecondary">
                          No suppliers found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    suppliers.map((supplier, index) => (
                      <TableRow key={supplier.id} hover>
                        <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocalShipping sx={{ color: '#1976d2', fontSize: 20 }} />
                            <Box>
                              <Typography fontWeight={500}>{supplier.name}</Typography>
                              {isNewItem(supplier.createdAt) && (
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
                            {supplier.phone}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                            {supplier.email || '-'}
                          </Box>
                        </TableCell>
                        <TableCell>{supplier.gstNo || '-'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontSize="0.75rem">
                            {formatDate(supplier.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={supplier.isActive ? 'Active' : 'Inactive'}
                            color={supplier.isActive ? 'success' : 'error'}
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/suppliers/edit/${supplier.id}`)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => openDeleteDialog(supplier)}
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

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Supplier</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete supplier "{selectedSupplier?.name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SupplierList;