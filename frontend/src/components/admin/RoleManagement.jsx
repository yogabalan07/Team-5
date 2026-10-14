import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  AdminPanelSettings,
  Security,
  Add,
  CheckCircle,
  Save,
  Refresh,
  Lock,
  InfoOutlined,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const INITIAL_ROLES = [
  {
    id: 'ROLE_ADMIN',
    code: 'ADMIN',
    name: 'System Administrator',
    description: 'Unrestricted enterprise control, user security provisioning, financial approvals, and audit trail oversight.',
    userCount: 2,
    isSystem: true,
    badgeColor: 'primary',
    permissions: {
      auth: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
      catalog: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
      customers: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
      suppliers: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
      sales: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
      purchases: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
      inventory: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
      accounts: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
      reports: ['view', 'create', 'edit', 'delete', 'approve', 'export', 'print'],
    },
  },
  {
    id: 'ROLE_STORE_MANAGER',
    code: 'STORE_MANAGER',
    name: 'Store & Inventory Manager',
    description: 'Manages catalog master items, batch/serial tracking, warehouse bin transfers, and stock reconciliations.',
    userCount: 4,
    isSystem: true,
    badgeColor: 'info',
    permissions: {
      auth: ['view'],
      catalog: ['view', 'create', 'edit', 'export', 'print'],
      customers: ['view'],
      suppliers: ['view'],
      sales: ['view'],
      purchases: ['view', 'approve'],
      inventory: ['view', 'create', 'edit', 'approve', 'export', 'print'],
      accounts: ['view'],
      reports: ['view', 'export', 'print'],
    },
  },
  {
    id: 'ROLE_BILLING_CLERK',
    code: 'BILLING_CLERK',
    name: 'Billing Specialist',
    description: 'Executes customer quotes, sales orders, dispatches, invoices, and credit memo processing.',
    userCount: 8,
    isSystem: true,
    badgeColor: 'success',
    permissions: {
      auth: ['view'],
      catalog: ['view'],
      customers: ['view', 'create', 'edit'],
      suppliers: ['view'],
      sales: ['view', 'create', 'edit', 'export', 'print'],
      purchases: ['view'],
      inventory: ['view'],
      accounts: ['view', 'create'],
      reports: ['view', 'print'],
    },
  },
  {
    id: 'ROLE_PURCHASE_MANAGER',
    code: 'PURCHASE_MANAGER',
    name: 'Procurement Director',
    description: 'Issues RFQs, manages supplier agreements, generates purchase orders, and verifies Goods Received Notes (GRN).',
    userCount: 3,
    isSystem: true,
    badgeColor: 'warning',
    permissions: {
      auth: ['view'],
      catalog: ['view'],
      customers: ['view'],
      suppliers: ['view', 'create', 'edit', 'export'],
      sales: ['view'],
      purchases: ['view', 'create', 'edit', 'approve', 'export', 'print'],
      inventory: ['view'],
      accounts: ['view'],
      reports: ['view', 'export', 'print'],
    },
  },
  {
    id: 'ROLE_ACCOUNTS',
    code: 'ACCOUNTS',
    name: 'Financial Controller',
    description: 'General ledger oversight, accounts receivable/payable balancing, payment voucher issuance, and financial audit.',
    userCount: 3,
    isSystem: true,
    badgeColor: 'secondary',
    permissions: {
      auth: ['view'],
      catalog: ['view'],
      customers: ['view'],
      suppliers: ['view'],
      sales: ['view', 'export'],
      purchases: ['view', 'export'],
      inventory: ['view'],
      accounts: ['view', 'create', 'edit', 'approve', 'export', 'print'],
      reports: ['view', 'export', 'print'],
    },
  },
  {
    id: 'ROLE_STAFF',
    code: 'STAFF',
    name: 'Operations Staff',
    description: 'Default role for self-service onboarding. Standard read-only access to operational inventory and catalogs.',
    userCount: 14,
    isSystem: true,
    badgeColor: 'default',
    permissions: {
      auth: ['view'],
      catalog: ['view'],
      customers: ['view'],
      suppliers: ['view'],
      sales: ['view'],
      purchases: ['view'],
      inventory: ['view'],
      accounts: ['view'],
      reports: ['view'],
    },
  },
];

const MODULE_DEFINITIONS = [
  { key: 'auth', label: 'Auth & Administration', desc: 'User profiles, role provisioning, security policies' },
  { key: 'catalog', label: 'Products & Master Data', desc: 'SKUs, categories, brands, price lists, barcodes' },
  { key: 'customers', label: 'Customer Management', desc: 'Customer directories, credit limits, account statements' },
  { key: 'suppliers', label: 'Supplier Management', desc: 'Vendor records, terms, supplier ledgers' },
  { key: 'sales', label: 'Sales & Billing', desc: 'Quotations, orders, delivery notes, sales invoices' },
  { key: 'purchases', label: 'Purchase & Procurement', desc: 'Requisitions, vendor quotes, PO approvals, GRN' },
  { key: 'inventory', label: 'Warehouses & Inventory', desc: 'Multi-warehouse stock, batch tracking, transfer orders' },
  { key: 'accounts', label: 'Financial Ledger', desc: 'AR/AP balances, cashbook, vouchers, journal entries' },
  { key: 'reports', label: 'Reports & Analytics', desc: 'Operational summaries, financial statements, analytics' },
];

const ACTION_TYPES = [
  { key: 'view', label: 'View' },
  { key: 'create', label: 'Create' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'approve', label: 'Approve' },
  { key: 'export', label: 'Export' },
  { key: 'print', label: 'Print' },
];

