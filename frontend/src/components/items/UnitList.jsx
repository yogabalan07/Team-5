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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Chip,
  Alert,
} from '@mui/material';
import { Add, Edit, Delete, Straighten, Refresh } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { unitService } from '../../services/unitService';
import UnitForm from './UnitForm';

const UnitList = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await unitService.getAll();
      setUnits(data);
    } catch (error) {
      setError('Failed to fetch units');
      toast.error('Failed to fetch units');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await unitService.delete(selectedUnit.id);
      toast.success('Unit deleted successfully');
      setDeleteDialogOpen(false);
      fetchUnits();
    } catch (error) {
      toast.error('Failed to delete unit');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Units
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage units of measurement
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setSelectedUnit(null);
            setFormOpen(true);
          }}
          sx={{ borderRadius: 2 }}
        >
          Add Unit
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchUnits}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ width: '100%', py: 4 }}>
            <LinearProgress />
            <Typography textAlign="center" sx={{ mt: 2 }} color="textSecondary">
              Loading units...
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f7fa' }}>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Short Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {units.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        No units found. Click "Add Unit" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  units.map((unit, index) => (
                    <TableRow key={unit.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Straighten sx={{ color: '#1976d2', fontSize: 20 }} />
                          <Typography fontWeight={500}>{unit.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={unit.shortName}
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={unit.isActive ? 'Active' : 'Inactive'}
                          color={unit.isActive ? 'success' : 'error'}
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit Unit">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedUnit(unit);
                              setFormOpen(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Unit">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedUnit(unit);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Unit Form Dialog */}
      <UnitForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedUnit(null);
        }}
        unit={selectedUnit}
        onSuccess={fetchUnits}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Unit</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the unit "{selectedUnit?.name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UnitList;