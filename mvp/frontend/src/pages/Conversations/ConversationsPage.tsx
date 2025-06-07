import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Phone as PhoneIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { apiService } from '../../services/api';

interface Conversation {
  id: string;
  call_id: string;
  agent_id: string;
  agent_name: string;
  customer_phone: string;
  direction: string;
  status: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  customer_satisfaction?: number;
  summary?: string;
  created_at: string;
}

const ConversationsPage: React.FC = () => {
  const [filters, setFilters] = useState({
    agent_id: '',
    status: '',
    days: 30,
  });
  const navigate = useNavigate();

  // Fetch conversations
  const { data: conversations = [], isLoading, error, refetch } = useQuery<Conversation[]>(
    ['conversations', filters],
    () => apiService.get('/voice/conversations', {
      params: {
        agent_id: filters.agent_id || undefined,
        status: filters.status || undefined,
        days: filters.days,
      },
    }),
    {
      refetchOnWindowFocus: false,
    }
  );

  // Fetch agents for filter
  const { data: agents = [] } = useQuery(
    'agents',
    () => apiService.get('/agents')
  );

  const handleViewConversation = (conversationId: string) => {
    navigate(`/conversations/${conversationId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'primary';
      case 'failed': return 'error';
      case 'abandoned': return 'warning';
      default: return 'default';
    }
  };

  const getDirectionIcon = (direction: string) => {
    return <PhoneIcon sx={{ transform: direction === 'outbound' ? 'rotate(45deg)' : 'none' }} />;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSatisfactionColor = (score?: number) => {
    if (!score) return 'default';
    if (score >= 8) return 'success';
    if (score >= 6) return 'warning';
    return 'error';
  };

  if (error) {
    return (
      <Alert severity="error">
        Failed to load conversations. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Conversations
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Agent</InputLabel>
                <Select
                  value={filters.agent_id}
                  onChange={(e) => setFilters({ ...filters, agent_id: e.target.value })}
                  label="Agent"
                >
                  <MenuItem value="">All Agents</MenuItem>
                  {agents.map((agent: any) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  label="Status"
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="abandoned">Abandoned</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Time Period</InputLabel>
                <Select
                  value={filters.days}
                  onChange={(e) => setFilters({ ...filters, days: Number(e.target.value) })}
                  label="Time Period"
                >
                  <MenuItem value={7}>Last 7 days</MenuItem>
                  <MenuItem value={30}>Last 30 days</MenuItem>
                  <MenuItem value={90}>Last 90 days</MenuItem>
                  <MenuItem value={365}>Last year</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Conversations Table */}
      {isLoading ? (
        <LinearProgress />
      ) : conversations.length === 0 ? (
        <Alert severity="info">
          No conversations found. Try adjusting your filters or start some voice calls.
        </Alert>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Conversations ({conversations.length})
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Call</TableCell>
                    <TableCell>Agent</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Satisfaction</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {conversations.map((conversation) => (
                    <TableRow key={conversation.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getDirectionIcon(conversation.direction)}
                          <Typography variant="body2">
                            {conversation.call_id.substring(0, 8)}...
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {conversation.agent_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {conversation.customer_phone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={conversation.status}
                          color={getStatusColor(conversation.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDuration(conversation.duration_seconds)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {conversation.customer_satisfaction ? (
                          <Chip
                            label={`${conversation.customer_satisfaction}/10`}
                            color={getSatisfactionColor(conversation.customer_satisfaction) as any}
                            size="small"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(conversation.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleViewConversation(conversation.id)}
                          title="View Details"
                        >
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ConversationsPage;
