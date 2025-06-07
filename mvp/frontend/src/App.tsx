import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Pages
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import AgentsPage from './pages/Agents/AgentsPage';
import AgentDetailsPage from './pages/Agents/AgentDetailsPage';
import CreateAgentPage from './pages/Agents/CreateAgentPage';
import ConversationsPage from './pages/Conversations/ConversationsPage';
import ConversationDetailsPage from './pages/Conversations/ConversationDetailsPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import PlansPage from './pages/Plans/PlansPage';
import DataManagementPage from './pages/Data/DataManagementPage';
import BusinessProfilePage from './pages/Business/BusinessProfilePage';
import VoiceSimulationPage from './pages/Voice/VoiceSimulationPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <LoadingSpinner />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <LoadingSpinner />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agents"
          element={
            <ProtectedRoute>
              <AgentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agents/create"
          element={
            <ProtectedRoute>
              <CreateAgentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/agents/:agentId"
          element={
            <ProtectedRoute>
              <AgentDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/data"
          element={
            <ProtectedRoute>
              <DataManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conversations"
          element={
            <ProtectedRoute>
              <ConversationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conversations/:conversationId"
          element={
            <ProtectedRoute>
              <ConversationDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/voice-simulation"
          element={
            <ProtectedRoute>
              <VoiceSimulationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/business/profile"
          element={
            <ProtectedRoute>
              <BusinessProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conversations/:conversationId"
          element={
            <ProtectedRoute>
              <ConversationDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectedRoute>
              <PlansPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
};

export default App;
