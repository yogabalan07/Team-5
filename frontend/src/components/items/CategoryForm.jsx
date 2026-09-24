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
import { categoryService } from '../../services/categoryService';

const CategoryForm = ({ open, onClose, category, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        isActive: category.isActive !== undefined ? category.isActive : true,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        isActive: true,
      });
    }
  }, [category, open]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'isActive' ? checked : value,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (category) {
        await categoryService.update(category.id, formData);
        toast.success('Category updated successfully');
      } else {
        await categoryService.create(formData);
        toast.success('Category created successfully');
      }
      onSuccess();
      onClose();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {category ? 'Edit Category' : 'Add New Category'}
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
            label="Category Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={2}
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
          {loading ? <CircularProgress size={24} /> : (category ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryForm;
