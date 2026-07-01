import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Save, Cancel, LocalShipping } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { supplierService } from '../../services/supplierService';

const SupplierForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstNo: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchSupplier();
    }
  }, [id]);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getById(id);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        gstNo: data.gstNo || '',
      });
    } catch (error) {
      toast.error('Failed to fetch supplier details');
      navigate('/suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.phone) {
      setError('Name and Phone are required');
      return;
    }

    try {
      setLoading(true);
      if (isEdit) {
        await supplierService.update(id, formData);
        toast.success('Supplier updated successfully');
      } else {
        await supplierService.create(formData);
        toast.success('Supplier created successfully');
      }
      navigate('/suppliers');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <LocalShipping sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {isEdit ? 'Edit Supplier' : 'Add New Supplier'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {isEdit ? 'Update supplier information' : 'Create a new supplier in the system'}
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Supplier Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter supplier name"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="Enter phone number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="GST Number"
                name="gstNo"
                value={formData.gstNo}
                onChange={handleChange}
                placeholder="Enter GST number"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                multiline
                rows={2}
                placeholder="Enter full address"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={() => navigate('/suppliers')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={loading}
            >
              {loading ? 'Saving...' : isEdit ? 'Update Supplier' : 'Create Supplier'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default SupplierForm;