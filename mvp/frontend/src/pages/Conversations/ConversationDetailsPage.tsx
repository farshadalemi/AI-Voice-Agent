import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const ConversationDetailsPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Conversation Details
        </Typography>
        <Typography variant="body1" color="textSecondary">
          This page will show detailed conversation transcript and analytics.
        </Typography>
      </Box>
    </Container>
  );
};

export default ConversationDetailsPage;
