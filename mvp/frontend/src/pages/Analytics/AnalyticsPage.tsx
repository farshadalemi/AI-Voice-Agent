import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const AnalyticsPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Analytics
        </Typography>
        <Typography variant="body1" color="textSecondary">
          This page will show comprehensive analytics and reporting.
        </Typography>
      </Box>
    </Container>
  );
};

export default AnalyticsPage;
