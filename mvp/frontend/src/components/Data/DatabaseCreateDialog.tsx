import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';

import dataIntegrationService, { DatabaseCreate } from '../../services/dataIntegrationService';

interface DatabaseCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DatabaseCreateDialog: React.FC<DatabaseCreateDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<DatabaseCreate>({
    name: '',
    description: '',
    database_type: 'internal',
    schema_definition: {
      tables: [],
      version: '1.0',
    },
  });

  const createMutation = useMutation(dataIntegrationService.createDatabase, {
    onSuccess: () => {
      toast.success('Database created successfully');
      onSuccess();
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create database');
    },
  });

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      database_type: 'internal',
      schema_definition: {
        tables: [],
        version: '1.0',
      },
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Database name is required');
      return;
    }

    // Validate name format
    if (!/^[a-zA-Z0-9_-]+$/.test(formData.name)) {
      toast.error('Database name must contain only alphanumeric characters, hyphens, and underscores');
      return;
    }

    createMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof DatabaseCreate) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSelectChange = (field: keyof DatabaseCreate) => (
    event: any
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Database</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              margin="normal"
              label="Database Name"
              fullWidth
              required
              value={formData.name}
              onChange={handleInputChange('name')}
              placeholder="e.g., customer_data, product_catalog"
              helperText="Use only letters, numbers, hyphens, and underscores"
            />

            <TextField
              margin="normal"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={handleInputChange('description')}
              placeholder="Describe what this database will contain..."
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Database Type</InputLabel>
              <Select
                value={formData.database_type}
                onChange={handleSelectChange('database_type')}
                label="Database Type"
              >
                <MenuItem value="internal">Internal (Managed)</MenuItem>
                <MenuItem value="postgresql" disabled>PostgreSQL (Coming Soon)</MenuItem>
                <MenuItem value="mysql" disabled>MySQL (Coming Soon)</MenuItem>
                <MenuItem value="mongodb" disabled>MongoDB (Coming Soon)</MenuItem>
              </Select>
            </FormControl>

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Internal databases</strong> are fully managed and optimized for AI search. 
                You can upload files to populate them with data.
              </Typography>
            </Alert>

            <Alert severity="warning" sx={{ mt: 1 }}>
              <Typography variant="body2">
                External database connections are coming in future updates.
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={createMutation.isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={createMutation.isLoading || !formData.name.trim()}
          >
            {createMutation.isLoading ? 'Creating...' : 'Create Database'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default DatabaseCreateDialog;
