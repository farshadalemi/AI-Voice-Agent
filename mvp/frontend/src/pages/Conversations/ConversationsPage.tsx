import React from 'react';
import { Container, Typography, Box } from '@mui/material';

const ConversationsPage: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Conversations
        </Typography>
        <Typography variant="body1" color="textSecondary">
          This page will show all conversations and call history.
        </Typography>
      </Box>
    </Container>
  );
};

export default ConversationsPage;
