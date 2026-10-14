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
import { unitService } from '../../services/unitService';

const UnitForm = ({ open, onClose, unit, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (unit) {
      setFormData({
        name: unit.name || '',
        shortName: unit.shortName || '',
        isActive: unit.isActive !== undefined ? unit.isActive : true,
      });
    } else {
      setFormData({
        name: '',
        shortName: '',
        isActive: true,
      });
    }
  }, [unit, open]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'isActive' ? checked : value,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Unit name is required');
      return;
    }
    if (!formData.shortName.trim()) {
      setError('Short name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (unit) {
        await unitService.update(unit.id, formData);
        toast.success('Unit updated successfully');
      } else {
        await unitService.create(formData);
        toast.success('Unit created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save unit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {unit ? 'Edit Unit' : 'Add New Unit'}
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
            label="Unit Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Short Name"
            name="shortName"
            value={formData.shortName}
            onChange={handleChange}
            required
            placeholder="e.g., Kg, Pcs, Ltr"
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
          {loading ? <CircularProgress size={24} /> : (unit ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UnitForm;