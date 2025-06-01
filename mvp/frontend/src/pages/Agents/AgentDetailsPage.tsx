import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const AgentDetailsPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Agent Details
        </Typography>
        <Typography variant="body1" color="textSecondary">
          This page will show detailed agent configuration and analytics.
        </Typography>
      </Box>
    </Container>
  );
};

export default AgentDetailsPage;
