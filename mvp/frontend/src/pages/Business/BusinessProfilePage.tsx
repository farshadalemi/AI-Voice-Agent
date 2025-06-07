import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Alert,
  Divider,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Upgrade as UpgradeIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

import { apiService } from '../../services/api';

interface BusinessProfile {
  id: string;
  business_name: string;
  email: string;
  industry: string;
  phone?: string;
  website?: string;
  status: string;
  created_at: string;
  subscription?: {
    id: string;
    plan: {
      name: string;
      price: number;
      limits: {
        calls_per_month: number;
        agents: number;
      };
    };
    status: string;
    current_period_end: string;
  };
  usage: {
    calls_this_month: number;
    calls_limit: number;
    agents_count: number;
    agents_limit: number;
  };
}

const BusinessProfilePage: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    industry: '',
    phone: '',
    website: '',
  });
  const queryClient = useQueryClient();

  // Fetch business profile
  const { data: profile, isLoading, error } = useQuery<BusinessProfile>(
    'businessProfile',
    () => apiService.get('/business/profile'),
    {
      onSuccess: (data) => {
        setFormData({
          business_name: data.business_name,
          industry: data.industry,
          phone: data.phone || '',
          website: data.website || '',
        });
      },
    }
  );

  // Update profile mutation
  const updateMutation = useMutation(
    (data: any) => apiService.put('/business/profile', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('businessProfile');
        setIsEditing(false);
        toast.success('Profile updated successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to update profile');
      },
    }
  );

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        business_name: profile.business_name,
        industry: profile.industry,
        phone: profile.phone || '',
        website: profile.website || '',
      });
    }
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'trial': return 'warning';
      case 'suspended': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  };

  if (isLoading) return <LinearProgress />;
  if (error) return <Alert severity="error">Failed to load business profile</Alert>;
  if (!profile) return <Alert severity="error">Profile not found</Alert>;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Business Profile
        </Typography>
        {!isEditing ? (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </Button>
        ) : (
          <Box>
            <IconButton onClick={handleCancel} color="default">
              <CancelIcon />
            </IconButton>
            <IconButton 
              onClick={handleSave} 
              color="primary"
              disabled={updateMutation.isLoading}
            >
              <SaveIcon />
            </IconButton>
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}>
                  <BusinessIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h5">{profile.business_name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profile.email}
                  </Typography>
                  <Chip
                    label={profile.status}
                    color={getStatusColor(profile.status) as any}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Business Name"
                    value={formData.business_name}
                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    disabled={!isEditing}
                  />
                </Grid>
              </Grid>

              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Member since: {formatDate(profile.created_at)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Subscription & Usage */}
        <Grid item xs={12} md={4}>
          {/* Subscription Info */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Subscription
              </Typography>
              {profile.subscription ? (
                <Box>
                  <Typography variant="h5" color="primary">
                    {profile.subscription.plan.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    ${profile.subscription.plan.price}/month
                  </Typography>
                  <Chip
                    label={profile.subscription.status}
                    color={getStatusColor(profile.subscription.status) as any}
                    size="small"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2">
                    Renews: {formatDate(profile.subscription.current_period_end)}
                  </Typography>
                </Box>
              ) : (
                <Alert severity="warning">No active subscription</Alert>
              )}
              <Button
                fullWidth
                variant="contained"
                startIcon={<UpgradeIcon />}
                sx={{ mt: 2 }}
                href="/plans"
              >
                Manage Plan
              </Button>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Usage This Month
              </Typography>
              
              {/* Calls Usage */}
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Calls</Typography>
                  <Typography variant="body2">
                    {profile.usage.calls_this_month} / {profile.usage.calls_limit}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getUsagePercentage(profile.usage.calls_this_month, profile.usage.calls_limit)}
                  color={getUsagePercentage(profile.usage.calls_this_month, profile.usage.calls_limit) > 80 ? 'warning' : 'primary'}
                />
              </Box>

              {/* Agents Usage */}
              <Box>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Agents</Typography>
                  <Typography variant="body2">
                    {profile.usage.agents_count} / {profile.usage.agents_limit}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getUsagePercentage(profile.usage.agents_count, profile.usage.agents_limit)}
                  color={getUsagePercentage(profile.usage.agents_count, profile.usage.agents_limit) > 80 ? 'warning' : 'primary'}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BusinessProfilePage;
