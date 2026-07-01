import React, { useState, useEffect } from 'react';
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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import { Add, Edit, Delete, Category, Refresh } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { brandService } from '../../services/brandService';
import BrandForm from './BrandForm';

const BrandList = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await brandService.getAll();
      setBrands(data);
    } catch (error) {
      setError('Failed to fetch brands');
      toast.error('Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await brandService.delete(selectedBrand.id);
      toast.success('Brand deleted successfully');
      setDeleteDialogOpen(false);
      fetchBrands();
    } catch (error) {
      toast.error('Failed to delete brand');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Brands
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage item brands
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setSelectedBrand(null);
            setFormOpen(true);
          }}
          sx={{ borderRadius: 2 }}
        >
          Add Brand
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchBrands}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ width: '100%', py: 4 }}>
            <LinearProgress />
            <Typography textAlign="center" sx={{ mt: 2 }} color="textSecondary">
              Loading brands...
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {brands.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        No brands found. Click "Add Brand" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  brands.map((brand, index) => (
                    <TableRow key={brand.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Category sx={{ color: '#1976d2', fontSize: 20 }} />
                          <Typography fontWeight={500}>{brand.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{brand.description || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={brand.isActive ? 'Active' : 'Inactive'}
                          color={brand.isActive ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit Brand">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedBrand(brand);
                              setFormOpen(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Brand">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedBrand(brand);
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
        )}
      </Paper>

      <BrandForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedBrand(null);
        }}
        brand={selectedBrand}
        onSuccess={fetchBrands}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Brand</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the brand "{selectedBrand?.name}"?
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

export default BrandList;