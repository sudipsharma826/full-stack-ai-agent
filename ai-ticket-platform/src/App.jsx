import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useUserStore from './store/useUserStore';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateTicket from './pages/CreateTicket';
import TicketDetails from './pages/TicketDetails';
import Tickets from './pages/Tickets';
import AllTickets from './pages/AllTickets';
import Users from './pages/Users';
import UpdateUser from './pages/UpdateUser';

function App() {
  const { isAuthenticated } = useUserStore();

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          <Route 
            path="/signup" 
            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />} 
          />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-ticket" 
            element={
              <ProtectedRoute>
                <CreateTicket />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ticket/:id" 
            element={
              <ProtectedRoute>
                <TicketDetails />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tickets" 
            element={
              <ProtectedRoute>
                <Tickets />
              </ProtectedRoute>
            } 
          />

          {/* Admin/Moderator Only Routes */}
          <Route 
            path="/all-tickets" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                <AllTickets />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                <Users />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/update-user" 
            element={
              <ProtectedRoute allowedRoles={['admin', 'moderator']}>
                <UpdateUser />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all route */}
          <Route 
            path="*" 
            element={
              isAuthenticated ? 
                <Navigate to="/dashboard" replace /> : 
                <Navigate to="/" replace />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;