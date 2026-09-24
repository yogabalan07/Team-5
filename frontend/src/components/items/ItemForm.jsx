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
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Card,
  CardMedia,
  CardContent,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Save,
  Cancel,
  Inventory,
  QrCode,
  AutoAwesome,
  CloudUpload,
  Delete,
  LocalOffer,
  Category as CategoryIcon,
  Timeline,
  Add as AddIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { itemService, generateBarcode } from '../../services/itemService';
import { brandService } from '../../services/brandService';
import { groupService } from '../../services/groupService';
import { categoryService } from '../../services/categoryService';
import { sectionService } from '../../services/sectionService';
import { unitService } from '../../services/unitService';
import { taxService } from '../../services/taxService';
import { supplierService } from '../../services/supplierService';

const ItemForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    itemCode: '',
    barcode: '',
    name: '',
    description: '',
    categoryId: '',
    brandId: '',
    groupId: '',
    sectionId: '',
    unitId: '',
    taxId: '',
    supplierId: '',
    purchasePrice: 0,
    sellingPrice: 0,
    mrp: 0,
    wholesalePrice: 0,
    specialPrice: 0,
    gstRate: 0,
    hsnCode: '',
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    reorderLevel: 0,
    batchNumber: '',
    manufacturingDate: '',
    expiryDate: '',
    serialNumbers: [],
    imageUrl: '',
    isActive: true,
  });

  const [serialInput, setSerialInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [groups, setGroups] = useState([]);
  const [sections, setSections] = useState([]);
  const [units, setUnits] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMasterData();
    if (isEdit) {
      fetchItem();
    }
  }, [id, isEdit]);

  const fetchMasterData = async () => {
    try {
      const [catsData, brandsData, groupsData, sectionsData, unitsData, taxesData, suppliersData] =
        await Promise.all([
          categoryService.getAll().catch(() => []),
          brandService.getAll().catch(() => []),
          groupService.getAll().catch(() => []),
          sectionService.getAll().catch(() => []),
          unitService.getAll().catch(() => []),
          taxService.getAll().catch(() => []),
          supplierService.getAll(0, 100).catch(() => ({ content: [] })),
        ]);
      setCategories(catsData || []);
      setBrands(brandsData || []);
      setGroups(groupsData || []);
      setSections(sectionsData || []);
      setUnits(unitsData || []);
      setTaxes(taxesData || []);
      setSuppliers((suppliersData && suppliersData.content) || []);
    } catch (err) {
      console.error('Failed to fetch master data:', err);
      toast.error('Failed to load master references');
    }
  };

  const fetchItem = async () => {
    try {
      setLoading(true);
      const data = await itemService.getById(id);
      setFormData({
        itemCode: data.itemCode || data.code || data.sku || '',
        barcode: data.barcode || '',
        name: data.name || '',
        description: data.description || '',
        categoryId: data.categoryId || '',
        brandId: data.brandId || '',
        groupId: data.groupId || '',
        sectionId: data.sectionId || '',
        unitId: data.unitId || '',
        taxId: data.taxId || '',
        supplierId: data.supplierId || '',
        purchasePrice: data.purchasePrice || 0,
        sellingPrice: data.sellingPrice || 0,
        mrp: data.mrp || data.sellingPrice || 0,
        wholesalePrice: data.wholesalePrice || data.sellingPrice || 0,
        specialPrice: data.specialPrice || data.sellingPrice || 0,
        gstRate: data.gstRate !== undefined ? data.gstRate : data.taxRate || 0,
        hsnCode: data.hsnCode || '',
        currentStock: data.currentStock || 0,
        minStock: data.minStock !== undefined ? data.minStock : data.minStockLevel || 0,
        maxStock: data.maxStock !== undefined ? data.maxStock : data.maxStockLevel || 0,
        reorderLevel: data.reorderLevel || 0,
        batchNumber: data.batchNumber || '',
        manufacturingDate: data.manufacturingDate || '',
        expiryDate: data.expiryDate || '',
        serialNumbers: Array.isArray(data.serialNumbers) ? data.serialNumbers : [],
        imageUrl: data.imageUrl || data.image || '',
        isActive: data.isActive !== false,
      });
    } catch (err) {
      console.error('Failed to fetch item details:', err);
      toast.error('Failed to fetch product details');
      navigate('/items');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    const numericFields = [
      'purchasePrice',
      'sellingPrice',
      'mrp',
      'wholesalePrice',
      'specialPrice',
      'gstRate',
      'currentStock',
      'minStock',
      'maxStock',
      'reorderLevel',
    ];

    let finalValue = value;
    if (type === 'checkbox') {
      finalValue = checked;
    } else if (numericFields.includes(name)) {
      finalValue = value === '' ? 0 : Number(value) || 0;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleGenerateBarcode = () => {
    const code = generateBarcode();
    setFormData((prev) => ({ ...prev, barcode: code }));
    toast.info(`Generated barcode: ${code}`);
  };

  const handleAddSerial = () => {
    const trimmed = serialInput.trim();
    if (!trimmed) return;
    if (formData.serialNumbers.includes(trimmed)) {
      toast.warning('Serial number already added');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      serialNumbers: [...prev.serialNumbers, trimmed],
    }));
    setSerialInput('');
  };

  const handleRemoveSerial = (serial) => {
    setFormData((prev) => ({
      ...prev,
      serialNumbers: prev.serialNumbers.filter((s) => s !== serial),
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error('Image size must be less than 1.5MB for fast loading');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({ ...prev, imageUrl: reader.result }));
      toast.success('Product image loaded');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const code = String(formData.itemCode || '').trim();
    const name = String(formData.name || '').trim();
    if (!code || !name) {
      setError('Product Code (SKU) and Product Name are required');
      setActiveTab(0);
      return;
    }

    if (formData.currentStock < 0) {
      setError('Stock cannot be negative');
      setActiveTab(2);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        itemCode: code,
        name,
        categoryName: categories.find((c) => c.id === formData.categoryId)?.name || '',
        brandName: brands.find((b) => b.id === formData.brandId)?.name || '',
        groupName: groups.find((g) => g.id === formData.groupId)?.name || '',
        sectionName: sections.find((s) => s.id === formData.sectionId)?.name || '',
        unitName: units.find((u) => u.id === formData.unitId)?.name || '',
        taxName: taxes.find((t) => t.id === formData.taxId)?.name || '',
        supplierName: suppliers.find((s) => s.id === formData.supplierId)?.name || '',
      };

      if (isEdit) {
        await itemService.update(id, payload);
        toast.success('Product updated successfully!');
      } else {
        await itemService.create(payload);
        toast.success('Product created successfully!');
      }
      navigate('/items');
    } catch (err) {
      console.error('Save product error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <Inventory sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {isEdit ? `Update specifications for ${formData.name || 'product'}` : 'Create a master product record with pricing and inventory tracking'}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Cancel />} onClick={() => navigate('/items')}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {isEdit ? 'Update Product' : 'Save Product'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Inventory />} label="General & SKU" iconPosition="start" />
          <Tab icon={<LocalOffer />} label="Pricing & Taxes" iconPosition="start" />
          <Tab icon={<Timeline />} label="Stock & Levels" iconPosition="start" />
          <Tab icon={<QrCode />} label="Batch & Serials" iconPosition="start" />
          <Tab icon={<CloudUpload />} label="Media & Image" iconPosition="start" />
        </Tabs>
      </Paper>

      <form onSubmit={handleSubmit}>
        {/* TAB 0: General & SKU */}
        {activeTab === 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Basic Identification & Classification
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Product SKU / Code"
                  name="itemCode"
                  value={formData.itemCode}
                  onChange={handleChange}
                  placeholder="e.g. PRD-001"
                  disabled={isEdit}
                  helperText={isEdit ? 'Unique identifier cannot be modified' : 'Unique product identifier'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Barcode (EAN / UPC)"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="Scan or enter barcode"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={handleGenerateBarcode} title="Generate EAN-13 Barcode" color="primary">
                          <AutoAwesome />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={12} md={4}>
                <TextField
                  fullWidth
                  required
                  label="Product Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Wireless Ergonomic Mouse"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    label="Category"
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {categories.map((c) => (
                      <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Brand</InputLabel>
                  <Select
                    name="brandId"
                    value={formData.brandId}
                    onChange={handleChange}
                    label="Brand"
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {brands.map((b) => (
                      <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Item Group</InputLabel>
                  <Select
                    name="groupId"
                    value={formData.groupId}
                    onChange={handleChange}
                    label="Item Group"
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {groups.map((g) => (
                      <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Unit of Measurement (UOM)</InputLabel>
                  <Select
                    name="unitId"
                    value={formData.unitId}
                    onChange={handleChange}
                    label="Unit of Measurement (UOM)"
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {units.map((u) => (
                      <MenuItem key={u.id} value={u.id}>{u.name} {u.shortName ? `(${u.shortName})` : ''}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Section / Aisle Location</InputLabel>
                  <Select
                    name="sectionId"
                    value={formData.sectionId}
                    onChange={handleChange}
                    label="Section / Aisle Location"
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {sections.map((s) => (
                      <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Primary Supplier</InputLabel>
                  <Select
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleChange}
                    label="Primary Supplier"
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {suppliers.map((s) => (
                      <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Description & Specifications"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed product features, specifications, or usage instructions..."
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label="Product is Active and available for Transactions"
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* TAB 1: Pricing & Taxes */}
        {activeTab === 1 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Multi-Tier Pricing & Taxation
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Purchase / Cost Price (₹)"
                  name="purchasePrice"
                  value={formData.purchasePrice}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: '0.01' }}
                  helperText="Default cost from supplier"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Retail Selling Price (₹)"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: '0.01' }}
                  helperText="Standard customer price"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Maximum Retail Price - MRP (₹)"
                  name="mrp"
                  value={formData.mrp}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: '0.01' }}
                  helperText="Printed package price"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Wholesale Price (₹)"
                  name="wholesalePrice"
                  value={formData.wholesalePrice}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: '0.01' }}
                  helperText="Bulk purchase discount tier"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Special / Distributor Price (₹)"
                  name="specialPrice"
                  value={formData.specialPrice}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: '0.01' }}
                  helperText="Contractual dealer tier"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="HSN / SAC Code"
                  name="hsnCode"
                  value={formData.hsnCode}
                  onChange={handleChange}
                  placeholder="e.g. 8471"
                />
              </Grid>

              <Grid item xs={12} sm={6} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tax / GST Rate</InputLabel>
                  <Select
                    name="taxId"
                    value={formData.taxId}
                    onChange={(e) => {
                      const selectedTax = taxes.find((t) => t.id === e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        taxId: e.target.value,
                        gstRate: selectedTax ? selectedTax.taxPercentage || 0 : prev.gstRate,
                      }));
                    }}
                    label="Tax / GST Rate"
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {taxes.map((t) => (
                      <MenuItem key={t.id} value={t.id}>{t.name} ({t.taxPercentage || 0}%)</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Custom GST Rate (%)"
                  name="gstRate"
                  value={formData.gstRate}
                  onChange={handleChange}
                  inputProps={{ min: 0, max: 100, step: '0.1' }}
                  helperText="Applicable GST percentage"
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* TAB 2: Stock & Inventory Levels */}
        {activeTab === 2 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Stock Thresholds & Reorder Rules
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Current On-Hand Stock"
                  name="currentStock"
                  value={formData.currentStock}
                  onChange={handleChange}
                  inputProps={{ min: 0 }}
                  helperText="Initial opening stock count"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Minimum Stock Alert Level"
                  name="minStock"
                  value={formData.minStock}
                  onChange={handleChange}
                  inputProps={{ min: 0 }}
                  helperText="Triggers Low Stock warning"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Reorder Trigger Level"
                  name="reorderLevel"
                  value={formData.reorderLevel}
                  onChange={handleChange}
                  inputProps={{ min: 0 }}
                  helperText="Threshold for purchase requisition"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Maximum Stock Capacity"
                  name="maxStock"
                  value={formData.maxStock}
                  onChange={handleChange}
                  inputProps={{ min: 0 }}
                  helperText="Warehouse capacity limit"
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* TAB 3: Batch, Expiry & Serials */}
        {activeTab === 3 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Batch Management & Serial Number Tracking
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Batch / Lot Number"
                  name="batchNumber"
                  value={formData.batchNumber}
                  onChange={handleChange}
                  placeholder="e.g. BATCH-2026-09"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Manufacturing Date"
                  name="manufacturingDate"
                  value={formData.manufacturingDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Expiry Date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  helperText="Triggers expiry alerts in dashboard"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                  Serial Numbers (Individual Asset Tracking)
                </Typography>
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    size="small"
                    label="Enter Serial Number"
                    value={serialInput}
                    onChange={(e) => setSerialInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSerial();
                      }
                    }}
                    placeholder="e.g. SN-987412"
                    sx={{ maxWidth: 320 }}
                  />
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddSerial}>
                    Add Serial
                  </Button>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={1} p={2} sx={{ bgcolor: 'grey.50', borderRadius: 1, minHeight: 60 }}>
                  {formData.serialNumbers.length > 0 ? (
                    formData.serialNumbers.map((sn) => (
                      <Chip
                        key={sn}
                        label={sn}
                        onDelete={() => handleRemoveSerial(sn)}
                        color="primary"
                        variant="outlined"
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No serial numbers attached. Add individual item serials above.
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* TAB 4: Media & Image */}
        {activeTab === 4 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight="600" gutterBottom>
              Product Image & Visual Asset
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<CloudUpload />}
                    sx={{ maxWidth: 260 }}
                  >
                    Upload Image
                    <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                  </Button>
                  <Typography variant="caption" color="textSecondary">
                    Supports JPG, PNG, WebP up to 1.5MB. Rendered directly in invoice and catalog views.
                  </Typography>

                  <TextField
                    fullWidth
                    label="Or Web Image URL"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/images/product.jpg"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                {formData.imageUrl ? (
                  <Card sx={{ maxWidth: 300, position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={formData.imageUrl}
                      alt={formData.name || 'Product'}
                      sx={{ objectFit: 'contain', bgcolor: 'grey.100' }}
                    />
                    <CardContent sx={{ py: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" noWrap fontWeight="600">
                          {formData.name || 'Product Preview'}
                        </Typography>
                        <IconButton size="small" color="error" onClick={handleRemoveImage} title="Remove image">
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ) : (
                  <Box
                    sx={{
                      width: 260,
                      height: 180,
                      border: '2px dashed #ccc',
                      borderRadius: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      color: 'text.secondary',
                    }}
                  >
                    <Inventory sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                    <Typography variant="body2">No image uploaded</Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>
        )}
      </form>
    </Box>
  );
};

export default ItemForm;