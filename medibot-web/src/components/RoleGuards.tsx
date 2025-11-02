/**
 * Role-Based Route Guards
 * =========================
 * Components to protect routes based on user role
 * Prevents unauthorized access to role-specific pages
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, User } from '../contexts/AuthContext';
import { Box, CircularProgress } from '@mui/material';

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: User['role'][];
  redirectTo?: string;
}

/**
 * Generic role-based route guard
 * Checks if user has one of the allowed roles
 */
export const RoleRoute: React.FC<RoleRouteProps> = ({ 
  children, 
  allowedRoles,
  redirectTo = '/' 
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to role selection if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check if user's role is allowed
  if (!allowedRoles.includes(user.role)) {
    console.warn(`Access denied: User role "${user.role}" not in allowed roles:`, allowedRoles);
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

/**
 * Patient-only route guard
 * Only allows users with role: 'patient'
 */
export const PatientRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <RoleRoute allowedRoles={['patient']} redirectTo="/">
      {children}
    </RoleRoute>
  );
};

/**
 * Medical Staff route guard
 * Allows doctors and nurses (Severity 1-4 cases)
 */
export const MedicalStaffRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <RoleRoute allowedRoles={['doctor', 'nurse']} redirectTo="/">
      {children}
    </RoleRoute>
  );
};

/**
 * Emergency Staff route guard
 * Only allows emergency operators (Severity 4-5 cases ONLY)
 */
export const EmergencyRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <RoleRoute allowedRoles={['emergency']} redirectTo="/">
      {children}
    </RoleRoute>
  );
};

/**
 * Staff route guard (any staff member)
 * Allows all staff types: doctors, nurses, emergency
 */
export const StaffRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <RoleRoute allowedRoles={['doctor', 'nurse', 'emergency', 'staff']} redirectTo="/">
      {children}
    </RoleRoute>
  );
};

/**
 * Admin-only route guard
 */
export const AdminRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <RoleRoute allowedRoles={['admin']} redirectTo="/">
      {children}
    </RoleRoute>
  );
};

/**
 * Helper function to check if user has specific role
 * Useful for conditional rendering within components
 */
export const hasRole = (user: User | null, roles: User['role'][]): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};

/**
 * Helper function to get user role display name
 */
export const getRoleDisplayName = (role: User['role']): string => {
  const roleNames = {
    patient: 'Patient',
    doctor: 'Medical Staff (Doctor)',
    nurse: 'Medical Staff (Nurse)',
    emergency: 'Emergency Staff',
    staff: 'Staff',
    admin: 'Administrator',
  };
  return roleNames[role] || role;
};
