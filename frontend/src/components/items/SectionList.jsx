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
import { Add, Edit, Delete, Category, Refresh } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { sectionService } from '../../services/sectionService';
import SectionForm from './SectionForm';

const SectionList = () => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await sectionService.getAll();
      setSections(data);
    } catch (error) {
      setError('Failed to fetch sections');
      toast.error('Failed to fetch sections');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await sectionService.delete(selectedSection.id);
      toast.success('Section deleted successfully');
      setDeleteDialogOpen(false);
      fetchSections();
    } catch (error) {
      toast.error('Failed to delete section');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Sections
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Manage item sections/categories
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setSelectedSection(null);
            setFormOpen(true);
          }}
          sx={{ borderRadius: 2 }}
        >
          Add Section
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
            onClick={fetchSections}
            size="small"
          >
            Refresh
          </Button>
        </Box>

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
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        No sections found. Click "Add Section" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sections.map((section, index) => (
                    <TableRow key={section.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Category sx={{ color: '#1976d2', fontSize: 20 }} />
                          <Typography fontWeight={500}>{section.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{section.description || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={section.isActive ? 'Active' : 'Inactive'}
                          color={section.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit Section">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => {
                              setSelectedSection(section);
                              setFormOpen(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Section">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setSelectedSection(section);
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

      <SectionForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedSection(null);
        }}
        section={selectedSection}
        onSuccess={fetchSections}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Section</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the section "{selectedSection?.name}"?
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

export default SectionList;