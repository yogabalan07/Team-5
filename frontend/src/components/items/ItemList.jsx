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
  DialogActions,
  LinearProgress,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Category as CategoryIcon,
  LocalOffer,
  Straighten,
  QrCode,
  FileDownload,
  Sell,
  Schedule,
  ContentCopy,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { itemService } from '../../services/itemService';
import { categoryService } from '../../services/categoryService';
import { brandService } from '../../services/brandService';
import ConfirmDialog from '../common/ConfirmDialog';

const ItemList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [brandFilter, setBrandFilter] = useState('ALL');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const [stats, setStats] = useState({
    totalItems: 0,
    stockValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    expiringSoonCount: 0,
  });

  const [barcodeDialog, setBarcodeDialog] = useState({ open: false, item: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });

  useEffect(() => {
    fetchFilterMasters();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'low-stock') {
      setTabValue(1);
    } else if (tabParam === 'out-of-stock') {
      setTabValue(2);
    } else if (tabParam === 'expiring') {
      setTabValue(3);
    } else {
      setTabValue(0);
    }
  }, [location.search]);

  useEffect(() => {
    fetchData();
  }, [page, rowsPerPage, search, tabValue, categoryFilter, brandFilter]);

  const fetchFilterMasters = async () => {
    try {
      const [cats, brs] = await Promise.all([
        categoryService.getAll().catch(() => []),
        brandService.getAll().catch(() => []),
      ]);
      setCategories(cats || []);
      setBrands(brs || []);
    } catch (e) {
      // best effort
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, pagedData] = await Promise.all([
        itemService.getStats().catch(() => ({ totalItems: 0, stockValue: 0, lowStockCount: 0, outOfStockCount: 0, expiringSoonCount: 0 })),
        itemService.getAll(0, 500, search),
      ]);
      setStats(statsData);

      let allContent = pagedData.content || [];

      // Filter by category
      if (categoryFilter !== 'ALL') {
        allContent = allContent.filter((i) => i.categoryId === categoryFilter || i.categoryName === categoryFilter);
      }
      // Filter by brand
      if (brandFilter !== 'ALL') {
        allContent = allContent.filter((i) => i.brandId === brandFilter || i.brandName === brandFilter);
      }

      // Filter by tab
      if (tabValue === 1) {
        // Low Stock
        allContent = allContent.filter((i) => {
          const cur = Number(i.currentStock) || 0;
          const min = Number(i.minStock || i.minimumStock) || 0;
          return cur > 0 && min > 0 && cur <= min * 2;
        });
      } else if (tabValue === 2) {
        // Out of Stock
        allContent = allContent.filter((i) => (Number(i.currentStock) || 0) <= 0);
      } else if (tabValue === 3) {
        // Expiring Soon
        const today = new Date().toISOString().slice(0, 10);
        const next30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        allContent = allContent.filter((i) => i.expiryDate && i.expiryDate >= today && i.expiryDate <= next30);
      }

      setTotalElements(allContent.length);
      const start = page * rowsPerPage;
      setItems(allContent.slice(start, start + rowsPerPage));
    } catch (err) {
      console.error('Fetch items error:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await itemService.exportToExcel({ search });
      toast.success('Product catalog exported successfully');
    } catch (e) {
      toast.error('Export failed');
    }
  };

  const handleDeleteClick = (item) => {
    setDeleteDialog({ open: true, item });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.item) return;
    try {
      await itemService.delete(deleteDialog.item.id);
      toast.success('Product deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete product');
    } finally {
      setDeleteDialog({ open: false, item: null });
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.info(`Copied to clipboard: ${text}`);
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amt || 0);

  return (
    <Box>
      {/* Header & Master Shortcuts */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <Inventory sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              Product & Item Catalog
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Manage inventory master records, barcodes, price tiers, and stock alerts
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button variant="outlined" startIcon={<FileDownload />} onClick={handleExport}>
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/items/new')}
            sx={{ borderRadius: 2 }}
          >
            Add Product
          </Button>
        </Box>
      </Box>

      {/* Master Data Quick Navigation Chips */}
      <Paper sx={{ p: 1.5, mb: 2.5, bgcolor: 'grey.50', display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" fontWeight="600" color="textSecondary" sx={{ mr: 1 }}>
          MASTER DATA:
        </Typography>
        <Chip icon={<CategoryIcon />} label="Categories" onClick={() => navigate('/items/categories')} clickable color="primary" variant="outlined" size="small" />
        <Chip icon={<LocalOffer />} label="Brands" onClick={() => navigate('/items/brands')} clickable color="primary" variant="outlined" size="small" />
        <Chip icon={<Inventory />} label="Item Groups" onClick={() => navigate('/items/groups')} clickable color="primary" variant="outlined" size="small" />
        <Chip icon={<Straighten />} label="Units (UOM)" onClick={() => navigate('/items/units')} clickable color="primary" variant="outlined" size="small" />
        <Chip icon={<LocalOffer />} label="Taxes / GST" onClick={() => navigate('/items/taxes')} clickable color="primary" variant="outlined" size="small" />
        <Chip icon={<Sell />} label="Price Lists & Tiers" onClick={() => navigate('/items/price-lists')} clickable color="secondary" variant="outlined" size="small" />
      </Paper>

      {/* KPI Stats Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ bgcolor: '#e3f2fd', borderLeft: '4px solid #1976d2' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="textSecondary" fontWeight="600">TOTAL PRODUCTS</Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">{stats.totalItems}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ bgcolor: '#e8f5e9', borderLeft: '4px solid #2e7d32' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="textSecondary" fontWeight="600">STOCK VALUE</Typography>
              <Typography variant="h6" fontWeight="bold" color="success.main">{formatCurrency(stats.stockValue)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ bgcolor: '#fff3e0', borderLeft: '4px solid #ed6c02', cursor: 'pointer' }} onClick={() => setTabValue(1)}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="textSecondary" fontWeight="600">LOW STOCK</Typography>
              <Typography variant="h5" fontWeight="bold" color="warning.main">{stats.lowStockCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ bgcolor: '#ffebee', borderLeft: '4px solid #d32f2f', cursor: 'pointer' }} onClick={() => setTabValue(2)}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="textSecondary" fontWeight="600">OUT OF STOCK</Typography>
              <Typography variant="h5" fontWeight="bold" color="error.main">{stats.outOfStockCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ bgcolor: '#f3e5f5', borderLeft: '4px solid #9c27b0', cursor: 'pointer' }} onClick={() => setTabValue(3)}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="textSecondary" fontWeight="600">EXPIRING (30D)</Typography>
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#9c27b0' }}>{stats.expiringSoonCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for Quick Filter */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(e, val) => {
            setTabValue(val);
            setPage(0);
          }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab icon={<Inventory />} label="All Products" iconPosition="start" />
          <Tab icon={<Warning color="warning" />} label={`Low Stock (${stats.lowStockCount})`} iconPosition="start" />
          <Tab icon={<Warning color="error" />} label={`Out of Stock (${stats.outOfStockCount})`} iconPosition="start" />
          <Tab icon={<Schedule />} label={`Expiring Soon (${stats.expiringSoonCount})`} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Search & Filtering Bar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={6}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by SKU, Barcode, Product Name, Brand, Category, or Batch..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(0);
                }}
                label="Filter Category"
              >
                <MenuItem value="ALL">All Categories</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={3} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter Brand</InputLabel>
              <Select
                value={brandFilter}
                onChange={(e) => {
                  setBrandFilter(e.target.value);
                  setPage(0);
                }}
                label="Filter Brand"
              >
                <MenuItem value="ALL">All Brands</MenuItem>
                {brands.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Products Table */}
      <TableContainer component={Paper}>
        <Table size="medium">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell width={60}><strong>Image</strong></TableCell>
              <TableCell><strong>SKU / Barcode</strong></TableCell>
              <TableCell><strong>Product Name</strong></TableCell>
              <TableCell><strong>Category / Brand</strong></TableCell>
              <TableCell align="right"><strong>Cost (₹)</strong></TableCell>
              <TableCell align="right"><strong>Selling Price (₹)</strong></TableCell>
              <TableCell align="center"><strong>Stock</strong></TableCell>
              <TableCell align="center"><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length > 0 ? (
              items.map((item) => {
                const stock = Number(item.currentStock) || 0;
                const min = Number(item.minStock || item.minimumStock) || 0;
                const isOut = stock <= 0;
                const isLow = !isOut && min > 0 && stock <= min * 2;

                return (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Avatar
                        src={item.imageUrl || item.image || ''}
                        variant="rounded"
                        sx={{ width: 44, height: 44, bgcolor: 'grey.200' }}
                      >
                        <Inventory fontSize="small" color="disabled" />
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="700" color="primary.main">
                        {item.itemCode || item.code || '-'}
                      </Typography>
                      {item.barcode ? (
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography variant="caption" color="textSecondary">
                            {item.barcode}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => setBarcodeDialog({ open: true, item })}
                            title="View / Print Barcode"
                            sx={{ p: 0.2 }}
                          >
                            <QrCode fontSize="inherit" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.disabled">No barcode</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="600">
                        {item.name}
                      </Typography>
                      {item.batchNumber && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          Batch: {item.batchNumber} {item.expiryDate ? `| Exp: ${item.expiryDate}` : ''}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {item.categoryName || item.groupName || '-'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Brand: {item.brandName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="textSecondary">
                        {formatCurrency(item.purchasePrice)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="700">
                        {formatCurrency(item.sellingPrice)}
                      </Typography>
                      {item.wholesalePrice && item.wholesalePrice !== item.sellingPrice ? (
                        <Typography variant="caption" color="textSecondary" display="block">
                          WS: {formatCurrency(item.wholesalePrice)}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${stock} ${item.unitName || ''}`}
                        color={isOut ? 'error' : isLow ? 'warning' : 'success'}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                      {min > 0 && (
                        <Typography variant="caption" color="textSecondary" display="block">
                          Min: {min}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={item.isActive !== false ? 'Active' : 'Inactive'}
                        size="small"
                        color={item.isActive !== false ? 'primary' : 'default'}
                        variant={item.isActive !== false ? 'outlined' : 'filled'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit Product">
                        <IconButton size="small" color="primary" onClick={() => navigate(`/items/edit/${item.id}`)}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Product">
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(item)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {loading ? 'Loading catalog products...' : 'No products found matching criteria'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
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
      </TableContainer>

      {/* Barcode Viewer Dialog */}
      <Dialog
        open={barcodeDialog.open}
        onClose={() => setBarcodeDialog({ open: false, item: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          Product Barcode
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 2 }}>
          {barcodeDialog.item && (
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {barcodeDialog.item.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                SKU: {barcodeDialog.item.itemCode || barcodeDialog.item.code}
              </Typography>
              <Box
                sx={{
                  mt: 2,
                  p: 3,
                  bgcolor: 'grey.100',
                  borderRadius: 2,
                  border: '1px solid #ddd',
                  display: 'inline-block',
                }}
              >
                <QrCode sx={{ fontSize: 96, color: 'text.primary' }} />
                <Typography variant="h6" fontFamily="monospace" letterSpacing={2} fontWeight="bold">
                  {barcodeDialog.item.barcode}
                </Typography>
              </Box>
              <Box mt={2} display="flex" justifyContent="center">
                <Button
                  size="small"
                  startIcon={<ContentCopy />}
                  onClick={() => copyToClipboard(barcodeDialog.item.barcode)}
                >
                  Copy Barcode Number
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBarcodeDialog({ open: false, item: null })}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, item: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Product"
        message={`Are you sure you want to delete product "${deleteDialog.item?.name}" (${deleteDialog.item?.itemCode || deleteDialog.item?.code})?`}
      />
    </Box>
  );
};

export default ItemList;