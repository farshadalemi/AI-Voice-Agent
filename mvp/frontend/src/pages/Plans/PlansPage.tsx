import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const PlansPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Subscription Plans
        </Typography>
        <Typography variant="body1" color="textSecondary">
          This page will show available plans and billing information.
        </Typography>
      </Box>
    </Container>
  );
};

export default PlansPage;
