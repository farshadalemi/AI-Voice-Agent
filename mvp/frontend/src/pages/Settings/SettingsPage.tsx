import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const SettingsPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="textSecondary">
          This page will contain business settings and configuration options.
        </Typography>
      </Box>
    </Container>
  );
};

export default SettingsPage;
