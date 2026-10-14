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
  Checkbox,
  Switch,
  Card,
  CardContent,
} from '@mui/material';
import { Save, Cancel, People, AccountBalance } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { customerService } from '../../services/customerService';
import { customerGroupService } from '../../services/customerGroupService';

const CustomerForm = () => {
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
    billingAddress: '',
    shippingAddress: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    area: '',
    gstNo: '',
    panNo: '',
    creditLimit: 0,
    creditDays: 30,
    openingBalance: 0,
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    notes: '',
    isActive: true,
  });

  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroups();
    if (isEdit) {
      fetchCustomer();
    }
  }, [id, isEdit]);

  const fetchGroups = async () => {
    try {
      const data = await customerGroupService.getAll();
      setGroups(data || []);
    } catch (e) {
      console.error('Failed to load customer groups:', e);
    }
  };

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const data = await customerService.getById(id);
      setFormData({
        name: data.name || '',
        contactPerson: data.contactPerson || '',
        phone: data.phone || '',
        alternatePhone: data.alternatePhone || '',
        email: data.email || '',
        groupId: data.groupId || '',
        billingAddress: data.billingAddress || data.address || '',
        shippingAddress: data.shippingAddress || data.address || '',
        city: data.city || '',
        state: data.state || '',
        pincode: data.pincode || '',
        country: data.country || 'India',
        area: data.area || '',
        gstNo: data.gstNo || '',
        panNo: data.panNo || '',
        creditLimit: data.creditLimit || 0,
        creditDays: data.creditDays !== undefined ? data.creditDays : 30,
        openingBalance: data.openingBalance || 0,
        bankName: data.bankName || '',
        accountNumber: data.accountNumber || '',
        ifscCode: data.ifscCode || '',
        branch: data.branch || '',
        notes: data.notes || '',
        isActive: data.isActive !== false,
      });
      if (data.shippingAddress && data.billingAddress && data.shippingAddress !== data.billingAddress) {
        setSameAsBilling(false);
      }
    } catch (err) {
      console.error('Failed to fetch customer:', err);
      toast.error('Failed to load customer');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    const numericFields = ['creditLimit', 'creditDays', 'openingBalance'];

    let finalVal = value;
    if (type === 'checkbox') {
      finalVal = checked;
    } else if (numericFields.includes(name)) {
      finalVal = value === '' ? 0 : Number(value) || 0;
    }

    setFormData((prev) => {
      const updated = { ...prev, [name]: finalVal };
      if (name === 'billingAddress' && sameAsBilling) {
        updated.shippingAddress = finalVal;
      }
      return updated;
    });
  };

  const handleSameAsBillingChange = (e) => {
    const checked = e.target.checked;
    setSameAsBilling(checked);
    if (checked) {
      setFormData((prev) => ({ ...prev, shippingAddress: prev.billingAddress }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Customer name is required');
      return;
    }

    setLoading(true);
    try {
      const selectedGroup = groups.find((g) => g.id === formData.groupId);
      const payload = {
        ...formData,
        groupName: selectedGroup ? selectedGroup.name : '',
        address: formData.billingAddress,
      };

      if (isEdit) {
        await customerService.update(id, payload);
        toast.success('Customer updated successfully');
      } else {
        await customerService.create(payload);
        toast.success('Customer created successfully');
      }
      navigate('/customers');
    } catch (err) {
      console.error('Save customer error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <People sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {isEdit ? 'Edit Customer' : 'Add New Customer'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {isEdit ? `Manage account information for ${formData.name}` : 'Create a customer record with credit terms and address details'}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Cancel />} onClick={() => navigate('/customers')}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={handleSubmit}
            disabled={loading}
          >
            {isEdit ? 'Update Customer' : 'Save Customer'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Details */}
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
                label="Customer / Company Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Acme Corporation"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Primary Contact Person"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="e.g. John Doe"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Customer Group</InputLabel>
                <Select
                  name="groupId"
                  value={formData.groupId}
                  onChange={handleChange}
                  label="Customer Group"
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
                placeholder="e.g. 022 12345678"
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
                placeholder="accounts@acme.com"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Address Information */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Addresses & Tax Identifiers
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Billing Address"
                name="billingAddress"
                value={formData.billingAddress}
                onChange={handleChange}
                placeholder="Building, Street, Area..."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box mb={1} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" fontWeight="500">Shipping Address</Typography>
                <FormControlLabel
                  control={<Checkbox checked={sameAsBilling} onChange={handleSameAsBillingChange} size="small" />}
                  label="Same as Billing"
                />
              </Box>
              <TextField
                fullWidth
                multiline
                rows={3}
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleChange}
                disabled={sameAsBilling}
                placeholder="Delivery address..."
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
                label="Area / Territory"
                name="area"
                value={formData.area}
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

        {/* Financial & Credit Terms */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Credit Limits, Payment Terms & Banking
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Credit Limit (₹)"
                name="creditLimit"
                value={formData.creditLimit}
                onChange={handleChange}
                inputProps={{ min: 0 }}
                helperText="Maximum outstanding allowed before warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Payment Terms (Days)"
                name="creditDays"
                value={formData.creditDays}
                onChange={handleChange}
                inputProps={{ min: 0 }}
                helperText="Standard credit duration for due invoices"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Opening Balance (₹)"
                name="openingBalance"
                value={formData.openingBalance}
                onChange={handleChange}
                disabled={isEdit}
                helperText={isEdit ? 'Opening balance is locked after creation' : 'Initial outstanding receivable'}
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
                label="Bank Account No"
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
                label="Internal Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Special delivery instructions, client preferences, or credit terms..."
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
                label="Customer Account is Active and approved for invoicing"
              />
            </Grid>
          </Grid>
        </Paper>
      </form>
    </Box>
  );
};

export default CustomerForm;