const RoleManagement = () => {
  const { isAdmin } = useAuth();
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState(INITIAL_ROLES[0].id);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({
    code: '',
    name: '',
    description: '',
  });

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const handleTogglePermission = (moduleKey, actionKey) => {
    if (selectedRole.isSystem && selectedRole.code === 'ADMIN') {
      toast.info('System Administrator role retains complete platform permissions.');
      return;
    }

    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id !== selectedRoleId) return role;
        const currentActions = role.permissions[moduleKey] || [];
        const hasAction = currentActions.includes(actionKey);
        const updatedActions = hasAction
          ? currentActions.filter((a) => a !== actionKey)
          : [...currentActions, actionKey];

        return {
          ...role,
          permissions: {
            ...role.permissions,
            [moduleKey]: updatedActions,
          },
        };
      })
    );
  };

  const handleSaveRolePermissions = () => {
    toast.success(`Security policy matrix saved for ${selectedRole.name}.`);
  };

  const handleCreateRole = () => {
    if (!newRoleForm.code.trim() || !newRoleForm.name.trim()) {
      toast.error('Please enter a role code and descriptive title');
      return;
    }

    const code = newRoleForm.code.trim().toUpperCase().replace(/\s+/g, '_');
    const newRole = {
      id: `ROLE_${code}`,
      code,
      name: newRoleForm.name.trim(),
      description: newRoleForm.description.trim() || 'Custom enterprise operational role.',
      userCount: 0,
      isSystem: false,
      badgeColor: 'primary',
      permissions: {
        auth: ['view'],
        catalog: ['view'],
        customers: ['view'],
        suppliers: ['view'],
        sales: ['view'],
        purchases: ['view'],
        inventory: ['view'],
        accounts: ['view'],
        reports: ['view'],
      },
    };

    setRoles((prev) => [...prev, newRole]);
    setSelectedRoleId(newRole.id);
    setCreateDialogOpen(false);
    setNewRoleForm({ code: '', name: '', description: '' });
    toast.success(`Role "${newRole.name}" created successfully.`);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ color: 'text.primary', mb: 0.5 }}>
            Role & Permission Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure enterprise security policies, multi-department access matrices, and operational governance.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => {
              setRoles(INITIAL_ROLES);
              toast.info('Role configuration refreshed');
            }}
          >
            Reset Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Custom Role
          </Button>
        </Box>
      </Box>

      {/* Role Selection Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {roles.map((role) => {
          const isSelected = role.id === selectedRoleId;
          return (
            <Grid item xs={12} sm={6} md={4} key={role.id}>
              <Card
                onClick={() => setSelectedRoleId(role.id)}
                sx={{
                  cursor: 'pointer',
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  borderWidth: isSelected ? 2 : 1,
                  borderStyle: 'solid',
                  bgcolor: isSelected ? 'background.subtle' : 'background.paper',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Security fontSize="small" color={isSelected ? 'primary' : 'action'} />
                      <Typography variant="subtitle1" fontWeight={700}>
                        {role.name}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={role.code}
                      color={isSelected ? 'primary' : 'default'}
                      variant={isSelected ? 'filled' : 'outlined'}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40, mb: 1.5, fontSize: '0.8rem' }}>
                    {role.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                      Active Users: <strong>{role.userCount}</strong>
                    </Typography>
                    {role.isSystem && (
                      <Chip size="small" label="System Role" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Permission Matrix */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AdminPanelSettings color="primary" />
              <Typography variant="h6" fontWeight={700}>
                Permission Matrix — {selectedRole.name} ({selectedRole.code})
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Review and toggle granular capabilities across operational modules.
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Save />}
            onClick={handleSaveRolePermissions}
          >
            Save Role Permissions
          </Button>
        </Box>

        {selectedRole.code === 'ADMIN' && (
          <Alert severity="info" icon={<Lock />} sx={{ mb: 2 }}>
            <strong>System Administrator:</strong> By design, this core role retains full master authority over every system module to prevent administrative lockouts.
          </Alert>
        )}

        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 220 }}>Operational Module</TableCell>
                {ACTION_TYPES.map((action) => (
                  <TableCell key={action.key} align="center" sx={{ minWidth: 90 }}>
                    {action.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {MODULE_DEFINITIONS.map((module) => {
                const modulePerms = selectedRole.permissions[module.key] || [];

                return (
                  <TableRow key={module.key} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {module.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {module.desc}
                      </Typography>
                    </TableCell>
                    {ACTION_TYPES.map((action) => {
                      const isChecked = modulePerms.includes(action.key);
                      const isLocked = selectedRole.code === 'ADMIN';

                      return (
                        <TableCell key={action.key} align="center">
                          <Checkbox
                            size="small"
                            checked={isChecked}
                            disabled={isLocked}
                            onChange={() => handleTogglePermission(module.key, action.key)}
                            color="primary"
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Custom Role Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Define Custom Enterprise Role</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Role Code (e.g. DISPATCH_OFFICER)"
              fullWidth
              size="small"
              value={newRoleForm.code}
              onChange={(e) => setNewRoleForm({ ...newRoleForm, code: e.target.value.toUpperCase() })}
              placeholder="e.g. REGIONAL_SUPERVISOR"
              helperText="Unique uppercase identifier for backend policy binding"
            />
            <TextField
              label="Role Display Name"
              fullWidth
              size="small"
              value={newRoleForm.name}
              onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
              placeholder="e.g. Regional Operations Supervisor"
            />
            <TextField
              label="Description & Responsibilities"
              fullWidth
              multiline
              rows={3}
              size="small"
              value={newRoleForm.description}
              onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
              placeholder="Describe the operational scope, responsibilities, and department..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateRole}>
            Create Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleManagement;
