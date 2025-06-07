import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Mic as MicIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from 'react-query';
import { toast } from 'react-toastify';

import { apiService } from '../../services/api';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: string;
}

interface SimulationRequest {
  agent_id: string;
  customer_phone: string;
  customer_message: string;
  scenario: string;
  duration_seconds: number;
}

interface SimulationResponse {
  call_id: string;
  status: string;
  transcript: Array<{
    speaker: string;
    message: string;
    timestamp: string;
  }>;
  summary: {
    duration_seconds: number;
    customer_satisfaction: number;
    resolution_status: string;
    key_points: string[];
  };
}

const VoiceSimulationPage: React.FC = () => {
  const [formData, setFormData] = useState<SimulationRequest>({
    agent_id: '',
    customer_phone: '+1-555-0123',
    customer_message: '',
    scenario: 'general_inquiry',
    duration_seconds: 120,
  });
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);

  // Fetch agents
  const { data: agents = [], isLoading: agentsLoading } = useQuery<Agent[]>(
    'agents',
    () => apiService.get('/agents')
  );

  // Simulation mutation
  const simulationMutation = useMutation(
    (data: SimulationRequest) => apiService.post('/voice/simulate-call', data),
    {
      onSuccess: (data: SimulationResponse) => {
        setSimulationResult(data);
        setResultDialogOpen(true);
        toast.success('Call simulation completed successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Simulation failed');
      },
    }
  );

  const handleSimulate = () => {
    if (!formData.agent_id) {
      toast.error('Please select an agent');
      return;
    }
    if (!formData.customer_message.trim()) {
      toast.error('Please enter a customer message');
      return;
    }

    simulationMutation.mutate(formData);
  };

  const scenarios = [
    { value: 'general_inquiry', label: 'General Inquiry' },
    { value: 'technical_support', label: 'Technical Support' },
    { value: 'billing_question', label: 'Billing Question' },
    { value: 'complaint', label: 'Customer Complaint' },
    { value: 'sales_inquiry', label: 'Sales Inquiry' },
    { value: 'appointment_booking', label: 'Appointment Booking' },
  ];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSatisfactionColor = (score: number) => {
    if (score >= 8) return 'success';
    if (score >= 6) return 'warning';
    return 'error';
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Voice Call Simulation
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Test your AI agents with simulated customer calls to evaluate performance and responses.
      </Typography>

      <Grid container spacing={3}>
        {/* Simulation Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Setup Simulation
              </Typography>

              <FormControl fullWidth margin="normal">
                <InputLabel>Select Agent</InputLabel>
                <Select
                  value={formData.agent_id}
                  onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                  label="Select Agent"
                  disabled={agentsLoading}
                >
                  {agents
                    .filter(agent => agent.status === 'ready')
                    .map((agent) => (
                      <MenuItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                margin="normal"
                label="Customer Phone"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                placeholder="+1-555-0123"
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Scenario Type</InputLabel>
                <Select
                  value={formData.scenario}
                  onChange={(e) => setFormData({ ...formData, scenario: e.target.value })}
                  label="Scenario Type"
                >
                  {scenarios.map((scenario) => (
                    <MenuItem key={scenario.value} value={scenario.value}>
                      {scenario.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                margin="normal"
                label="Customer Message"
                value={formData.customer_message}
                onChange={(e) => setFormData({ ...formData, customer_message: e.target.value })}
                multiline
                rows={4}
                placeholder="Hi, I'm having trouble with my account and need help..."
                helperText="Enter what the customer would say to start the conversation"
              />

              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography gutterBottom>
                  Call Duration: {formatDuration(formData.duration_seconds)}
                </Typography>
                <Slider
                  value={formData.duration_seconds}
                  onChange={(_, value) => setFormData({ ...formData, duration_seconds: value as number })}
                  min={30}
                  max={300}
                  step={30}
                  marks={[
                    { value: 30, label: '30s' },
                    { value: 120, label: '2m' },
                    { value: 300, label: '5m' },
                  ]}
                />
              </Box>

              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={simulationMutation.isLoading ? <StopIcon /> : <PlayIcon />}
                onClick={handleSimulate}
                disabled={simulationMutation.isLoading || agents.length === 0}
                sx={{ mt: 2 }}
              >
                {simulationMutation.isLoading ? 'Simulating Call...' : 'Start Simulation'}
              </Button>

              {simulationMutation.isLoading && (
                <LinearProgress sx={{ mt: 2 }} />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Instructions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                How It Works
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText
                    primary="1. Select an Agent"
                    secondary="Choose which AI agent will handle the simulated call"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="2. Set Scenario"
                    secondary="Pick the type of customer interaction to simulate"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="3. Customer Message"
                    secondary="Enter what the customer would say to start the conversation"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="4. Run Simulation"
                    secondary="The AI will generate a realistic conversation transcript"
                  />
                </ListItem>
              </List>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  This is a simulation for testing purposes. The conversation is generated by AI 
                  to help you evaluate your agent's responses and performance.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Results Dialog */}
      <Dialog 
        open={resultDialogOpen} 
        onClose={() => setResultDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PhoneIcon />
            Call Simulation Results
          </Box>
        </DialogTitle>
        <DialogContent>
          {simulationResult && (
            <Box>
              {/* Summary */}
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Call Summary
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography variant="h6">
                        {formatDuration(simulationResult.summary.duration_seconds)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Customer Satisfaction
                      </Typography>
                      <Chip
                        label={`${simulationResult.summary.customer_satisfaction}/10`}
                        color={getSatisfactionColor(simulationResult.summary.customer_satisfaction) as any}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Resolution Status
                      </Typography>
                      <Typography variant="body1">
                        {simulationResult.summary.resolution_status}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Transcript */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Conversation Transcript
                  </Typography>
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {simulationResult.transcript.map((message, index) => (
                      <Box
                        key={index}
                        sx={{
                          mb: 2,
                          p: 2,
                          borderRadius: 1,
                          bgcolor: message.speaker === 'agent' ? 'primary.light' : 'grey.100',
                          color: message.speaker === 'agent' ? 'primary.contrastText' : 'text.primary',
                        }}
                      >
                        <Typography variant="caption" display="block">
                          {message.speaker === 'agent' ? 'AI Agent' : 'Customer'} - {message.timestamp}
                        </Typography>
                        <Typography variant="body1">
                          {message.message}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VoiceSimulationPage;
