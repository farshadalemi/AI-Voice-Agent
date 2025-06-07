import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Grid,
  Alert,
  Divider,
} from '@mui/material';
import {
  Person as ProfileIcon,
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

import { apiService } from '../../services/api';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const SettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState({
    business_name: '',
    email: '',
    phone: '',
    website: '',
  });
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    call_alerts: true,
    weekly_reports: true,
  });
  const queryClient = useQueryClient();

  // Fetch business profile
  const { data: profile } = useQuery(
    'businessProfile',
    () => apiService.get('/business/profile'),
    {
      onSuccess: (data) => {
        setProfileData({
          business_name: data.business_name || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || '',
        });
      },
    }
  );

  // Update profile mutation
  const updateProfileMutation = useMutation(
    (data: any) => apiService.put('/business/profile', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('businessProfile');
        toast.success('Profile updated successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to update profile');
      },
    }
  );

  // Update settings mutation
  const updateSettingsMutation = useMutation(
    (data: any) => apiService.put('/business/settings', data),
    {
      onSuccess: () => {
        toast.success('Settings updated successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to update settings');
      },
    }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileSave = () => {
    updateProfileMutation.mutate(profileData);
  };

  const handleNotificationSave = () => {
    updateSettingsMutation.mutate({ notifications: notificationSettings });
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<BusinessIcon />} label="Business Profile" />
            <Tab icon={<NotificationsIcon />} label="Notifications" />
            <Tab icon={<SecurityIcon />} label="Security" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            Business Information
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Business Name"
                value={profileData.business_name}
                onChange={(e) => setProfileData({ ...profileData, business_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Website"
                value={profileData.website}
                onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleProfileSave}
              disabled={updateProfileMutation.isLoading}
            >
              {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            Notification Preferences
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.email_notifications}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      email_notifications: e.target.checked
                    })}
                  />
                }
                label="Email Notifications"
              />
              <Typography variant="body2" color="text.secondary">
                Receive notifications about calls, agent status, and system updates via email
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.sms_notifications}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      sms_notifications: e.target.checked
                    })}
                  />
                }
                label="SMS Notifications"
              />
              <Typography variant="body2" color="text.secondary">
                Receive urgent notifications via SMS
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.call_alerts}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      call_alerts: e.target.checked
                    })}
                  />
                }
                label="Call Alerts"
              />
              <Typography variant="body2" color="text.secondary">
                Get notified when calls start, end, or encounter issues
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.weekly_reports}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      weekly_reports: e.target.checked
                    })}
                  />
                }
                label="Weekly Reports"
              />
              <Typography variant="body2" color="text.secondary">
                Receive weekly analytics and performance reports
              </Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              onClick={handleNotificationSave}
              disabled={updateSettingsMutation.isLoading}
            >
              {updateSettingsMutation.isLoading ? 'Saving...' : 'Save Preferences'}
            </Button>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            Security Settings
          </Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Security settings help protect your account and business data.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Password
              </Typography>
              <Button variant="outlined" sx={{ mb: 2 }}>
                Change Password
              </Button>
              <Typography variant="body2" color="text.secondary">
                Last changed: Never
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Two-Factor Authentication
              </Typography>
              <FormControlLabel
                control={<Switch />}
                label="Enable 2FA"
              />
              <Typography variant="body2" color="text.secondary">
                Add an extra layer of security to your account
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                API Keys
              </Typography>
              <Button variant="outlined" sx={{ mb: 2 }}>
                Manage API Keys
              </Button>
              <Typography variant="body2" color="text.secondary">
                Create and manage API keys for integrations
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default SettingsPage;
