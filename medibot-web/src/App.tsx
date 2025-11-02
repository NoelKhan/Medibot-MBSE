import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import { medibotTheme } from './theme/medibot-theme';
import { PatientRoute, MedicalStaffRoute, EmergencyRoute, StaffRoute } from './components/RoleGuards';

// Lazy load pages for better performance
const RoleSelectionPage = lazy(() => import('./pages/RoleSelectionPage'));
const PatientLoginPage = lazy(() => import('./pages/PatientLoginPage'));
const MedicalStaffLoginPage = lazy(() => import('./pages/MedicalStaffLoginPage'));
const EmergencyStaffLoginPage = lazy(() => import('./pages/EmergencyStaffLoginPage'));
const WelcomePage = lazy(() => import('./pages/WelcomePage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const DoctorsPage = lazy(() => import('./pages/DoctorsPage'));
const AppointmentsPage = lazy(() => import('./pages/AppointmentsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const CaseManagementPage = lazy(() => import('./pages/CaseManagementPage'));
const PatientRecordsPage = lazy(() => import('./pages/PatientRecordsPage'));
const EmergencyPage = lazy(() => import('./pages/EmergencyPage'));

// AI Agent Pages
const AIInsightsPanel = lazy(() => import('./pages/AI/AIInsightsPanel'));
const TriageDashboard = lazy(() => import('./pages/AI/TriageDashboard'));
const LiveMonitor = lazy(() => import('./pages/AI/LiveMonitor'));

// AI Chat Component
const AIChat = lazy(() => import('./components/AIChat'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

interface ProtectedRouteProps { children: React.ReactElement; }

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Box>Loading...</Box>;
  if (!isAuthenticated) return <Navigate to="/" replace />; // Redirect to role selection, not /login
  return children;
}

function PublicRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <Box>Loading...</Box>;
  
  // If already authenticated, redirect to role-appropriate page
  if (isAuthenticated && user) {
    if (user.role === 'patient') return <Navigate to="/home" replace />;
    if (user.role === 'doctor' || user.role === 'nurse') return <Navigate to="/cases" replace />;
    if (user.role === 'emergency') return <Navigate to="/emergency" replace />;
  }
  
  return children;
}

function App() {
  console.log('✅ MediBot App Component Loaded');
  console.log('📍 Current URL:', window.location.href);
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={medibotTheme}>
        <CssBaseline />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Box sx={{ textAlign: 'center' }}>Loading...</Box>
              </Box>
            }>
              <Routes>
                {/* Public Routes - Role Selection Flow */}
                <Route path="/" element={<RoleSelectionPage />} />
                <Route path="/login/patient" element={<PublicRoute><PatientLoginPage /></PublicRoute>} />
                <Route path="/login/staff" element={<PublicRoute><MedicalStaffLoginPage /></PublicRoute>} />
                <Route path="/login/emergency" element={<PublicRoute><EmergencyStaffLoginPage /></PublicRoute>} />
                
                {/* Legacy routes redirect to role selection */}
                <Route path="/login" element={<Navigate to="/" replace />} />
                <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                
                {/* Patient-Only Routes */}
                <Route path="/home" element={<PatientRoute><MainLayout><HomePage /></MainLayout></PatientRoute>} />
                <Route path="/chat" element={<PatientRoute><MainLayout><ChatPage /></MainLayout></PatientRoute>} />
                <Route path="/ai-chat" element={<PatientRoute><MainLayout><AIChat /></MainLayout></PatientRoute>} />
                <Route path="/doctors" element={<PatientRoute><MainLayout><DoctorsPage /></MainLayout></PatientRoute>} />
                <Route path="/appointments" element={<PatientRoute><MainLayout><AppointmentsPage /></MainLayout></PatientRoute>} />
                <Route path="/profile" element={<ProtectedRoute><MainLayout><ProfilePage /></MainLayout></ProtectedRoute>} />
                
                {/* Medical Staff Routes (Doctors & Nurses - Severity 1-4) */}
                <Route path="/cases" element={<MedicalStaffRoute><MainLayout><CaseManagementPage /></MainLayout></MedicalStaffRoute>} />
                <Route path="/records" element={<MedicalStaffRoute><MainLayout><PatientRecordsPage /></MainLayout></MedicalStaffRoute>} />
                
                {/* Emergency Staff Routes (Severity 4-5 ONLY) */}
                <Route path="/emergency" element={<EmergencyRoute><MainLayout><EmergencyPage /></MainLayout></EmergencyRoute>} />
                
                {/* AI Agent Features (All Staff) */}
                <Route path="/ai/insights" element={<StaffRoute><MainLayout><AIInsightsPanel /></MainLayout></StaffRoute>} />
                <Route path="/ai/cases" element={<StaffRoute><MainLayout><TriageDashboard /></MainLayout></StaffRoute>} />
                <Route path="/ai/monitor" element={<StaffRoute><MainLayout><LiveMonitor /></MainLayout></StaffRoute>} />
                
                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
