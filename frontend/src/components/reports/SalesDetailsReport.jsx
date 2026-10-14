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
  BarChart,
  Refresh,
  PictureAsPdf,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { reportService } from '../../services/reportService';
import { customerService } from '../../services/customerService';
import { itemService } from '../../services/itemService';
import { brandService } from '../../services/brandService';
import { groupService } from '../../services/groupService';

const SalesDetailsReport = () => {
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  
  const [customers, setCustomers] = useState([]);
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
      const [customersRes, itemsRes, brandsRes, groupsRes] = await Promise.all([
        customerService.getAll(0, 1000),
        itemService.getAll(0, 1000),
        brandService.getAll(),
        groupService.getAll(),
      ]);
      
      console.log('Customers loaded:', customersRes.content?.length || 0);
      console.log('Items loaded:', itemsRes.content?.length || 0);
      console.log('Brands loaded:', brandsRes?.length || 0);
      console.log('Groups loaded:', groupsRes?.length || 0);
      
      setCustomers(customersRes.content || []);
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
        customerIds: selectedCustomers.length > 0 ? selectedCustomers.map(c => c.id) : null,
        itemIds: selectedItems.length > 0 ? selectedItems.map(i => i.id) : null,
        brandIds: selectedBrands.length > 0 ? selectedBrands.map(b => b.id) : null,
        groupIds: selectedGroups.length > 0 ? selectedGroups.map(g => g.id) : null,
      };
      
      console.log('Sales Details Request:', requestData);
      
      const response = await reportService.getSalesDetailsReport(requestData);
      console.log('Sales Details Response:', response);
      
      setData(response.content || []);
      setSummary(response.summary || null);
      toast.success('Report loaded successfully');
    } catch (error) {
      console.error('Error fetching report:', error);
      setError('Failed to load report');
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        customerIds: selectedCustomers.length > 0 ? selectedCustomers.map(c => c.id) : null,
        itemIds: selectedItems.length > 0 ? selectedItems.map(i => i.id) : null,
        brandIds: selectedBrands.length > 0 ? selectedBrands.map(b => b.id) : null,
        groupIds: selectedGroups.length > 0 ? selectedGroups.map(g => g.id) : null,
      };
      await reportService.exportSalesReport(requestData);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const handleExportPDF = async () => {
    try {
      const requestData = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        customerIds: selectedCustomers.length > 0 ? selectedCustomers.map(c => c.id) : null,
        itemIds: selectedItems.length > 0 ? selectedItems.map(i => i.id) : null,
        brandIds: selectedBrands.length > 0 ? selectedBrands.map(b => b.id) : null,
        groupIds: selectedGroups.length > 0 ? selectedGroups.map(g => g.id) : null,
      };
      await reportService.exportSalesReportPDF(requestData);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <BarChart sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Sales Details Report
          </Typography>
          <Typography variant="body2" color="textSecondary">
            View detailed sales data with item-wise breakdown
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
              name="startDate"
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
              name="endDate"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              multiple
              options={customers}
              getOptionLabel={(option) => option.name || option.customerName || ''}
              value={selectedCustomers}
              onChange={(event, newValue) => setSelectedCustomers(newValue)}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Customers (Optional)" 
                  placeholder="Search customers..."
                  helperText={customers.length === 0 ? "No customers available" : `${customers.length} customers loaded`}
                />
              )}
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
              >
                {loading ? 'Loading...' : 'Generate'}
              </Button>
              <Button variant="outlined" startIcon={<Refresh />} onClick={fetchReport}>
                Refresh
              </Button>
              <Button variant="outlined" startIcon={<Download />} onClick={handleExportExcel}>
                Excel
              </Button>
              <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={handleExportPDF}>
                PDF
              </Button>
              <Button variant="outlined" startIcon={<Print />} onClick={handlePrint}>
                Print
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {summary && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Total Sales
                </Typography>
                <Typography variant="h5" color="primary">
                  ₹{summary.totalSales?.toFixed(2) || '0.00'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Total Items Sold
                </Typography>
                <Typography variant="h5">{summary.totalItems || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary">
                  Unique Products
                </Typography>
                <Typography variant="h5">{summary.uniqueProducts || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {loading ? (
        <Box sx={{ width: '100%', py: 4 }}>
          <LinearProgress />
          <Typography textAlign="center" sx={{ mt: 2 }} color="textSecondary">
            Loading report data...
          </Typography>
        </Box>
      ) : data.length > 0 ? (
        <Paper sx={{ p: 2, borderRadius: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                  <TableCell>Invoice No</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Item</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Brand</TableCell>
                  <TableCell>Group</TableCell>
                  <TableCell align="right">Qty</TableCell>
                  <TableCell align="right">Rate</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{row.invoiceNo}</TableCell>
                    <TableCell>{row.invoiceDate}</TableCell>
                    <TableCell>{row.customerName}</TableCell>
                    <TableCell>{row.itemName}</TableCell>
                    <TableCell>{row.itemCode}</TableCell>
                    <TableCell>{row.brandName || '-'}</TableCell>
                    <TableCell>{row.groupName || '-'}</TableCell>
                    <TableCell align="right">{row.quantity}</TableCell>
                    <TableCell align="right">₹{row.unitPrice?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight="bold" color="primary">
                        ₹{row.totalAmount?.toFixed(2) || '0.00'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="textSecondary">
            {filters.startDate && filters.endDate
              ? 'No data found for the selected filters'
              : 'Select date range and generate report'}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default SalesDetailsReport;