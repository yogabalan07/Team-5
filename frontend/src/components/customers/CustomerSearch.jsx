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
import { Search, Close, Person } from '@mui/icons-material';
import { customerService } from '../../services/customerService';

const CustomerSearch = ({ open, onClose, onSelect }) => {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    if (open && search) {
      handleSearch();
    }
  }, [search]);

  const handleSearch = async () => {
    if (!search.trim()) {
      setCustomers([]);
      return;
    }

    setLoading(true);
    try {
      const data = await customerService.search(search, 0, 20);
      setCustomers(data.content || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (customer) => {
    onSelect(customer);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Search Customers</Typography>
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
        ) : customers.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="textSecondary">
              {search ? 'No customers found' : 'Type to search for customers'}
            </Typography>
          </Box>
        ) : (
          <List>
            {customers.map((customer) => (
              <ListItem
                key={customer.id}
                button
                onClick={() => handleSelect(customer)}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: '#1976d2' }}>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={customer.name}
                  secondary={
                    <>
                      <Typography variant="body2" component="span">
                        {customer.phone}
                      </Typography>
                      {customer.area && (
                        <Typography variant="body2" component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                          • {customer.area}
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

export default CustomerSearch;