import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Check as CheckIcon,
  Star as StarIcon,
  Upgrade as UpgradeIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';

import { apiService } from '../../services/api';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_period: string;
  features: string[];
  limits: {
    calls_per_month: number;
    agents: number;
    storage_gb: number;
  };
  is_popular: boolean;
  is_active: boolean;
}

interface CurrentSubscription {
  id: string;
  plan_id: string;
  status: string;
  current_period_end: string;
  plan: Plan;
}

const PlansPage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch available plans
  const { data: plans = [], isLoading: plansLoading } = useQuery<Plan[]>(
    'plans',
    () => apiService.get('/business/plans')
  );

  // Fetch current subscription
  const { data: currentSubscription } = useQuery<CurrentSubscription>(
    'currentSubscription',
    () => apiService.get('/business/subscription'),
    {
      retry: false,
    }
  );

  // Subscribe mutation
  const subscribeMutation = useMutation(
    (planId: string) => apiService.post('/business/subscribe', { plan_id: planId }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('currentSubscription');
        queryClient.invalidateQueries('businessProfile');
        setSubscribeDialogOpen(false);
        setSelectedPlan(null);
        toast.success('Successfully subscribed to plan');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to subscribe');
      },
    }
  );

  const handleSubscribe = (plan: Plan) => {
    setSelectedPlan(plan);
    setSubscribeDialogOpen(true);
  };

  const confirmSubscribe = () => {
    if (selectedPlan) {
      subscribeMutation.mutate(selectedPlan.id);
    }
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Free' : `$${price}`;
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan_id === planId;
  };

  if (plansLoading) return <LinearProgress />;

  return (
    <Box>
      <Box textAlign="center" mb={4}>
        <Typography variant="h3" component="h1" gutterBottom>
          Choose Your Plan
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Select the perfect plan for your business needs
        </Typography>
      </Box>

      {currentSubscription && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are currently on the <strong>{currentSubscription.plan.name}</strong> plan.
          {currentSubscription.status === 'active' && (
            <> Your subscription renews on {new Date(currentSubscription.current_period_end).toLocaleDateString()}.</>
          )}
        </Alert>
      )}

      <Grid container spacing={3} justifyContent="center">
        {plans.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: plan.is_popular ? 2 : 1,
                borderColor: plan.is_popular ? 'primary.main' : 'divider',
              }}
            >
              {plan.is_popular && (
                <Chip
                  label="Most Popular"
                  color="primary"
                  icon={<StarIcon />}
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                  }}
                />
              )}

              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                <Typography variant="h4" component="h2" gutterBottom>
                  {plan.name}
                </Typography>

                <Typography variant="h2" color="primary" gutterBottom>
                  {formatPrice(plan.price)}
                  {plan.price > 0 && (
                    <Typography component="span" variant="h6" color="text.secondary">
                      /{plan.billing_period}
                    </Typography>
                  )}
                </Typography>

                <Typography variant="body1" color="text.secondary" paragraph>
                  {plan.description}
                </Typography>

                <Box textAlign="left">
                  <Typography variant="h6" gutterBottom>
                    Features:
                  </Typography>
                  <List dense>
                    {plan.features.map((feature, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Limits:
                  </Typography>
                  <List dense>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={`${plan.limits.calls_per_month.toLocaleString()} calls/month`} />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={`${plan.limits.agents} AI agents`} />
                    </ListItem>
                    <ListItem sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={`${plan.limits.storage_gb}GB storage`} />
                    </ListItem>
                  </List>
                </Box>
              </CardContent>

              <CardActions sx={{ p: 2 }}>
                {isCurrentPlan(plan.id) ? (
                  <Button fullWidth variant="outlined" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant={plan.is_popular ? "contained" : "outlined"}
                    color="primary"
                    startIcon={<UpgradeIcon />}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {currentSubscription ? 'Switch Plan' : 'Get Started'}
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Subscribe Confirmation Dialog */}
      <Dialog open={subscribeDialogOpen} onClose={() => setSubscribeDialogOpen(false)}>
        <DialogTitle>Confirm Subscription</DialogTitle>
        <DialogContent>
          {selectedPlan && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedPlan.name}
              </Typography>
              <Typography variant="h4" color="primary" gutterBottom>
                {formatPrice(selectedPlan.price)}
                {selectedPlan.price > 0 && (
                  <Typography component="span" variant="body1">
                    /{selectedPlan.billing_period}
                  </Typography>
                )}
              </Typography>
              <Typography variant="body2" paragraph>
                {selectedPlan.description}
              </Typography>

              {currentSubscription && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  This will replace your current {currentSubscription.plan.name} plan.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubscribeDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={confirmSubscribe}
            disabled={subscribeMutation.isLoading}
          >
            {subscribeMutation.isLoading ? 'Processing...' : 'Confirm Subscription'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlansPage;
