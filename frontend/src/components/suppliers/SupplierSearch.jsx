import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Search, Close, Business } from '@mui/icons-material';
import { supplierService } from '../../services/supplierService';

const SupplierSearch = ({ open, onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    if (open && search) {
      handleSearch();
    }
  }, [search]);

  const handleSearch = async () => {
    if (!search.trim()) {
      setSuppliers([]);
      return;
    }

    setLoading(true);
    try {
      const data = await supplierService.search(search, 0, 20);
      setSuppliers(data.content || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (supplier) => {
    onSelect(supplier);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Search Suppliers</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        <TextField
          fullWidth
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          sx={{ mt: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : suppliers.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="textSecondary">
              {search ? 'No suppliers found' : 'Type to search for suppliers'}
            </Typography>
          </Box>
        ) : (
          <List>
            {suppliers.map((supplier) => (
              <ListItem
                key={supplier.id}
                button
                onClick={() => handleSelect(supplier)}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: '#1976d2' }}>
                    <Business />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={supplier.name}
                  secondary={
                    <>
                      <Typography variant="body2" component="span">
                        {supplier.phone}
                      </Typography>
                      {supplier.gstNo && (
                        <Typography variant="body2" component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                          • GST: {supplier.gstNo}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SupplierSearch;