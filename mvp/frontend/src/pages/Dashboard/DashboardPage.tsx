import React from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  SmartToy as AgentIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { business } = useAuth();

  const stats = [
    {
      title: 'Total Agents',
      value: '3',
      icon: <AgentIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      color: '#1976d2',
    },
    {
      title: 'Calls This Month',
      value: '247',
      icon: <PhoneIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      color: '#2e7d32',
    },
    {
      title: 'Avg. Call Duration',
      value: '3:24',
      icon: <AnalyticsIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      color: '#ed6c02',
    },
    {
      title: 'Customer Satisfaction',
      value: '4.8/5',
      icon: <TrendingUpIcon sx={{ fontSize: 40, color: 'error.main' }} />,
      color: '#d32f2f',
    },
  ];

  const quickActions = [
    {
      title: 'Create New Agent',
      description: 'Set up a new AI voice agent for your business',
      action: () => navigate('/agents/create'),
      color: 'primary',
    },
    {
      title: 'Simulate Call',
      description: 'Test your agents with simulated conversations',
      action: () => navigate('/agents'),
      color: 'secondary',
    },
    {
      title: 'View Analytics',
      description: 'Analyze your voice agent performance',
      action: () => navigate('/analytics'),
      color: 'success',
    },
    {
      title: 'Manage Settings',
      description: 'Configure your business settings and preferences',
      action: () => navigate('/settings'),
      color: 'warning',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {business?.name || 'User'}!
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Here's an overview of your AI voice agent platform.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h4" component="div" fontWeight="bold">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {stat.title}
                    </Typography>
                  </Box>
                  <Box>{stat.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h5" component="h2" gutterBottom>
            Quick Actions
          </Typography>
        </Grid>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={action.action}>
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" component="h3" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ flexGrow: 1 }}>
                  {action.description}
                </Typography>
                <Box mt={2}>
                  <Button
                    variant="contained"
                    color={action.color as any}
                    size="small"
                    fullWidth
                  >
                    Get Started
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              Recent Conversations
            </Typography>
            <Box>
              <Typography variant="body2" color="textSecondary">
                No recent conversations. Start by creating an agent and simulating calls.
              </Typography>
              <Button
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => navigate('/agents')}
              >
                View All Agents
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              System Status
            </Typography>
            <Box>
              <Typography variant="body2" color="success.main" gutterBottom>
                ✓ All systems operational
              </Typography>
              <Typography variant="body2" color="success.main" gutterBottom>
                ✓ Voice processing active
              </Typography>
              <Typography variant="body2" color="success.main" gutterBottom>
                ✓ Analytics tracking enabled
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                Last updated: Just now
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;
