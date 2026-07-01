import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Save, Cancel, Inventory } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { itemService } from '../../services/itemService';
import { brandService } from '../../services/brandService';
import { groupService } from '../../services/groupService';
import { sectionService } from '../../services/sectionService';
import { unitService } from '../../services/unitService';
import { taxService } from '../../services/taxService';

const ItemForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    brandId: '',
    groupId: '',
    sectionId: '',
    unitId: '',
    taxId: '',
    purchasePrice: 0,
    sellingPrice: 0,
    gstRate: 0,
    hsnCode: '',
    openingStock: 0,
    currentStock: 0,  // Add this field
    minStockLevel: 0,
    maxStockLevel: 0,
    reorderLevel: 0,
  });
  const [brands, setBrands] = useState([]);
  const [groups, setGroups] = useState([]);
  const [sections, setSections] = useState([]);
  const [units, setUnits] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMasterData();
    if (isEdit) {
      fetchItem();
    }
  }, [id]);

  const fetchMasterData = async () => {
    try {
      const [brandsData, groupsData, sectionsData, unitsData, taxesData] = await Promise.all([
        brandService.getAll(),
        groupService.getAll(),
        sectionService.getAll(),
        unitService.getAll(),
        taxService.getAll(),
      ]);
      setBrands(brandsData || []);
      setGroups(groupsData || []);
      setSections(sectionsData || []);
      setUnits(unitsData || []);
      setTaxes(taxesData || []);
      console.log('✅ Master data loaded');
    } catch (error) {
      console.error('Failed to fetch master data:', error);
      toast.error('Failed to load master data');
    }
  };

  const fetchItem = async () => {
    try {
      setLoading(true);
      const data = await itemService.getById(id);
      console.log('📦 Item data:', data);
      
      // Set form data with all fields including currentStock
      setFormData({
        code: data.code || '',
        name: data.name || '',
        description: data.description || '',
        brandId: data.brandId || data.brand?.id || '',
        groupId: data.groupId || data.group?.id || '',
        sectionId: data.sectionId || data.section?.id || '',
        unitId: data.unitId || data.unit?.id || '',
        taxId: data.taxId || data.tax?.id || '',
        purchasePrice: data.purchasePrice || 0,
        sellingPrice: data.sellingPrice || 0,
        gstRate: data.gstRate || 0,
        hsnCode: data.hsnCode || '',
        openingStock: data.openingStock || 0,
        currentStock: data.currentStock || 0,  // Important: Set currentStock
        minStockLevel: data.minStockLevel || 0,
        maxStockLevel: data.maxStockLevel || 0,
        reorderLevel: data.reorderLevel || 0,
      });
      
      console.log('📋 Form data set:', formData);
    } catch (error) {
      console.error('Failed to fetch item details:', error);
      toast.error('Failed to fetch item details');
      navigate('/items');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Convert numeric fields to numbers
    const numericFields = ['purchasePrice', 'sellingPrice', 'gstRate', 'openingStock', 'currentStock', 'minStockLevel', 'maxStockLevel', 'reorderLevel'];
    const newValue = numericFields.includes(name) ? parseFloat(value) || 0 : value;
    
    setFormData({
      ...formData,
      [name]: newValue,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.code || !formData.name) {
      setError('Code and Name are required');
      return;
    }

    // Validate stock fields
    if (formData.currentStock < 0) {
      setError('Current Stock cannot be negative');
      return;
    }

    try {
      setLoading(true);
      console.log('📤 Submitting form data:', formData);
      
      let response;
      if (isEdit) {
        response = await itemService.update(id, formData);
        toast.success('Item updated successfully!');
        console.log('✅ Item updated:', response);
      } else {
        response = await itemService.create(formData);
        toast.success('Item created successfully!');
        console.log('✅ Item created:', response);
      }
      navigate('/items');
    } catch (error) {
      console.error('Save error:', error);
      setError(error.response?.data?.error || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Inventory sx={{ fontSize: 40, color: '#1976d2' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            {isEdit ? 'Edit Item' : 'Add New Item'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {isEdit ? 'Update item information' : 'Create a new product in the system'}
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3, borderRadius: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Basic Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Item Code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                placeholder="Enter unique item code"
                disabled={isEdit}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Item Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter item name"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={2}
                placeholder="Enter item description"
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Classification
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Brand</InputLabel>
                <Select
                  name="brandId"
                  value={formData.brandId}
                  onChange={handleChange}
                  label="Brand"
                >
                  <MenuItem value="">None</MenuItem>
                  {brands.map((brand) => (
                    <MenuItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Group</InputLabel>
                <Select
                  name="groupId"
                  value={formData.groupId}
                  onChange={handleChange}
                  label="Group"
                >
                  <MenuItem value="">None</MenuItem>
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Section</InputLabel>
                <Select
                  name="sectionId"
                  value={formData.sectionId}
                  onChange={handleChange}
                  label="Section"
                >
                  <MenuItem value="">None</MenuItem>
                  {sections.map((section) => (
                    <MenuItem key={section.id} value={section.id}>
                      {section.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Unit</InputLabel>
                <Select
                  name="unitId"
                  value={formData.unitId}
                  onChange={handleChange}
                  label="Unit"
                >
                  <MenuItem value="">None</MenuItem>
                  {units.map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      {unit.name} ({unit.shortName})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tax</InputLabel>
                <Select
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                  label="Tax"
                >
                  <MenuItem value="">None</MenuItem>
                  {taxes.map((tax) => (
                    <MenuItem key={tax.id} value={tax.id}>
                      {tax.name} ({tax.taxPercentage}%)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="HSN Code"
                name="hsnCode"
                value={formData.hsnCode}
                onChange={handleChange}
                placeholder="Enter HSN code"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="GST Rate (%)"
                name="gstRate"
                type="number"
                value={formData.gstRate}
                onChange={handleChange}
                InputProps={{ endAdornment: '%' }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Pricing
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Purchase Price"
                name="purchasePrice"
                type="number"
                value={formData.purchasePrice}
                onChange={handleChange}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Selling Price"
                name="sellingPrice"
                type="number"
                value={formData.sellingPrice}
                onChange={handleChange}
                InputProps={{ startAdornment: '₹' }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
            Stock Management
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Opening Stock"
                name="openingStock"
                type="number"
                value={formData.openingStock}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Current Stock"
                name="currentStock"
                type="number"
                value={formData.currentStock}
                onChange={handleChange}
                required
                InputProps={{ 
                  inputProps: { min: 0 },
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Min Stock Level"
                name="minStockLevel"
                type="number"
                value={formData.minStockLevel}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Max Stock Level"
                name="maxStockLevel"
                type="number"
                value={formData.maxStockLevel}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Reorder Level"
                name="reorderLevel"
                type="number"
                value={formData.reorderLevel}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={() => navigate('/items')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={loading}
            >
              {loading ? 'Saving...' : isEdit ? 'Update Item' : 'Create Item'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default ItemForm;