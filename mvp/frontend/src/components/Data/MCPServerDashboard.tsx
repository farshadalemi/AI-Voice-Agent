import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Cable as ConnectionIcon,
  SmartToy as AgentIcon,
  Timeline as ActivityIcon,
  Settings as SettingsIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { toast } from 'react-toastify';

import dataIntegrationService, { MCPConnection } from '../../services/dataIntegrationService';

interface MCPServerStats {
  total_connections: number;
  active_connections: number;
  total_queries: number;
  queries_per_minute: number;
  uptime_seconds: number;
  server_status: string;
}

interface MCPServerDashboardProps {
  onRefresh?: () => void;
}

const MCPServerDashboard: React.FC<MCPServerDashboardProps> = ({ onRefresh }) => {
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [serverConfig, setServerConfig] = useState('{}');

  // Fetch MCP server status and connections
  const { data: serverStats, isLoading: statsLoading, refetch: refetchStats } = useQuery<MCPServerStats>(
    'mcpServerStats',
    () => dataIntegrationService.getMCPServerStats(),
    {
      refetchInterval: 5000, // Refresh every 5 seconds
      refetchOnWindowFocus: false,
    }
  );

  const { data: connections = [], isLoading: connectionsLoading, refetch: refetchConnections } = useQuery<MCPConnection[]>(
    'mcpConnections',
    () => dataIntegrationService.getMCPConnections(),
    {
      refetchInterval: 10000, // Refresh every 10 seconds
      refetchOnWindowFocus: false,
    }
  );

  const handleRefresh = () => {
    refetchStats();
    refetchConnections();
    onRefresh?.();
    toast.success('Dashboard refreshed');
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
      case 'connected':
        return 'success';
      case 'starting':
      case 'connecting':
        return 'warning';
      case 'stopped':
      case 'disconnected':
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              MCP Server Dashboard
            </Typography>
            <Box>
              <IconButton onClick={() => setConfigDialogOpen(true)} title="Server Configuration">
                <SettingsIcon />
              </IconButton>
              <IconButton onClick={handleRefresh} title="Refresh">
                <RefreshIcon />
              </IconButton>
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" paragraph>
            Monitor the Model Context Protocol (MCP) server that enables AI agents to access your databases.
          </Typography>

          {/* Server Stats */}
          {statsLoading ? (
            <LinearProgress />
          ) : serverStats ? (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {serverStats.active_connections}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Connections
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {serverStats.total_queries}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Queries
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {serverStats.queries_per_minute}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Queries/Min
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Chip
                      label={serverStats.server_status}
                      color={getStatusColor(serverStats.server_status) as any}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Uptime: {formatUptime(serverStats.uptime_seconds)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="warning" sx={{ mb: 3 }}>
              MCP Server statistics unavailable. The server may not be running.
            </Alert>
          )}

          {/* Active Connections */}
          <Typography variant="h6" gutterBottom>
            Active Connections
          </Typography>

          {connectionsLoading ? (
            <LinearProgress />
          ) : connections.length === 0 ? (
            <Alert severity="info">
              No active MCP connections. Agents will appear here when they connect to query databases.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Agent</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Connected</TableCell>
                    <TableCell>Last Activity</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {connections.map((connection) => (
                    <TableRow key={connection.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AgentIcon color="primary" />
                          <Typography variant="body2">
                            {connection.agent_name || `Agent ${connection.agent_id.substring(0, 8)}`}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={connection.status}
                          color={getStatusColor(connection.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(connection.connected_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(connection.last_activity)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          title="View Activity"
                        >
                          <ActivityIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Server Information */}
          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography variant="body2">
              <strong>MCP Server Endpoint:</strong> ws://localhost:8002/mcp
              <br />
              <strong>Protocol:</strong> Model Context Protocol (MCP)
              <br />
              <strong>Purpose:</strong> Enables AI agents to query and search database content
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Server Configuration Dialog */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>MCP Server Configuration</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Server Configuration (JSON)"
            value={serverConfig}
            onChange={(e) => setServerConfig(e.target.value)}
            multiline
            rows={8}
            placeholder='{"port": 8002, "max_connections": 100, "timeout": 30}'
            helperText="Server configuration in JSON format"
          />

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Changing server configuration requires a restart. Make sure to backup current settings.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button variant="outlined" startIcon={<StopIcon />} color="error">
            Stop Server
          </Button>
          <Button variant="contained" startIcon={<StartIcon />}>
            Apply & Restart
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MCPServerDashboard;
