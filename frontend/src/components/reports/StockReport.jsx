import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Alert,
  LinearProgress,
  Autocomplete,
} from '@mui/material';
import {
  Search,
  Download,
  Print,
  Inventory,
  Refresh,
  Warning,
  CheckCircle,
  Info,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { reportService } from '../../services/reportService';
import { itemService } from '../../services/itemService';
import { brandService } from '../../services/brandService';
import { groupService } from '../../services/groupService';

const StockReport = () => {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  
  const [items, setItems] = useState([]);
  const [brands, setBrands] = useState([]);
  const [groups, setGroups] = useState([]);
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    try {
      const [itemsRes, brandsRes, groupsRes] = await Promise.all([
        itemService.getAll(0, 1000),
        brandService.getAll(),
        groupService.getAll(),
      ]);
      
      console.log('Items loaded:', itemsRes.content?.length || 0);
      console.log('Brands loaded:', brandsRes);
      console.log('Groups loaded:', groupsRes);
      
      setItems(itemsRes.content || []);
      setBrands(Array.isArray(brandsRes) ? brandsRes : brandsRes.content || []);
      setGroups(Array.isArray(groupsRes) ? groupsRes : groupsRes.content || []);
    } catch (error) {
      console.error('Failed to fetch master data:', error);
      toast.error('Failed to load filter data');
    }
  };

  const fetchReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        itemIds: selectedItems.length > 0 ? selectedItems.map(i => i.id) : null,
        brandIds: selectedBrands.length > 0 ? selectedBrands.map(b => b.id) : null,
        groupIds: selectedGroups.length > 0 ? selectedGroups.map(g => g.id) : null,
      };
      
      console.log('Stock Report Request:', requestData);
      
      const response = await reportService.getStockReport(requestData);
      console.log('Stock Report Response:', response);
      
      setData(response.content || []);
      setSummary(response.summary || null);
      toast.success('Stock report loaded successfully');
    } catch (error) {
      console.error('Error fetching stock report:', error);
      setError('Failed to load stock report');
      toast.error('Failed to load stock report');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (item) => {
    const closingStock = item.additionalFields?.closingStock || 0;
    const minStock = item.additionalFields?.minStockLevel || 0;
    const maxStock = item.additionalFields?.maxStockLevel || 0;

    if (closingStock <= 0) {
      return { label: 'Out of Stock', color: 'error' };
    }
    if (closingStock <= minStock) {
      return { label: 'Critical Stock', color: 'error' };
    }
    if (closingStock <= minStock * 2) {
      return { label: 'Low Stock', color: 'warning' };
    }
    if (maxStock > 0 && closingStock >= maxStock) {
      return { label: 'Over Stock', color: 'info' };
    }
    return { label: 'In Stock', color: 'success' };
  };

  const handleExport = async () => {
    try {
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        itemIds: selectedItems.length > 0 ? selectedItems.map(i => i.id) : null,
        brandIds: selectedBrands.length > 0 ? selectedBrands.map(b => b.id) : null,
        groupIds: selectedGroups.length > 0 ? selectedGroups.map(g => g.id) : null,
      };
      await reportService.exportStockReport(requestData);
      toast.success('Stock report exported successfully');
    } catch (error) {
      console.error('Error exporting stock report:', error);
      toast.error('Failed to export stock report');
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Inventory sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Stock Report
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View stock with opening, purchases, sales, and closing
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={items}
              getOptionLabel={(option) => `${option.code} - ${option.name}`}
              value={selectedItems}
              onChange={(event, newValue) => setSelectedItems(newValue)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Items (Optional)" 
                  placeholder="Search items..."
                  helperText={items.length === 0 ? "No items available" : `${items.length} items loaded`}
                />
              )}
            />
          </Grid>
          
          {/* Brands Filter */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={brands}
              getOptionLabel={(option) => option.name || option.brandName || ''}
              value={selectedBrands}
              onChange={(event, newValue) => setSelectedBrands(newValue)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Brands (Optional)" 
                  placeholder="Search brands..."
                  helperText={brands.length === 0 ? "No brands available" : `${brands.length} brands loaded`}
                />
              )}
            />
          </Grid>
          
          {/* Groups Filter */}
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={groups}
              getOptionLabel={(option) => option.name || option.groupName || ''}
              value={selectedGroups}
              onChange={(event, newValue) => setSelectedGroups(newValue)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Groups (Optional)" 
                  placeholder="Search groups..."
                  helperText={groups.length === 0 ? "No groups available" : `${groups.length} groups loaded`}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={fetchReport}
                disabled={loading}
                sx={{ height: 56 }}
              >
                {loading ? 'Loading...' : 'Generate'}
              </Button>
              <Button variant="outlined" startIcon={<Refresh />} onClick={fetchReport}>
                Refresh
              </Button>
              <Button variant="outlined" startIcon={<Download />} onClick={handleExport}>
                Export
              </Button>
              <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()}>
                Print
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {data.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }} icon={<Info />}>
          <Typography variant="body2">
            <strong>Note:</strong> Opening Stock, Purchases, and Sales are calculated from transactions. 
            Closing Stock shows your current inventory.
          </Typography>
        </Alert>
      )}

      {summary && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Total Items
                </Typography>
                <Typography variant="h5">{summary.totalItems || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Total Stock Value
                </Typography>
                <Typography variant="h5" color="primary">
                  ₹{summary.totalStockValue?.toFixed(2) || '0.00'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Low Stock Items
                </Typography>
                <Typography variant="h5" color="warning">
                  {summary.lowStockItems || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Out of Stock
                </Typography>
                <Typography variant="h5" color="error">
                  {summary.outOfStock || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {loading ? (
        <Box sx={{ width: '100%', py: 4 }}>
          <LinearProgress />
          <Typography textAlign="center" sx={{ mt: 2 }} color="textSecondary">
            Loading stock data...
          </Typography>
        </Box>
      ) : data.length > 0 ? (
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                  <TableCell>Code</TableCell>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Group</TableCell>
                  <TableCell align="right">Opening Stock</TableCell>
                  <TableCell align="right">Purchases</TableCell>
                  <TableCell align="right">Sales</TableCell>
                  <TableCell align="right">Closing Stock</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item, index) => {
                  const stockStatus = getStockStatus(item);
                  const openingStock = item.additionalFields?.openingStock || 0;
                  const purchases = item.additionalFields?.purchases || 0;
                  const sales = item.additionalFields?.sales || 0;
                  const closingStock = item.additionalFields?.closingStock || 0;
                  
                  return (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {item.itemCode}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell>{item.brandName || item.additionalFields?.brand || '-'}</TableCell>
                      <TableCell>{item.groupName || item.additionalFields?.group || '-'}</TableCell>
                      <TableCell align="right">{openingStock}</TableCell>
                      <TableCell align="right">{purchases}</TableCell>
                      <TableCell align="right">{sales}</TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold" color="primary">
                          {closingStock}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={stockStatus.label}
                          color={stockStatus.color}
                          size="small"
                          icon={stockStatus.color === 'success' ? <CheckCircle /> : <Warning />}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="textSecondary">
            {filters.startDate && filters.endDate
              ? 'No stock data found for the selected period'
              : 'Select date range and generate report'}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default StockReport;