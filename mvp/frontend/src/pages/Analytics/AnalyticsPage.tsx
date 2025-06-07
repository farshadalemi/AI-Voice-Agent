import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Phone as PhoneIcon,
  SmartToy as AgentIcon,
  ThumbUp as SatisfactionIcon,
} from '@mui/icons-material';
import { useQuery } from 'react-query';

import { apiService } from '../../services/api';
import AnalyticsChart from '../../components/Analytics/AnalyticsChart';
import MetricCard from '../../components/Analytics/MetricCard';

interface AnalyticsData {
  overview: {
    total_calls: number;
    total_agents: number;
    avg_satisfaction: number;
    success_rate: number;
  };
  trends: {
    calls_by_day: Array<{ date: string; count: number }>;
    satisfaction_by_day: Array<{ date: string; score: number }>;
    agent_performance: Array<{ agent_name: string; calls: number; satisfaction: number }>;
  };
  voice_analytics: {
    avg_call_duration: number;
    resolution_rate: number;
    most_common_issues: Array<{ issue: string; count: number }>;
  };
}

const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30');

  // Fetch analytics data
  const { data: analytics, isLoading, error } = useQuery<AnalyticsData>(
    ['analytics', timeRange],
    () => apiService.get('/voice/analytics', {
      params: { days: timeRange }
    }),
    {
      refetchOnWindowFocus: false,
    }
  );

  if (error) {
    return (
      <Alert severity="error">
        Failed to load analytics data. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Analytics Dashboard
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="Time Range"
          >
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="90">Last 90 days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {isLoading ? (
        <LinearProgress />
      ) : analytics ? (
        <>
          {/* Overview Metrics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Total Calls"
                value={analytics.overview.total_calls.toLocaleString()}
                icon={<PhoneIcon />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Active Agents"
                value={analytics.overview.total_agents.toString()}
                icon={<AgentIcon />}
                color="secondary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Avg Satisfaction"
                value={`${analytics.overview.avg_satisfaction.toFixed(1)}/10`}
                icon={<SatisfactionIcon />}
                color="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <MetricCard
                title="Success Rate"
                value={`${analytics.overview.success_rate.toFixed(1)}%`}
                icon={<TrendingUpIcon />}
                color="info"
              />
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Calls Over Time
                  </Typography>
                  <AnalyticsChart
                    data={analytics.trends.calls_by_day}
                    xKey="date"
                    yKey="count"
                    type="line"
                    color="#1976d2"
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Satisfaction Trends
                  </Typography>
                  <AnalyticsChart
                    data={analytics.trends.satisfaction_by_day}
                    xKey="date"
                    yKey="score"
                    type="line"
                    color="#2e7d32"
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Agent Performance
                  </Typography>
                  <AnalyticsChart
                    data={analytics.trends.agent_performance}
                    xKey="agent_name"
                    yKey="calls"
                    type="bar"
                    color="#ed6c02"
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Voice Analytics
                  </Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Average Call Duration
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      {Math.floor(analytics.voice_analytics.avg_call_duration / 60)}:
                      {(analytics.voice_analytics.avg_call_duration % 60).toString().padStart(2, '0')}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Resolution Rate
                    </Typography>
                    <Typography variant="h6" gutterBottom>
                      {analytics.voice_analytics.resolution_rate.toFixed(1)}%
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Common Issues
                    </Typography>
                    {analytics.voice_analytics.most_common_issues.slice(0, 3).map((issue, index) => (
                      <Typography key={index} variant="body2">
                        {issue.issue} ({issue.count})
                      </Typography>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      ) : (
        <Alert severity="info">
          No analytics data available. Start making calls to see insights.
        </Alert>
      )}
    </Box>
  );
};

export default AnalyticsPage;
