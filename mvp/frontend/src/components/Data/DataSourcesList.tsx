import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Grid,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  InsertDriveFile as FileIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useMutation, useQuery } from 'react-query';
import { toast } from 'react-toastify';

import dataIntegrationService, { DataSource, ProcessingStatus } from '../../services/dataIntegrationService';

interface DataSourcesListProps {
  dataSources: DataSource[];
  loading: boolean;
  onRefresh: () => void;
}

const DataSourcesList: React.FC<DataSourcesListProps> = ({
  dataSources,
  loading,
  onRefresh,
}) => {
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  // Get processing status
  const { data: processingStatus } = useQuery<ProcessingStatus>(
    ['processingStatus', selectedSource?.id],
    () => dataIntegrationService.getProcessingStatus(selectedSource!.id),
    {
      enabled: !!selectedSource,
      refetchInterval: selectedSource?.processing_status === 'processing' ? 2000 : false,
    }
  );

  // Delete data source mutation
  const deleteMutation = useMutation(dataIntegrationService.deleteDataSource, {
    onSuccess: () => {
      toast.success('Data source deleted successfully');
      onRefresh();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete data source');
    },
  });

  const handleDelete = (sourceId: string, sourceName: string) => {
    if (window.confirm(`Are you sure you want to delete "${sourceName}"? This action cannot be undone.`)) {
      deleteMutation.mutate(sourceId);
    }
  };

  const handleViewStatus = (source: DataSource) => {
    setSelectedSource(source);
    setStatusDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
      case 'pending':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const getFileTypeIcon = (sourceType: string) => {
    return <FileIcon color="primary" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return <LinearProgress />;
  }

  if (dataSources.length === 0) {
    return (
      <Alert severity="info">
        No data sources found. Upload some files to get started.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Data Sources ({dataSources.length})
        </Typography>
        <IconButton onClick={onRefresh} title="Refresh">
          <RefreshIcon />
        </IconButton>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Records</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dataSources.map((source) => (
              <TableRow key={source.id}>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getFileTypeIcon(source.source_type)}
                    <Typography variant="body2">{source.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={source.source_type.toUpperCase()}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatFileSize(source.file_size)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={source.processing_status}
                    color={getStatusColor(source.processing_status) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {source.records_count || 0}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(source.created_at)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleViewStatus(source)}
                    title="View Status"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(source.id, source.name)}
                    title="Delete"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Status Dialog */}
      <Dialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Processing Status</DialogTitle>
        <DialogContent>
          {selectedSource && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedSource.name}
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Status: <Chip
                    label={processingStatus?.status || selectedSource.processing_status}
                    color={getStatusColor(processingStatus?.status || selectedSource.processing_status) as any}
                    size="small"
                  />
                </Typography>
              </Box>

              {processingStatus && (
                <Box mb={2}>
                  <Typography variant="body2" gutterBottom>
                    Progress: {processingStatus.progress}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={processingStatus.progress}
                  />
                </Box>
              )}

              <Typography variant="body2" gutterBottom>
                <strong>Records Processed:</strong> {processingStatus?.records_processed || selectedSource.records_count || 0}
              </Typography>

              <Typography variant="body2" gutterBottom>
                <strong>Started:</strong> {formatDate(processingStatus?.started_at || selectedSource.created_at)}
              </Typography>

              {processingStatus?.completed_at && (
                <Typography variant="body2" gutterBottom>
                  <strong>Completed:</strong> {formatDate(processingStatus.completed_at)}
                </Typography>
              )}

              {(processingStatus?.error || selectedSource.processing_error) && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Error:</strong> {processingStatus?.error || selectedSource.processing_error}
                  </Typography>
                </Alert>
              )}

              {selectedSource.metadata && (
                <Box mt={2}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Metadata:</strong>
                  </Typography>
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {JSON.stringify(selectedSource.metadata, null, 2)}
                  </pre>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataSourcesList;
