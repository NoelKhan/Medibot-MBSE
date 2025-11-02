import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  DimensionValue,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * ENHANCED UI COMPONENTS - PRODUCTION READY
 * =======================================
 * Standardized loading components for consistent UX across the app
 */

interface StandardLoadingProps {
  message?: string;
  type?: 'screen' | 'action' | 'critical' | 'overlay';
  size?: 'small' | 'large';
  color?: string;
  overlay?: boolean;
  style?: ViewStyle;
}

export const StandardLoadingSpinner: React.FC<StandardLoadingProps> = ({
  message = 'Loading...',
  type = 'action',
  size = 'large',
  color,
  overlay = false,
  style,
}) => {
  const getLoadingColor = () => {
    if (color) return color;
    switch (type) {
      case 'critical':
        return '#FF4444';
      case 'screen':
        return '#2196F3';
      default:
        return '#2196F3';
    }
  };

  const containerStyle = [
    styles.container,
    overlay && styles.overlay,
    type === 'screen' && styles.screenContainer,
    style,
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.loadingContent}>
        <ActivityIndicator 
          size={size} 
          color={getLoadingColor()}
          style={styles.spinner}
        />
        {message && (
          <Text style={[
            styles.loadingText,
            type === 'critical' && styles.criticalText
          ]}>
            {message}
          </Text>
        )}
        {type === 'critical' && (
          <MaterialIcons 
            name="warning" 
            size={16} 
            color="#FF4444" 
            style={styles.warningIcon}
          />
        )}
      </View>
    </View>
  );
};

/**
 * ERROR BOUNDARY FALLBACK COMPONENT
 * ================================
 * Provides user-friendly error display with recovery options
 */
interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  context?: string;
}

export const ErrorFallbackComponent: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  context = 'Application',
}) => {
  return (
    <View style={styles.errorContainer}>
      <MaterialIcons name="error-outline" size={64} color="#FF4444" />
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>
        {context} encountered an unexpected error. Please try again.
      </Text>
      
      {__DEV__ && error && (
        <View style={styles.errorDetails}>
          <Text style={styles.errorDetailsTitle}>Error Details (Dev Mode):</Text>
          <Text style={styles.errorDetailsText}>{error.message}</Text>
        </View>
      )}
      
      {resetError && (
        <View style={styles.errorActions}>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={resetError}
          >
            <MaterialIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

/**
 * ACCESSIBILITY ENHANCED WRAPPER
 * =============================
 * Adds comprehensive accessibility features to any component
 */
interface AccessibilityWrapperProps {
  children: React.ReactNode;
  label?: string;
  hint?: string;
  role?: 'button' | 'text' | 'image' | 'link' | 'search' | 'none';
  disabled?: boolean;
  testID?: string;
  style?: ViewStyle;
}

export const AccessibilityWrapper: React.FC<AccessibilityWrapperProps> = ({
  children,
  label,
  hint,
  role = 'button',
  disabled = false,
  testID,
  style,
}) => {
  return (
    <View
      style={[style, disabled && styles.disabledComponent]}
      accessible={true}
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityRole={role}
      accessibilityState={{ disabled }}
      testID={testID}
    >
      {children}
    </View>
  );
};

/**
 * RESPONSIVE CONTAINER
 * ===================
 * Adapts to different screen sizes and orientations
 */
interface ResponsiveContainerProps {
  children: React.ReactNode;
  padding?: 'small' | 'medium' | 'large';
  maxWidth?: number;
  centerContent?: boolean;
  style?: ViewStyle;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  padding = 'medium',
  maxWidth = 600,
  centerContent = false,
  style,
}) => {
  const paddingValue = {
    small: 8,
    medium: 16,
    large: 24,
  }[padding];

  const containerStyle = [
    {
      padding: paddingValue,
      maxWidth,
      width: '100%' as DimensionValue,
    },
    centerContent && styles.centeredContainer,
    style,
  ];

  return (
    <View style={containerStyle}>
      {children}
    </View>
  );
};

/**
 * MEDICAL STATUS INDICATOR
 * ========================
 * Shows medical urgency and status with appropriate colors
 */
interface MedicalStatusProps {
  severity: 1 | 2 | 3 | 4 | 5;
  status?: 'active' | 'completed' | 'emergency' | 'follow_up';
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const MedicalStatusIndicator: React.FC<MedicalStatusProps> = ({
  severity,
  status = 'active',
  showText = true,
  size = 'medium',
}) => {
  const getStatusColor = () => {
    if (status === 'emergency') return '#FF4444';
    if (severity >= 4) return '#FF6B35';
    if (severity === 3) return '#FFA500';
    return '#4CAF50';
  };

  const getStatusText = () => {
    if (status === 'emergency') return 'EMERGENCY';
    if (severity >= 4) return 'URGENT';
    if (severity === 3) return 'MODERATE';
    return 'ROUTINE';
  };

  const iconSize = { small: 16, medium: 20, large: 24 }[size];
  const textStyle = [
    styles.statusText,
    { color: getStatusColor() },
    size === 'small' && styles.smallStatusText,
    size === 'large' && styles.largeStatusText,
  ];

  return (
    <View style={styles.statusContainer}>
      <MaterialIcons 
        name={status === 'emergency' ? 'warning' : 'health-and-safety'}
        size={iconSize}
        color={getStatusColor()}
      />
      {showText && (
        <Text style={textStyle}>
          {getStatusText()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Loading Styles
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  screenContainer: {
    backgroundColor: '#F5F5F5',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  spinner: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  criticalText: {
    color: '#FF4444',
    fontWeight: 'bold',
  },
  warningIcon: {
    marginTop: 4,
  },

  // Error Styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F5F5F5',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4444',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorDetails: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#FF4444',
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF4444',
    marginBottom: 8,
  },
  errorDetailsText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Accessibility Styles
  disabledComponent: {
    opacity: 0.5,
  },

  // Responsive Styles
  centeredContainer: {
    alignSelf: 'center',
  },

  // Status Indicator Styles
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  smallStatusText: {
    fontSize: 10,
  },
  largeStatusText: {
    fontSize: 14,
  },
});

export default {
  StandardLoadingSpinner,
  ErrorFallbackComponent,
  AccessibilityWrapper,
  ResponsiveContainer,
  MedicalStatusIndicator,
};