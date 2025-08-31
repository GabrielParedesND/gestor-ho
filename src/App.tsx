import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { Dashboard } from './pages/Dashboard';
import { Voting } from './pages/Voting';
import { Leaderboard } from './pages/Leaderboard';
import { Grants } from './pages/Grants';
import { Initiatives } from './pages/Initiatives';
import { Results } from './pages/Results';
import { Audit } from './pages/Audit';
import { Users } from './pages/Users';
import { Periods } from './pages/Periods';
import { Settings } from './pages/Settings';
import { Calendar } from './pages/Calendar';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  useDocumentTitle(); // Actualizar título dinámicamente

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/voting" element={<ProtectedRoute><Voting /></ProtectedRoute>} />
      <Route path="/initiatives" element={<ProtectedRoute><Initiatives /></ProtectedRoute>} />
      <Route path="/grants" element={<ProtectedRoute><Grants /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute><Audit /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/periods" element={<ProtectedRoute><Periods /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <AppRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;