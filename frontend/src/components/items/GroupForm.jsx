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
} from '@mui/material';
import { Add, Edit, Delete, Straighten } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { unitService } from '../../services/unitService';
import UnitForm from './UnitForm';

const UnitList = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const data = await unitService.getAll();
      setUnits(data);
    } catch (error) {
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

      <Paper sx={{ p: 2, borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ width: '100%', py: 4 }}>
            <LinearProgress />
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
                      No units found
                    </TableCell>
                  </TableRow>
                ) : (
                  units.map((unit, index) => (
                    <TableRow key={unit.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Straighten sx={{ color: '#1976d2' }} />
                          <Typography fontWeight={500}>{unit.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{unit.shortName}</TableCell>
                      <TableCell>
                        <Chip
                          label={unit.isActive ? 'Active' : 'Inactive'}
                          color={unit.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
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
                        <Tooltip title="Delete">
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

      <UnitForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedUnit(null);
        }}
        unit={selectedUnit}
        onSuccess={fetchUnits}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Unit</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete unit "{selectedUnit?.name}"?
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