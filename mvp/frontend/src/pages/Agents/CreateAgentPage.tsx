import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const CreateAgentPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Agent
        </Typography>
        <Typography variant="body1" color="textSecondary">
          This page will contain the agent creation form.
        </Typography>
      </Box>
    </Container>
  );
};

export default CreateAgentPage;
