import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
} from '@mui/material';

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';
  subtitle?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
}) => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={`${color}.main`}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: `${color}.light`,
              color: `${color}.main`,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
