import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Tabs,
  Tab,
  Alert,
  LinearProgress as MuiLinearProgress,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Inventory,
  Refresh,
  Warning,
  CheckCircle,
  Category,
  LocalOffer,
  Straighten,
  Visibility,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { itemService } from '../../services/itemService';

const ItemList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);

  // Check URL parameters on mount and when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const filterParam = params.get('filter');
    
    console.log('📋 URL Params - tab:', tabParam, 'filter:', filterParam);
    
    if (tabParam === 'low-stock' || filterParam === 'low-stock') {
      setTabValue(1);
      // Fetch low stock items after setting tab
      setTimeout(() => fetchLowStockItems(), 100);
    } else {
      setTabValue(0);
      fetchItems();
    }
  }, [location.search]);

  useEffect(() => {
    // Only fetch if not triggered by URL change
    if (tabValue === 0 && !location.search.includes('low-stock')) {
      fetchItems();
    }
  }, [page, rowsPerPage]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await itemService.getAll(page, rowsPerPage, search);
      setItems(data.content || []);
      setTotalElements(data.totalElements || 0);
      console.log('📦 Items loaded:', data.content?.length || 0);
    } catch (error) {
      console.error('❌ Fetch error:', error);
      setError('Failed to fetch items');
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 Fetching low stock and out of stock items...');
      
      // Fetch all items
      const allItems = await itemService.getAll(0, 1000);
      const itemsArray = allItems.content || [];
      
      console.log('📦 Total items:', itemsArray.length);
      
      // Filter: Low Stock AND Out of Stock
      const lowAndOutOfStock = itemsArray.filter(item => {
        const currentStock = item.currentStock || 0;
        const reorderLevel = item.reorderLevel || 0;
        const minStockLevel = item.minStockLevel || 0;
        
        return currentStock <= 0 || 
               (reorderLevel > 0 && currentStock <= reorderLevel) || 
               (minStockLevel > 0 && currentStock <= minStockLevel);
      });
      
      console.log('📦 Low/Out of Stock items:', lowAndOutOfStock.length);
      
      setLowStockItems(lowAndOutOfStock);
      setItems(lowAndOutOfStock);
      setTotalElements(lowAndOutOfStock.length);
      
      if (lowAndOutOfStock.length === 0) {
        console.log('ℹ️ No low stock or out of stock items found');
      }
    } catch (error) {
      console.error('❌ Error fetching low stock items:', error);
      setError('Failed to fetch low stock items');
      toast.error('Failed to fetch low stock items');
      setLowStockItems([]);
      setItems([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(0);
    
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      if (tabValue === 1) {
        const filtered = lowStockItems.filter(item => 
          item.name?.toLowerCase().includes(value.toLowerCase()) ||
          item.code?.toLowerCase().includes(value.toLowerCase())
        );
        setItems(filtered);
        setTotalElements(filtered.length);
      } else {
        fetchItems();
      }
    }, 500);
    setSearchTimeout(timeout);
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await itemService.delete(selectedItem.id);
      toast.success(`Item "${selectedItem.name}" deleted successfully`);
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      if (tabValue === 1) {
        await fetchLowStockItems();
      } else {
        await fetchItems();
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (item) => {
    setSelectedItem(item);
    setDeleteDialogOpen(true);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
    setSearch('');
    setError('');
    
    // Update URL when tab changes
    if (newValue === 1) {
      navigate('/items?tab=low-stock', { replace: true });
      fetchLowStockItems();
    } else {
      navigate('/items', { replace: true });
      fetchItems();
    }
  };

  const getStockStatus = (item) => {
    const currentStock = item.currentStock || 0;
    const minStock = item.minStockLevel || 0;
    const reorderLevel = item.reorderLevel || 0;
    
    if (currentStock <= 0) {
      return { label: 'Out of Stock', color: 'error', icon: <Warning sx={{ fontSize: 16 }} /> };
    }
    if (reorderLevel > 0 && currentStock <= reorderLevel) {
      return { label: 'Low Stock', color: 'warning', icon: <Warning sx={{ fontSize: 16 }} /> };
    }
    if (minStock > 0 && currentStock <= minStock) {
      return { label: 'Critical', color: 'warning', icon: <Warning sx={{ fontSize: 16 }} /> };
    }
    return { label: 'In Stock', color: 'success', icon: <CheckCircle sx={{ fontSize: 16 }} /> };
  };

  const getStockLevelColor = (currentStock, minLevel, maxLevel) => {
    if (!maxLevel || maxLevel === 0) {
      if (currentStock <= 0) return 'error';
      if (currentStock <= (minLevel || 5)) return 'warning';
      return 'success';
    }
    const percentage = (currentStock / maxLevel) * 100;
    if (percentage <= 25) return 'error';
    if (percentage <= 50) return 'warning';
    return 'success';
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

  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00';
    return `₹${amount.toFixed(2)}`;
  };

  const renderStockBar = (item) => {
    const currentStock = item.currentStock || 0;
    const maxStock = item.maxStockLevel || 100;
    const percentage = Math.min((currentStock / maxStock) * 100, 100);
    
    return (
      <Box sx={{ width: '100%', minWidth: 100 }}>
        <MuiLinearProgress
          variant="determinate"
          value={percentage}
          color={getStockLevelColor(currentStock, item.minStockLevel, maxStock)}
          sx={{ height: 8, borderRadius: 4 }}
        />
        <Typography variant="caption" color="textSecondary">
          {currentStock} / {maxStock}
        </Typography>
      </Box>
    );
  };

  const getStockSummary = () => {
    const outOfStock = lowStockItems.filter(item => (item.currentStock || 0) <= 0).length;
    const lowStock = lowStockItems.filter(item => {
      const currentStock = item.currentStock || 0;
      return currentStock > 0 && (currentStock <= (item.reorderLevel || 0) || currentStock <= (item.minStockLevel || 0));
    }).length;
    return { outOfStock, lowStock };
  };

  const displayItems = tabValue === 1 ? lowStockItems : items;
  const stockSummary = tabValue === 1 ? getStockSummary() : null;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Items
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {tabValue === 1 
              ? `View items that need restocking (${stockSummary?.outOfStock || 0} Out of Stock, ${stockSummary?.lowStock || 0} Low Stock)` 
              : 'Manage your product inventory'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/items/new')}
          sx={{ borderRadius: 2 }}
        >
          Add Item
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {tabValue === 1 && lowStockItems.length > 0 && (
        <Box display="flex" gap={2} mb={2}>
          <Chip
            label={`Out of Stock: ${stockSummary?.outOfStock || 0}`}
            color="error"
            icon={<Warning />}
          />
          <Chip
            label={`Low Stock: ${stockSummary?.lowStock || 0}`}
            color="warning"
            icon={<Warning />}
          />
          <Chip
            label={`Total: ${lowStockItems.length}`}
            color="info"
            icon={<Inventory />}
          />
        </Box>
      )}

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="All Items" icon={<Inventory />} iconPosition="start" />
        <Tab 
          label="Low Stock" 
          icon={<Warning />} 
          iconPosition="start" 
          sx={{ 
            '&.Mui-selected': { 
              color: '#ed6c02' 
            } 
          }}
        />
        <Tab label="Brands" icon={<Category />} iconPosition="start" onClick={() => navigate('/items/brands')} />
        <Tab label="Groups" icon={<Category />} iconPosition="start" onClick={() => navigate('/items/groups')} />
        <Tab label="Sections" icon={<Category />} iconPosition="start" onClick={() => navigate('/items/sections')} />
        <Tab label="Units" icon={<Straighten />} iconPosition="start" onClick={() => navigate('/items/units')} />
        <Tab label="Taxes" icon={<LocalOffer />} iconPosition="start" onClick={() => navigate('/items/taxes')} />
      </Tabs>

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <TextField
            placeholder={tabValue === 1 ? "Search low stock items..." : "Search items by name or code..."}
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
            onClick={() => {
              if (tabValue === 1) {
                fetchLowStockItems();
              } else {
                fetchItems();
              }
            }}
            size="medium"
          >
            Refresh
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ width: '100%', py: 4 }}>
            <LinearProgress />
            <Typography textAlign="center" sx={{ mt: 2 }} color="textSecondary">
              {tabValue === 1 ? 'Loading low stock items...' : 'Loading items...'}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableCell>#</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Brand</TableCell>
                    <TableCell>Group</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell>Stock</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {!displayItems || displayItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="textSecondary">
                          {tabValue === 1 
                            ? 'No low stock or out of stock items found. All items have sufficient stock.' 
                            : search 
                              ? `No items found matching "${search}"` 
                              : 'No items found. Click "Add Item" to create one.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayItems.map((item, index) => {
                      const stockStatus = getStockStatus(item);
                      return (
                        <TableRow key={item.id} hover>
                          <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.code}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Inventory sx={{ color: '#1976d2', fontSize: 20 }} />
                              <Box>
                                <Typography fontWeight={500}>{item.name}</Typography>
                                {isNewItem(item.createdAt) && (
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
                          <TableCell>{item.brandName || '-'}</TableCell>
                          <TableCell>{item.groupName || '-'}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight={500}>
                              {formatCurrency(item.sellingPrice)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {renderStockBar(item)}
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={stockStatus.icon}
                              label={stockStatus.label}
                              color={stockStatus.color}
                              size="small"
                              sx={{ fontWeight: 500 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(item.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => navigate(`/items/${item.id}`)}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => navigate(`/items/edit/${item.id}`)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => openDeleteDialog(item)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Item</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete item "{selectedItem?.name}"?
            This action cannot be undone.
          </DialogContentText>
          <Box mt={2} p={2} bgcolor="#f5f7fa" borderRadius={1}>
            <Typography variant="body2">
              <strong>Code:</strong> {selectedItem?.code}
            </Typography>
            <Typography variant="body2">
              <strong>Current Stock:</strong> {selectedItem?.currentStock}
            </Typography>
            <Typography variant="body2">
              <strong>Price:</strong> {formatCurrency(selectedItem?.sellingPrice)}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            startIcon={<Delete />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ItemList;