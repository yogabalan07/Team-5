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
  Card,
  CardContent,
} from '@mui/material';
import { Save, Cancel, PersonAdd, Person } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { customerService } from '../../services/customerService';

const CustomerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    area: '',
    gstNo: '',
    openingBalance: 0,
    creditLimit: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit) {
      fetchCustomer();
    }
  }, [id]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const data = await customerService.getById(id);
      setFormData({
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        area: data.area || '',
        gstNo: data.gstNo || '',
        openingBalance: data.openingBalance || 0,
        creditLimit: data.creditLimit || 0,
      });
    } catch (error) {
      toast.error('Failed to fetch customer details');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'openingBalance' || name === 'creditLimit' 
        ? parseFloat(value) || 0 
        : value,
    });
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
        await customerService.update(id, formData);
        toast.success('Customer updated successfully');
      } else {
        await customerService.create(formData);
        toast.success('Customer created successfully');
      }
      navigate('/customers');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save customer');
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
        <Person sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {isEdit ? 'Edit Customer' : 'Add New Customer'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {isEdit ? 'Update customer information' : 'Create a new customer in the system'}
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
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter customer name"
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Area"
                name="area"
                value={formData.area}
                onChange={handleChange}
                placeholder="Enter area/locality"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Opening Balance"
                name="openingBalance"
                type="number"
                value={formData.openingBalance}
                onChange={handleChange}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Credit Limit"
                name="creditLimit"
                type="number"
                value={formData.creditLimit}
                onChange={handleChange}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={() => navigate('/customers')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={isEdit ? <Save /> : <PersonAdd />}
              disabled={loading}
            >
              {loading ? 'Saving...' : isEdit ? 'Update Customer' : 'Create Customer'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default CustomerForm;