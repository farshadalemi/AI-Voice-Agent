import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useMutation } from 'react-query';
import { toast } from 'react-toastify';

import dataIntegrationService, { Database } from '../../services/dataIntegrationService';

interface FileUploadComponentProps {
  databases: Database[];
  onUploadSuccess: () => void;
}

interface FileWithPreview extends File {
  preview?: string;
}

const SUPPORTED_FORMATS = ['xlsx', 'xls', 'csv', 'json', 'pdf', 'txt', 'docx'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
  databases,
  onUploadSuccess,
}) => {
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  // Upload mutation
  const uploadMutation = useMutation(
    ({ file, databaseId, description }: { file: File; databaseId: string; description?: string }) =>
      dataIntegrationService.uploadFile(file, databaseId, description),
    {
      onSuccess: (data, variables) => {
        toast.success(`File "${variables.file.name}" uploaded successfully`);
        setFiles(prev => prev.filter(f => f.name !== variables.file.name));
        onUploadSuccess();
      },
      onError: (error: any, variables) => {
        toast.error(error.response?.data?.detail || `Failed to upload "${variables.file.name}"`);
      },
    }
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !SUPPORTED_FORMATS.includes(extension)) {
        toast.error(`File "${file.name}" has unsupported format. Supported: ${SUPPORTED_FORMATS.join(', ')}`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" is too large. Maximum size: 100MB`);
        return false;
      }
      return true;
    });

    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: true,
  });

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(file => file.name !== fileName));
  };

  const handleUpload = async () => {
    if (!selectedDatabase) {
      toast.error('Please select a database');
      return;
    }

    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    for (const file of files) {
      try {
        await uploadMutation.mutateAsync({
          file,
          databaseId: selectedDatabase,
          description: description || undefined,
        });
      } catch (error) {
        // Error is handled in the mutation
        break;
      }
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return <FileIcon color={SUPPORTED_FORMATS.includes(extension || '') ? 'primary' : 'disabled'} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            File Upload
          </Typography>

          {/* Database Selection */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Database</InputLabel>
            <Select
              value={selectedDatabase}
              onChange={(e) => setSelectedDatabase(e.target.value)}
              label="Select Database"
            >
              {databases.map((db) => (
                <MenuItem key={db.id} value={db.id}>
                  {db.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Description */}
          <TextField
            fullWidth
            margin="normal"
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={2}
            placeholder="Describe the content of your files..."
          />

          {/* File Drop Zone */}
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 3,
              mt: 2,
              textAlign: 'center',
              cursor: 'pointer',
              backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
              },
            }}
          >
            <input {...getInputProps()} />
            <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              or click to select files
            </Typography>
            <Box mt={1}>
              {SUPPORTED_FORMATS.map((format) => (
                <Chip key={format} label={format.toUpperCase()} size="small" sx={{ m: 0.25 }} />
              ))}
            </Box>
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Maximum file size: 100MB
            </Typography>
          </Box>

          {/* File List */}
          {files.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Files ({files.length})
              </Typography>
              <List dense>
                {files.map((file) => (
                  <ListItem key={file.name}>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          {getFileIcon(file.name)}
                          <Typography variant="body2">{file.name}</Typography>
                        </Box>
                      }
                      secondary={formatFileSize(file.size)}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => removeFile(file.name)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Upload Progress */}
          {uploadMutation.isLoading && (
            <Box mt={2}>
              <Typography variant="body2" gutterBottom>
                Uploading files...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {/* Upload Button */}
          <Box mt={3} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={handleUpload}
              disabled={files.length === 0 || !selectedDatabase || uploadMutation.isLoading}
            >
              Upload Files
            </Button>
          </Box>

          {/* Help Text */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Supported formats:</strong> Excel (.xlsx, .xls), CSV, JSON, PDF, Text (.txt), Word (.docx)
              <br />
              <strong>Processing:</strong> Files will be processed in the background and made available for AI search.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default FileUploadComponent;
