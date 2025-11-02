/**
 * ROLE-BASED ACCESS CONTROL (RBAC) UTILITIES
 * ==========================================
 * Enforce strict separation between patient and staff portals
 * Prevent role leakage and unauthorized access
 */

import { User, UserRole } from '../types/User';
import { authService } from '../services/auth/AuthService';
import { createLogger } from '../services/Logger';

const logger = createLogger('RoleGuard');

export class RoleGuard {
  private static authService = authService;

  /**
   * Check if user has staff role
   */
  static isStaff(user: User | null): boolean {
    if (!user) return false;
    return [
      UserRole.DOCTOR,
      UserRole.NURSE,
      UserRole.EMT,
      UserRole.PHARMACIST,
      UserRole.ADMIN,
    ].includes(user.role);
  }

  /**
   * Check if user is a patient
   */
  static isPatient(user: User | null): boolean {
    if (!user) return false;
    return user.role === UserRole.PATIENT || user.role === UserRole.GUEST;
  }

  /**
   * Check if user is emergency staff
   */
  static isEmergencyStaff(user: User | null): boolean {
    if (!user) return false;
    return user.role === UserRole.EMT;
  }

  /**
   * Check if user is medical staff (doctor/nurse/pharmacist)
   */
  static isMedicalStaff(user: User | null): boolean {
    if (!user) return false;
    return [
      UserRole.DOCTOR,
      UserRole.NURSE,
      UserRole.PHARMACIST,
    ].includes(user.role);
  }

  /**
   * Enforce patient-only access
   * Returns true if authorized, false if not (and shows alert)
   */
  static requirePatient(user: User | null, navigation: any): boolean {
    if (!user) {
      const shouldLogin = window.confirm('Authentication Required: Please login to access this feature.');
      if (shouldLogin) {
        navigation.replace('RoleSelection');
      }
      return false;
    }

    if (this.isStaff(user)) {
      const shouldLogout = window.confirm('Access Denied: Staff members cannot access patient features. Please login as a patient or use the staff portal.');
      if (shouldLogout) {
        this.authService.logout().then(() => {
          navigation.replace('RoleSelection');
        });
      }
      return false;
    }

    return true;
  }

  /**
   * Enforce staff-only access
   * Returns true if authorized, false if not (and shows alert)
   */
  static requireStaff(user: User | null, navigation: any): boolean {
    if (!user) {
      const shouldLogin = window.confirm('Authentication Required: Please login to access staff features.');
      if (shouldLogin) {
        navigation.replace('RoleSelection');
      }
      return false;
    }

    if (!this.isStaff(user)) {
      const shouldLogout = window.confirm('Access Denied: This feature is only available to staff members. Please login with a staff account.');
      if (shouldLogout) {
        this.authService.logout().then(() => {
          navigation.replace('RoleSelection');
        });
      }
      return false;
    }

    return true;
  }

  /**
   * Get appropriate portal for user role
   */
  static getPortalForRole(user: User): string {
    if (this.isStaff(user)) {
      return 'StaffDashboard';
    }
    return 'Welcome';
  }

  /**
   * Force logout and redirect to role selection
   */
  static async forceLogout(navigation: any, reason?: string): Promise<void> {
    try {
      await this.authService.logout();
      navigation.replace('RoleSelection');
      
      if (reason) {
        setTimeout(() => {
          window.alert(`Session Ended: ${reason}`);
        }, 500);
      }
    } catch (error) {
      logger.error('Force logout error', error as Error);
      navigation.replace('RoleSelection');
    }
  }

  /**
   * Validate user session and role on screen mount
   * Call this in useEffect of protected screens
   */
  static validateSession(
    user: User | null,
    requiredRole: 'patient' | 'staff' | 'emergency' | 'medical',
    navigation: any
  ): boolean {
    if (!user) {
      this.forceLogout(navigation, 'Please login to continue.');
      return false;
    }

    switch (requiredRole) {
      case 'patient':
        return this.requirePatient(user, navigation);
      case 'staff':
        return this.requireStaff(user, navigation);
      case 'emergency':
        if (!this.isEmergencyStaff(user)) {
          this.forceLogout(navigation, 'This feature requires emergency staff credentials.');
          return false;
        }
        return true;
      case 'medical':
        if (!this.isMedicalStaff(user)) {
          this.forceLogout(navigation, 'This feature requires medical staff credentials.');
          return false;
        }
        return true;
      default:
        return false;
    }
  }
}

export default RoleGuard;
