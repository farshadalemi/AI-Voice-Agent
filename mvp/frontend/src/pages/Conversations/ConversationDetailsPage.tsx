import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  LinearProgress,
  Paper,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Phone as PhoneIcon,
  Person as PersonIcon,
  SmartToy as AgentIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';

import { apiService } from '../../services/api';

interface ConversationDetails {
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
  transcript: Array<{
    speaker: string;
    message: string;
    timestamp: string;
  }>;
  metadata: {
    call_quality?: number;
    resolution_status?: string;
    key_points?: string[];
    sentiment_analysis?: {
      overall: string;
      customer_emotion: string;
      agent_performance: string;
    };
  };
}

const ConversationDetailsPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();

  // Fetch conversation details
  const { data: conversation, isLoading, error } = useQuery<ConversationDetails>(
    ['conversation', conversationId],
    () => apiService.get(`/voice/conversations/${conversationId}`),
    {
      enabled: !!conversationId,
    }
  );

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
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

  const getSatisfactionColor = (score?: number) => {
    if (!score) return 'default';
    if (score >= 8) return 'success';
    if (score >= 6) return 'warning';
    return 'error';
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'success';
      case 'neutral': return 'default';
      case 'negative': return 'error';
      default: return 'default';
    }
  };

  if (isLoading) return <LinearProgress />;
  if (error) return <Alert severity="error">Failed to load conversation details</Alert>;
  if (!conversation) return <Alert severity="error">Conversation not found</Alert>;

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/conversations')}
          sx={{ mr: 2 }}
        >
          Back to Conversations
        </Button>
        <Typography variant="h4" component="h1">
          Conversation Details
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Call Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Call Information
              </Typography>

              <Box display="flex" alignItems="center" mb={2}>
                <PhoneIcon sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {conversation.call_id}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" mb={2}>
                <AgentIcon sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {conversation.agent_name}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" mb={2}>
                <PersonIcon sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {conversation.customer_phone}
                </Typography>
              </Box>

              <Box display="flex" alignItems="center" mb={2}>
                <TimeIcon sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {formatDuration(conversation.duration_seconds)}
                </Typography>
              </Box>

              <Box mb={2}>
                <Chip
                  label={conversation.status}
                  color={getStatusColor(conversation.status) as any}
                  sx={{ mr: 1 }}
                />
                <Chip
                  label={conversation.direction}
                  variant="outlined"
                />
              </Box>

              <Typography variant="body2" color="text.secondary">
                Started: {formatDate(conversation.start_time)}
              </Typography>
              {conversation.end_time && (
                <Typography variant="body2" color="text.secondary">
                  Ended: {formatDate(conversation.end_time)}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Metrics */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Metrics
              </Typography>

              {conversation.customer_satisfaction && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Customer Satisfaction
                  </Typography>
                  <Chip
                    label={`${conversation.customer_satisfaction}/10`}
                    color={getSatisfactionColor(conversation.customer_satisfaction) as any}
                  />
                </Box>
              )}

              {conversation.metadata.call_quality && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Call Quality
                  </Typography>
                  <Chip
                    label={`${conversation.metadata.call_quality}/10`}
                    color={getSatisfactionColor(conversation.metadata.call_quality) as any}
                  />
                </Box>
              )}

              {conversation.metadata.resolution_status && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Resolution Status
                  </Typography>
                  <Typography variant="body1">
                    {conversation.metadata.resolution_status}
                  </Typography>
                </Box>
              )}

              {conversation.metadata.sentiment_analysis && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Sentiment Analysis
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Chip
                      label={`Overall: ${conversation.metadata.sentiment_analysis.overall}`}
                      color={getSentimentColor(conversation.metadata.sentiment_analysis.overall) as any}
                      size="small"
                    />
                    <Chip
                      label={`Customer: ${conversation.metadata.sentiment_analysis.customer_emotion}`}
                      color={getSentimentColor(conversation.metadata.sentiment_analysis.customer_emotion) as any}
                      size="small"
                    />
                    <Chip
                      label={`Agent: ${conversation.metadata.sentiment_analysis.agent_performance}`}
                      color={getSentimentColor(conversation.metadata.sentiment_analysis.agent_performance) as any}
                      size="small"
                    />
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Transcript and Summary */}
        <Grid item xs={12} md={8}>
          {/* Summary */}
          {conversation.summary && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Call Summary
                </Typography>
                <Typography variant="body1">
                  {conversation.summary}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Key Points */}
          {conversation.metadata.key_points && conversation.metadata.key_points.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Key Points
                </Typography>
                <List dense>
                  {conversation.metadata.key_points.map((point, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={point} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Transcript */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Conversation Transcript
              </Typography>
              <Paper sx={{ maxHeight: 600, overflow: 'auto', p: 2 }}>
                {conversation.transcript.map((message, index) => (
                  <Box key={index}>
                    <Box
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
                    {index < conversation.transcript.length - 1 && <Divider sx={{ my: 1 }} />}
                  </Box>
                ))}
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ConversationDetailsPage;
