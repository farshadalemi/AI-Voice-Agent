import React, { useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
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
  Delete as DeleteIcon,
  Link as LinkIcon,
  SmartToy as AgentIcon,
  Storage as DatabaseIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

import dataIntegrationService, { Database, AgentBinding } from '../../services/dataIntegrationService';
import { apiService } from '../../services/api';

interface Agent {
  id: string;
  name: string;
  description?: string;
  status: string;
}

interface AgentBindingManagerProps {
  databases: Database[];
}

const AgentBindingManager: React.FC<AgentBindingManagerProps> = ({ databases }) => {
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [bindingDialogOpen, setBindingDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [bindingConfig, setBindingConfig] = useState('{}');
  const queryClient = useQueryClient();

  // Fetch agents from main API
  const { data: agents = [], isLoading: agentsLoading } = useQuery<Agent[]>(
    'agents',
    () => apiService.get('/agents'),
    {
      refetchOnWindowFocus: false,
    }
  );

  // Fetch bindings for selected database
  const { data: bindings = [], isLoading: bindingsLoading } = useQuery<AgentBinding[]>(
    ['agentBindings', selectedDatabase],
    () => dataIntegrationService.listAgentBindings(selectedDatabase),
    {
      enabled: !!selectedDatabase,
      refetchOnWindowFocus: false,
    }
  );

  // Create binding mutation
  const createBindingMutation = useMutation(
    ({ databaseId, agentId, config }: { databaseId: string; agentId: string; config: any }) =>
      dataIntegrationService.bindAgentToDatabase(databaseId, agentId, config),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['agentBindings', selectedDatabase]);
        setBindingDialogOpen(false);
        setSelectedAgent('');
        setBindingConfig('{}');
        toast.success('Agent bound to database successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to bind agent');
      },
    }
  );

  // Remove binding mutation
  const removeBindingMutation = useMutation(dataIntegrationService.removeAgentBinding, {
    onSuccess: () => {
      queryClient.invalidateQueries(['agentBindings', selectedDatabase]);
      toast.success('Agent binding removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to remove binding');
    },
  });

  const handleCreateBinding = () => {
    if (!selectedAgent) {
      toast.error('Please select an agent');
      return;
    }

    let config = {};
    try {
      config = JSON.parse(bindingConfig);
    } catch (error) {
      toast.error('Invalid JSON configuration');
      return;
    }

    createBindingMutation.mutate({
      databaseId: selectedDatabase,
      agentId: selectedAgent,
      config,
    });
  };

  const handleRemoveBinding = (bindingId: string) => {
    if (window.confirm('Are you sure you want to remove this agent binding?')) {
      removeBindingMutation.mutate(bindingId);
    }
  };

  const getAgentName = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.name || 'Unknown Agent';
  };

  const getDatabaseName = (databaseId: string) => {
    const database = databases.find(db => db.id === databaseId);
    return database?.name || 'Unknown Database';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Agent-Database Bindings
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Configure which AI agents can access which databases through the MCP protocol.
            Bound agents can query and search the database content.
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DatabaseIcon fontSize="small" />
                    {db.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedDatabase && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Bindings for {getDatabaseName(selectedDatabase)}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setBindingDialogOpen(true)}
                  disabled={agents.length === 0}
                >
                  Bind Agent
                </Button>
              </Box>

              {bindingsLoading ? (
                <LinearProgress />
              ) : bindings.length === 0 ? (
                <Alert severity="info">
                  No agents are bound to this database. Bind an agent to enable MCP access.
                </Alert>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Agent</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Bound Date</TableCell>
                        <TableCell>Configuration</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bindings.map((binding) => (
                        <TableRow key={binding.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AgentIcon color="primary" />
                              <Typography variant="body2">
                                {getAgentName(binding.agent_id)}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={binding.is_active ? 'Active' : 'Inactive'}
                              color={binding.is_active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(binding.created_at)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                              {JSON.stringify(binding.binding_config, null, 2).substring(0, 50)}
                              {JSON.stringify(binding.binding_config).length > 50 ? '...' : ''}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveBinding(binding.id)}
                              color="error"
                              title="Remove Binding"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {!selectedDatabase && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Select a database to view and manage agent bindings.
            </Alert>
          )}

          {agentsLoading && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Loading agents...
            </Alert>
          )}

          {!agentsLoading && agents.length === 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              No agents found. Create an agent first before setting up database bindings.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Bind Agent Dialog */}
      <Dialog open={bindingDialogOpen} onClose={() => setBindingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinkIcon />
            Bind Agent to Database
          </Box>
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Agent</InputLabel>
            <Select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              label="Select Agent"
            >
              {agents
                .filter(agent => !bindings.some(binding => binding.agent_id === agent.id))
                .map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AgentIcon fontSize="small" />
                      {agent.name}
                    </Box>
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="Binding Configuration (JSON)"
            value={bindingConfig}
            onChange={(e) => setBindingConfig(e.target.value)}
            multiline
            rows={4}
            placeholder='{"permissions": ["read"], "max_queries_per_hour": 100}'
            helperText="Optional configuration for the binding (JSON format)"
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              This will allow the selected agent to access the database through the MCP protocol.
              The agent will be able to query and search the database content.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBindingDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateBinding}
            disabled={createBindingMutation.isLoading || !selectedAgent}
          >
            {createBindingMutation.isLoading ? 'Binding...' : 'Bind Agent'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AgentBindingManager;
