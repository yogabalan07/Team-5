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
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Save, Cancel, LocalShipping } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { supplierService } from '../../services/supplierService';
import { supplierGroupService } from '../../services/supplierGroupService';

const SupplierForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    alternatePhone: '',
    email: '',
    groupId: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    area: '',
    gstNo: '',
    panNo: '',
    creditDays: 30,
    openingBalance: 0,
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    notes: '',
    isActive: true,
  });

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroups();
    if (isEdit) {
      fetchSupplier();
    }
  }, [id, isEdit]);

  const fetchGroups = async () => {
    try {
      const data = await supplierGroupService.getAll();
      setGroups(data || []);
    } catch (e) {
      console.error('Failed to load supplier groups:', e);
    }
  };

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      const data = await supplierService.getById(id);
      setFormData({
        name: data.name || '',
        contactPerson: data.contactPerson || '',
        phone: data.phone || '',
        alternatePhone: data.alternatePhone || '',
        email: data.email || '',
        groupId: data.groupId || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        country: data.country || 'India',
        area: data.area || '',
        gstNo: data.gstNo || '',
        panNo: data.panNo || '',
        creditDays: data.creditDays !== undefined ? data.creditDays : 30,
        openingBalance: data.openingBalance || 0,
        bankName: data.bankName || '',
        accountNumber: data.accountNumber || '',
        ifscCode: data.ifscCode || '',
        branch: data.branch || '',
        notes: data.notes || '',
        isActive: data.isActive !== false,
      });
    } catch (err) {
      console.error('Failed to fetch supplier:', err);
      toast.error('Failed to load supplier');
      navigate('/suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    const numericFields = ['creditDays', 'openingBalance'];

    let finalVal = value;
    if (type === 'checkbox') {
      finalVal = checked;
    } else if (numericFields.includes(name)) {
      finalVal = value === '' ? 0 : Number(value) || 0;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalVal,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Supplier name is required');
      return;
    }

    setLoading(true);
    try {
      const selectedGroup = groups.find((g) => g.id === formData.groupId);
      const payload = {
        ...formData,
        groupName: selectedGroup ? selectedGroup.name : '',
      };

      if (isEdit) {
        await supplierService.update(id, payload);
        toast.success('Supplier updated successfully');
      } else {
        await supplierService.create(payload);
        toast.success('Supplier created successfully');
      }
      navigate('/suppliers');
    } catch (err) {
      console.error('Save supplier error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save supplier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <LocalShipping sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {isEdit ? 'Edit Supplier / Vendor' : 'Add New Supplier / Vendor'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {isEdit ? `Manage vendor details for ${formData.name}` : 'Register a supplier with payment terms and tax identifiers'}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Cancel />} onClick={() => navigate('/suppliers')}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {isEdit ? 'Update Supplier' : 'Save Supplier'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* General Details */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            General & Contact Information
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                required
                label="Supplier / Vendor Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Global Tech Distributors"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Contact Person"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="e.g. Sales Manager"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Supplier Group</InputLabel>
                <Select
                  name="groupId"
                  value={formData.groupId}
                  onChange={handleChange}
                  label="Supplier Group"
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {groups.map((g) => (
                    <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. +91 9876543210"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Alternate Phone"
                name="alternatePhone"
                value={formData.alternatePhone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="email"
                label="Email Address"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="orders@globaltech.com"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Address & Tax */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Address & Tax Identifiers
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Business Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Factory / Office address..."
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="State"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Pincode"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              <TextField
                fullWidth
                label="GSTIN (GST Number)"
                name="gstNo"
                value={formData.gstNo}
                onChange={handleChange}
                placeholder="e.g. 27AAAAA0000A1Z5"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                fullWidth
                label="PAN Number"
                name="panNo"
                value={formData.panNo}
                onChange={handleChange}
                placeholder="e.g. ABCDE1234F"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Financial & Bank Details */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Payment Terms & Vendor Bank Details
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Payment Terms (Days)"
                name="creditDays"
                value={formData.creditDays}
                onChange={handleChange}
                inputProps={{ min: 0 }}
                helperText="Credit duration allowed by vendor"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Opening Balance Payable (₹)"
                name="openingBalance"
                value={formData.openingBalance}
                onChange={handleChange}
                disabled={isEdit}
                helperText={isEdit ? 'Opening balance is locked after creation' : 'Initial outstanding payable to vendor'}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Bank Name"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Account Number"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="IFSC Code"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Branch Name"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Notes & Terms"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Discount agreements, lead times, or return policies..."
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
                label="Supplier Account is Active and available for POs and Purchase Invoices"
              />
            </Grid>
          </Grid>
        </Paper>
      </form>
    </Box>
  );
};

export default SupplierForm;