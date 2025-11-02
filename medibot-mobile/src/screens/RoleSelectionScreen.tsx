/**
 * ROLE SELECTION SCREEN
 * =====================
 * Initial screen where users choose their role: Patient or Medical Staff
 * 
 * Features:
 * - Clean, simple two-option interface
 * - Remembers choice in AsyncStorage
 * - Can be accessed anytime to change role
 * - Theme-aware styling
 * - Mobile-first, web-compatible
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import ErrorBoundary from '../components/ErrorBoundary';
import { MIGRATION_CONFIG } from '../config/FeatureFlags';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import { createLogger } from '../services/Logger';

const logger = createLogger('RoleSelectionScreen');

interface RoleSelectionScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ navigation }) => {
  const { colors, isDark, theme, toggleTheme } = useTheme();
  const responsive = useResponsive();
  const styles = createStyles(colors, isDark, responsive);
  
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'patient' | 'staff' | 'emergency' | null>(null);

  React.useEffect(() => {
    trackScreen('RoleSelectionScreen');
  }, []);

  const handleRoleSelection = async (role: 'patient' | 'staff' | 'emergency') => {
    setSelectedRole(role);
    setLoading(true);

    // Track role selection
    Analytics.track(AnalyticsEvent.FEATURE_USED, {
      feature: 'role_selection',
      roleSelected: role,
      source: 'role_selection_screen'
    });

    try {
      // Save role preference to AsyncStorage
      if (MIGRATION_CONFIG.REMEMBER_ROLE_PREFERENCE) {
        await AsyncStorage.setItem('userRolePreference', role);
        logger.info('Role preference saved', { role });
      }

      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 300));

      // Navigate based on role selection
      if (role === 'patient') {
        navigation.navigate('PatientLogin');
      } else if (role === 'staff') {
        navigation.navigate('MedicalStaffLogin');
      } else {
        navigation.navigate('EmergencyStaffLogin');
      }
    } catch (error) {
      logger.error('Error saving role preference', error);
      // Still navigate even if storage fails
      if (role === 'patient') {
        navigation.navigate('PatientLogin');
      } else if (role === 'staff') {
        navigation.navigate('MedicalStaffLogin');
      } else {
        navigation.navigate('EmergencyStaffLogin');
      }
    } finally {
      setLoading(false);
      setSelectedRole(null);
    }
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return 'light-mode';
      case 'dark': return 'dark-mode';
      default: return 'brightness-auto';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Theme Toggle */}
      <TouchableOpacity 
        style={styles.themeToggle}
        onPress={toggleTheme}
      >
        <MaterialIcons name={getThemeIcon()} size={20} color={colors.primary} />
        <Text style={styles.themeText}>{theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Auto'}</Text>
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Logo & Title */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="medical-services" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>MediBot</Text>
          <Text style={styles.subtitle}>Choose Your Role</Text>
        </View>

        {/* Role Selection Cards */}
        <View style={styles.rolesContainer}>
          {/* Patient Role */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              styles.patientCard,
              selectedRole === 'patient' && styles.roleCardSelected,
            ]}
            onPress={() => handleRoleSelection('patient')}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={styles.roleHeader}>
              <MaterialIcons name="person" size={32} color="#FFFFFF" />
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>Patient</Text>
                <Text style={styles.roleDescription}>
                  Healthcare services & AI assistant
                </Text>
              </View>
              {loading && selectedRole === 'patient' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          {/* Medical Staff Role */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              styles.staffCard,
              selectedRole === 'staff' && styles.roleCardSelected,
            ]}
            onPress={() => handleRoleSelection('staff')}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={styles.roleHeader}>
              <MaterialIcons name="medical-services" size={32} color="#FFFFFF" />
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>Medical Staff</Text>
                <Text style={styles.roleDescription}>
                  Professional portal for healthcare providers
                </Text>
              </View>
              {loading && selectedRole === 'staff' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>

          {/* Emergency Staff Role */}
          <TouchableOpacity
            style={[
              styles.roleCard,
              styles.emergencyCard,
              selectedRole === 'emergency' && styles.roleCardSelected,
            ]}
            onPress={() => handleRoleSelection('emergency')}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={styles.roleHeader}>
              <MaterialIcons name="emergency" size={32} color="#FFFFFF" />
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>Emergency Staff</Text>
                <Text style={styles.roleDescription}>
                  Emergency response & rapid triage
                </Text>
              </View>
              {loading && selectedRole === 'emergency' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Note */}
        <View style={styles.emergencyNote}>
          <MaterialIcons name="info" size={20} color={colors.textSecondary} />
          <Text style={styles.emergencyText}>
            Select your role to access the appropriate portal and features
          </Text>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          ⚠️ MediBot provides health information for educational purposes only.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any, isDark: boolean, responsive: any) => {
  const isLandscape = responsive.isLandscape;
  const isTablet = responsive.isTablet;
  const contentWidth = Math.min(responsive.width - 40, 600);
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    themeToggle: {
      position: 'absolute',
      top: Platform.select({ web: 20, ios: 60, android: 20 }),
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      zIndex: 10,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
        web: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      }),
    },
    themeText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 6,
    },
    content: {
      flexGrow: 1,
      paddingHorizontal: isTablet ? 40 : 20,
      paddingVertical: 20,
      paddingTop: isTablet ? 100 : 80,
      alignItems: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: isLandscape && !isTablet ? 12 : 16,
    },
    logoContainer: {
      width: isTablet ? 100 : 80,
      height: isTablet ? 100 : 80,
      borderRadius: isTablet ? 50 : 40,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: isLandscape && !isTablet ? 8 : 12,
    },
    title: {
      fontSize: isTablet ? 32 : 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: isTablet ? 17 : 15,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    description: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    rolesContainer: {
      width: contentWidth,
      maxWidth: isTablet ? 1200 : contentWidth,
      flexDirection: 'column', // Always column for consistent layout
      gap: isLandscape && !isTablet ? 10 : 16,
      marginBottom: 12,
    },
    roleCard: {
      padding: 16,
      borderRadius: 12,
      minHeight: isLandscape && !isTablet ? 70 : 90,
      justifyContent: 'space-between',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
        },
        android: {
          elevation: 4,
        },
        web: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'transform 0.2s',
          cursor: 'pointer',
        },
      }),
    },
    roleCardSelected: {
      transform: [{ scale: 0.98 }],
      opacity: 0.9,
    },
    patientCard: {
      backgroundColor: '#667EEA',
    },
    staffCard: {
      backgroundColor: '#34C759',
    },
    emergencyCard: {
      backgroundColor: '#FF4444',
    },
    roleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    roleTextContainer: {
      flex: 1,
    },
    roleIconContainer: {
      alignSelf: isLandscape && !isTablet ? 'flex-start' : 'center',
      marginBottom: isLandscape && !isTablet ? 8 : 16,
    },
    roleTitle: {
      fontSize: isTablet ? 19 : 17,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 3,
    },
    roleDescription: {
      fontSize: isTablet ? 13 : 12,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    roleFeatures: {
      gap: 10,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    featureText: {
      fontSize: 13,
      color: '#FFFFFF',
      fontWeight: '500',
    },
    loader: {
      marginTop: 12,
    },
    emergencyNote: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
      paddingHorizontal: 16,
      gap: 8,
    },
    emergencyText: {
      flex: 1,
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    disclaimer: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
      padding: 20,
      fontStyle: 'italic',
    },
  });
};

const RoleSelectionScreenWithErrorBoundary: React.FC<RoleSelectionScreenProps> = (props) => (
  <ErrorBoundary>
    <RoleSelectionScreen {...props} />
  </ErrorBoundary>
);

export default RoleSelectionScreenWithErrorBoundary;
