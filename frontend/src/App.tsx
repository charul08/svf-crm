import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Layouts
import AppShell from './components/layout/AppShell';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// App pages
import DashboardPage from './pages/dashboard/DashboardPage';
import LeadsPage from './pages/leads/LeadsPage';
import ContactsPage from './pages/contacts/ContactsPage';
import AccountsPage from './pages/accounts/AccountsPage';
import DealsPage from './pages/deals/DealsPage';
import TasksPage from './pages/tasks/TasksPage';
import ActivitiesPage from './pages/activities/ActivitiesPage';
import ProductsPage from './pages/products/ProductsPage';
import QuotesPage from './pages/quotes/QuotesPage';
import CampaignsPage from './pages/campaigns/CampaignsPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import CalendarPage from './pages/calendar/CalendarPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid var(--bg-elevated)', borderTopColor: 'var(--color-primary-500)', borderRadius: '50%' }} />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected — App Shell wraps all authenticated pages */}
            <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="dashboard"   element={<DashboardPage />} />
              <Route path="leads"       element={<LeadsPage />} />
              <Route path="contacts"    element={<ContactsPage />} />
              <Route path="accounts"    element={<AccountsPage />} />
              <Route path="deals"       element={<DealsPage />} />
              <Route path="tasks"       element={<TasksPage />} />
              <Route path="activities"  element={<ActivitiesPage />} />
              <Route path="calendar"    element={<CalendarPage />} />
              <Route path="products"    element={<ProductsPage />} />
              <Route path="quotes"      element={<QuotesPage />} />
              <Route path="campaigns"   element={<CampaignsPage />} />
              <Route path="reports"     element={<ReportsPage />} />
              <Route path="settings"    element={<SettingsPage />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
