import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth } from './components/RequireAuth';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportEmergencyPage } from './pages/ReportEmergencyPage';
import { EmergencyDetailPage } from './pages/EmergencyDetailPage';
import { DispatcherBoardPage } from './pages/DispatcherBoardPage';
import { DepartmentCasesPage } from './pages/DepartmentCasesPage';
import { AdminPanelPage } from './pages/AdminPanelPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/emergencies/report"
            element={
              <RequireAuth allowedRoles={['Citizen']}>
                <ReportEmergencyPage />
              </RequireAuth>
            }
          />
          <Route
            path="/emergencies/:id"
            element={
              <RequireAuth>
                <EmergencyDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/dispatcher"
            element={
              <RequireAuth allowedRoles={['Dispatcher']}>
                <DispatcherBoardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/cases"
            element={
              <RequireAuth allowedRoles={['Responder']}>
                <DepartmentCasesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth allowedRoles={['Admin']}>
                <AdminPanelPage />
              </RequireAuth>
            }
          />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
