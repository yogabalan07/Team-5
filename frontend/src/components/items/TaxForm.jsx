import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { toast } from 'react-toastify';
import { taxService } from '../../services/taxService';

const TaxForm = ({ open, onClose, tax, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    taxPercentage: 0,
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tax) {
      setFormData({
        name: tax.name || '',
        taxPercentage: tax.taxPercentage || 0,
        isActive: tax.isActive !== undefined ? tax.isActive : true,
      });
    } else {
      setFormData({
        name: '',
        taxPercentage: 0,
        isActive: true,
      });
    }
  }, [tax, open]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'isActive' ? checked : (name === 'taxPercentage' ? parseFloat(value) || 0 : value),
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Tax name is required');
      return;
    }
    if (formData.taxPercentage < 0) {
      setError('Tax percentage must be greater than or equal to 0');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (tax) {
        await taxService.update(tax.id, formData);
        toast.success('Tax updated successfully');
      } else {
        await taxService.create(formData);
        toast.success('Tax created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save tax');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {tax ? 'Edit Tax' : 'Add New Tax'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Tax Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Tax Percentage"
            name="taxPercentage"
            type="number"
            value={formData.taxPercentage}
            onChange={handleChange}
            required
            InputProps={{ endAdornment: '%' }}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                color="primary"
              />
            }
            label="Active"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : (tax ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TaxForm;