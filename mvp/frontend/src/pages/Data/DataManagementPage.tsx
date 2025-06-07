import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Storage as DatabaseIcon,
  Upload as UploadIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

import dataIntegrationService, { Database, DataSource } from '../../services/dataIntegrationService';
import FileUploadComponent from '../../components/Data/FileUploadComponent';
import DatabaseCreateDialog from '../../components/Data/DatabaseCreateDialog';
import DataSourcesList from '../../components/Data/DataSourcesList';
import SearchInterface from '../../components/Data/SearchInterface';
import AgentBindingManager from '../../components/Data/AgentBindingManager';
import MCPServerDashboard from '../../components/Data/MCPServerDashboard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`data-tabpanel-${index}`}
      aria-labelledby={`data-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const DataManagementPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [createDatabaseOpen, setCreateDatabaseOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch databases
  const {
    data: databases = [],
    isLoading: databasesLoading,
    error: databasesError,
  } = useQuery<Database[]>('databases', dataIntegrationService.listDatabases, {
    refetchOnWindowFocus: false,
  });

  // Fetch data sources
  const {
    data: dataSources = [],
    isLoading: dataSourcesLoading,
    error: dataSourcesError,
  } = useQuery<DataSource[]>('dataSources', () => dataIntegrationService.listDataSources(), {
    refetchOnWindowFocus: false,
  });

  // Delete database mutation
  const deleteDatabaseMutation = useMutation(dataIntegrationService.deleteDatabase, {
    onSuccess: () => {
      queryClient.invalidateQueries('databases');
      toast.success('Database deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete database');
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDeleteDatabase = async (databaseId: string) => {
    if (window.confirm('Are you sure you want to delete this database? This action cannot be undone.')) {
      deleteDatabaseMutation.mutate(databaseId);
    }
  };

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries('dataSources');
    setUploadDialogOpen(false);
    toast.success('File uploaded successfully and processing started');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'success';
      case 'processing':
      case 'pending':
        return 'warning';
      case 'error':
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  if (databasesError || dataSourcesError) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Data Management
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Data Integration Service Not Available
          </Typography>
          <Typography variant="body2" paragraph>
            The Data Integration Service is not running. Please start it to use data management features.
          </Typography>
          <Typography variant="body2" paragraph>
            <strong>To start the service:</strong>
          </Typography>
          <Typography variant="body2" component="div">
            <strong>Windows:</strong>
            <br />
            <code>cd mvp && .\start-data-integration.bat</code>
            <br /><br />
            <strong>Linux/Mac:</strong>
            <br />
            <code>cd mvp && ./start-data-integration.sh</code>
            <br /><br />
            <strong>Manual:</strong>
            <br />
            <code>docker-compose --profile data-integration up -d</code>
          </Typography>
          <Typography variant="body2" sx={{ mt: 2 }}>
            After starting the service, refresh this page.
          </Typography>
        </Alert>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
          sx={{ mr: 2 }}
        >
          Refresh Page
        </Button>
        <Button
          variant="outlined"
          href="http://localhost:8001/docs"
          target="_blank"
        >
          Check Service Status
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Data Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              queryClient.invalidateQueries('databases');
              queryClient.invalidateQueries('dataSources');
            }}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDatabaseOpen(true)}
          >
            Create Database
          </Button>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Databases" />
          <Tab label="Data Sources" />
          <Tab label="File Upload" />
          <Tab label="Search" />
          <Tab label="Agent Bindings" />
          <Tab label="MCP Server" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {databasesLoading ? (
          <LinearProgress />
        ) : (
          <Grid container spacing={3}>
            {databases.map((database) => (
              <Grid item xs={12} md={6} lg={4} key={database.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <DatabaseIcon color="primary" />
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => setSelectedDatabase(database.id)}
                          title="View Details"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteDatabase(database.id)}
                          title="Delete Database"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {database.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {database.description || 'No description'}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                      <Chip
                        label={database.status}
                        color={getStatusColor(database.status) as any}
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(database.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {databases.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  No databases found. Create your first database to get started.
                </Alert>
              </Grid>
            )}
          </Grid>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <DataSourcesList
          dataSources={dataSources as DataSource[]}
          loading={dataSourcesLoading}
          onRefresh={() => queryClient.invalidateQueries('dataSources')}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Upload Files to Database
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Upload Excel, CSV, JSON, PDF, TXT, or Word documents to your databases for AI processing.
          </Typography>

          {databases.length === 0 ? (
            <Alert severity="warning">
              You need to create a database first before uploading files.
            </Alert>
          ) : (
            <FileUploadComponent
              databases={databases}
              onUploadSuccess={handleUploadSuccess}
            />
          )}
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <SearchInterface databases={databases} />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <AgentBindingManager databases={databases} />
      </TabPanel>

      <TabPanel value={tabValue} index={5}>
        <MCPServerDashboard onRefresh={() => {
          queryClient.invalidateQueries('databases');
          queryClient.invalidateQueries('dataSources');
        }} />
      </TabPanel>

      {/* Create Database Dialog */}
      <DatabaseCreateDialog
        open={createDatabaseOpen}
        onClose={() => setCreateDatabaseOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries('databases');
          setCreateDatabaseOpen(false);
        }}
      />
    </Box>
  );
};

export default DataManagementPage;
