import React, { useState, useEffect } from 'react';
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
  Alert,
  LinearProgress,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Refresh,
  LockReset,
  AdminPanelSettings,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { userService } from '../../services/userService'; // ⭐ Make sure this is correct
import { useAuth } from '../../context/AuthContext';

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    phone: '',
    roleIds: [],
    isActive: true,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [page, rowsPerPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAll(page, rowsPerPage, search);
      setUsers(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await userService.getRoles();
      setRoles(data || []);
      console.log('📋 Roles loaded:', data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Failed to fetch roles');
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPage(0);
    fetchUsers();
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setIsEdit(true);
      setSelectedUser(user);
      setFormData({
        username: user.username,
        password: '',
        email: user.email,
        fullName: user.fullName || '',
        phone: user.phone || '',
        roleIds: user.roles.map(r => r.id),
        isActive: user.isActive,
      });
    } else {
      setIsEdit(false);
      setSelectedUser(null);
      setFormData({
        username: '',
        password: '',
        email: '',
        fullName: '',
        phone: '',
        roleIds: [],
        isActive: true,
      });
    }
    setError('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setError('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.username || formData.username.trim() === '') {
      setError('Username is required');
      return;
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!formData.email || formData.email.trim() === '') {
      setError('Email is required');
      return;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!isEdit && (!formData.password || formData.password.length < 6)) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.roleIds.length === 0) {
      setError('Please select at least one role');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Prepare the data for the API
      const requestData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        fullName: formData.fullName || '',
        phone: formData.phone || '',
        roleIds: formData.roleIds,
        isActive: formData.isActive,
      };

      // Only include password if it's provided (for new users or when changing password)
      if (formData.password && formData.password.trim() !== '') {
        requestData.password = formData.password;
      }

      console.log('📤 Sending user data:', requestData);

      let response;
      if (isEdit && selectedUser) {
        response = await userService.update(selectedUser.id, requestData);
        toast.success('User updated successfully');
      } else {
        // For new user, password is required
        if (!requestData.password) {
          setError('Password is required for new users');
          return;
        }
        response = await userService.create(requestData);
        toast.success('User created successfully');
      }

      console.log('✅ Response:', response);
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error('❌ Error saving user:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error data:', error.response?.data);

      // Extract error message from response
      let errorMessage = 'Failed to save user';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          errorMessage = error.response.data.errors.join(', ');
        }
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await userService.delete(selectedUser.id);
      toast.success('User deleted successfully');
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      await userService.toggleStatus(user.id);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to toggle user status');
    }
  };

  const handleResetPassword = async (user) => {
    if (window.confirm(`Reset password for ${user.username} to default?`)) {
      try {
        await userService.resetPassword(user.id);
        toast.success('Password reset successfully to: password123');
      } catch (error) {
        console.error('Error resetting password:', error);
        toast.error('Failed to reset password');
      }
    }
  };

  const getRoleColor = (roleName) => {
    if (roleName === 'ROLE_ADMIN' || roleName === 'ADMIN') return 'error';
    if (roleName === 'ROLE_PURCHASE_MANAGER') return 'warning';
    if (roleName === 'ROLE_STORE_MANAGER') return 'info';
    if (roleName === 'ROLE_ACCOUNTS') return 'success';
    return 'default';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            <AdminPanelSettings sx={{ fontSize: 40, color: '#1976d2', verticalAlign: 'middle', mr: 2 }} />
            User Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage system users and their roles
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <TextField
            placeholder="Search users..."
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
            onClick={fetchUsers}
          >
            Refresh
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ width: '100%', py: 4 }}>
            <LinearProgress />
            <Typography textAlign="center" sx={{ mt: 2 }} color="textSecondary">
              Loading users...
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                    <TableCell>User</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Roles</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="textSecondary">No users found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: '#1976d2' }}>
                              {user.fullName ? user.fullName.charAt(0) : user.username.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {user.fullName || user.username}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {user.phone || 'No phone'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            {user.roles.map((role) => (
                              <Chip
                                key={role.id}
                                label={role.name.replace('ROLE_', '')}
                                color={getRoleColor(role.name)}
                                size="small"
                              />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.isActive ? 'Active' : 'Inactive'}
                            color={user.isActive ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" justifyContent="center" gap={0.5}>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenDialog(user)}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                              <IconButton
                                size="small"
                                color={user.isActive ? 'warning' : 'success'}
                                onClick={() => handleToggleStatus(user)}
                              >
                                <Switch
                                  size="small"
                                  checked={user.isActive}
                                  onChange={() => handleToggleStatus(user)}
                                />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reset Password">
                              <IconButton
                                size="small"
                                color="info"
                                onClick={() => handleResetPassword(user)}
                              >
                                <LockReset />
                              </IconButton>
                            </Tooltip>
                            {user.id !== currentUser?.id && (
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
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

      {/* Add/Edit User Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {isEdit ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              fullWidth
              required
              disabled={isEdit}
            />
            <TextField
              label={isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              fullWidth
              required={!isEdit}
              helperText={isEdit ? "Leave blank to keep current password" : "Minimum 6 characters"}
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              fullWidth
            />
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Roles</InputLabel>
              <Select
                multiple
                value={formData.roleIds}
                onChange={(e) => setFormData({ ...formData, roleIds: e.target.value })}
                renderValue={(selected) => (
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {selected.map((id) => {
                      const role = roles.find(r => r.id === id);
                      return role ? (
                        <Chip
                          key={id}
                          label={role.name.replace('ROLE_', '')}
                          color={getRoleColor(role.name)}
                          size="small"
                        />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name.replace('ROLE_', '')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography>Active</Typography>
              <Switch
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{selectedUser?.username}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;