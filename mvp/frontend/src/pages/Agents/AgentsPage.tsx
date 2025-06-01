import React from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  SmartToy as AgentIcon,
  PlayArrow as PlayIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AgentsPage: React.FC = () => {
  const navigate = useNavigate();

  // Mock data for demonstration
  const agents = [
    {
      id: '1',
      name: 'Customer Support Agent',
      description: 'Handles customer inquiries and support requests',
      status: 'ready',
      capabilities: ['order_status', 'product_information', 'customer_support'],
      conversations: 45,
    },
    {
      id: '2',
      name: 'Sales Assistant',
      description: 'Helps with sales inquiries and lead qualification',
      status: 'ready',
      capabilities: ['sales_assistance', 'lead_qualification', 'product_information'],
      conversations: 23,
    },
    {
      id: '3',
      name: 'Technical Support',
      description: 'Provides technical assistance and troubleshooting',
      status: 'training',
      capabilities: ['technical_support', 'troubleshooting'],
      conversations: 12,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'success';
      case 'training':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            AI Agents
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Manage your AI voice agents and their configurations
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/agents/create')}
        >
          Create Agent
        </Button>
      </Box>

      <Grid container spacing={3}>
        {agents.map((agent) => (
          <Grid item xs={12} md={6} lg={4} key={agent.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <AgentIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" component="h2">
                    {agent.name}
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="textSecondary" mb={2}>
                  {agent.description}
                </Typography>

                <Box mb={2}>
                  <Chip
                    label={agent.status}
                    color={getStatusColor(agent.status) as any}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="body2" color="textSecondary" component="span">
                    {agent.conversations} conversations
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Capabilities:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {agent.capabilities.slice(0, 2).map((capability) => (
                      <Chip
                        key={capability}
                        label={capability.replace('_', ' ')}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    {agent.capabilities.length > 2 && (
                      <Chip
                        label={`+${agent.capabilities.length - 2} more`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PlayIcon />}
                    disabled={agent.status !== 'ready'}
                  >
                    Test Call
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => navigate(`/agents/${agent.id}`)}
                  >
                    <SettingsIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {agents.length === 0 && (
        <Box textAlign="center" py={8}>
          <AgentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No agents created yet
          </Typography>
          <Typography variant="body2" color="textSecondary" mb={3}>
            Create your first AI voice agent to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/agents/create')}
          >
            Create Your First Agent
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default AgentsPage;
