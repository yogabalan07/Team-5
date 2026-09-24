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
  Chip,
  LinearProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { categoryService } from '../../services/categoryService';
import CategoryForm from './CategoryForm';
import ConfirmDialog from '../common/ConfirmDialog';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryService.getAll();
      setCategories(data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setFormOpen(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormOpen(true);
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    try {
      await categoryService.delete(categoryToDelete.id);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete category');
    } finally {
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const term = searchTerm.toLowerCase();
    return (
      (cat.name && cat.name.toLowerCase().includes(term)) ||
      (cat.description && cat.description.toLowerCase().includes(term))
    );
  });

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <CategoryIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Product Categories
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage product classification and hierarchy
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          sx={{ borderRadius: 2 }}
        >
          Add Category
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search categories by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Category Name</strong></TableCell>
              <TableCell><strong>Description</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <TableRow key={category.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="600">
                      {category.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {category.description || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={category.isActive !== false ? 'Active' : 'Inactive'}
                      color={category.isActive !== false ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEdit(category)}
                      title="Edit"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(category)}
                      title="Delete"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <Typography color="textSecondary">
                    {loading ? 'Loading categories...' : 'No categories found'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <CategoryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        category={selectedCategory}
        onSuccess={fetchCategories}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Category"
        message={`Are you sure you want to delete category "${categoryToDelete?.name}"?`}
      />
    </Box>
  );
};

export default CategoryList;
