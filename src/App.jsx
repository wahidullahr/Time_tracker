import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import EmployeeTracker from './components/EmployeeTracker';
import ErrorBoundary from './components/ErrorBoundary';

const AppContent = () => {
  const { currentUser, login, isAdmin } = useAuth();

  if (!currentUser) {
    return <Login onLogin={login} />;
  }

  return isAdmin ? <AdminDashboard /> : <EmployeeTracker />;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
