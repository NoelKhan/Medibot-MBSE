/**
 * Responsive Design Utilities for MediBot
 * Ensures consistent experience across web, iOS, and Android platforms
 */

import { Platform, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Screen size breakpoints
export const breakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  large: 1200,
};

// Get current device type (mobile only)
export const getDeviceType = () => {
  return Platform.OS; // 'ios' or 'android'
};

// Responsive spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

// Platform-specific shadows
export const shadows = {
  small: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
    web: {
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    },
  }),
  medium: Platform.select({
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
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
    },
  }),
  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
    },
    android: {
      elevation: 8,
    },
    web: {
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
    },
  }),
};

// Responsive typography
export const typography = {
  h1: {
    fontSize: Platform.select({
      ios: 32,
      android: 32,
      web: screenWidth > breakpoints.tablet ? 36 : 32,
    }),
    fontWeight: '700' as const,
    lineHeight: Platform.select({
      ios: 40,
      android: 40,
      web: screenWidth > breakpoints.tablet ? 44 : 40,
    }),
  },
  h2: {
    fontSize: Platform.select({
      ios: 24,
      android: 24,
      web: screenWidth > breakpoints.tablet ? 28 : 24,
    }),
    fontWeight: '600' as const,
    lineHeight: Platform.select({
      ios: 32,
      android: 32,
      web: screenWidth > breakpoints.tablet ? 36 : 32,
    }),
  },
  h3: {
    fontSize: Platform.select({
      ios: 20,
      android: 20,
      web: screenWidth > breakpoints.tablet ? 22 : 20,
    }),
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

// Color palette with accessibility support
export const colors = {
  primary: '#2196F3',
  primaryDark: '#1976D2',
  primaryLight: '#BBDEFB',
  
  secondary: '#4CAF50',
  secondaryDark: '#388E3C',
  secondaryLight: '#C8E6C9',
  
  accent: '#FF9800',
  accentDark: '#F57C00',
  accentLight: '#FFE0B2',
  
  error: '#F44336',
  errorDark: '#D32F2F',
  errorLight: '#FFCDD2',
  
  warning: '#FF9500',
  warningDark: '#E68900',
  warningLight: '#FFE4B3',
  
  success: '#34C759',
  successDark: '#2E7D32',
  successLight: '#E8F5E8',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#E0E0E0',
  gray400: '#BDBDBD',
  gray500: '#9E9E9E',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  
  // Background colors
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F5F5F5',
  
  // Text colors
  textPrimary: '#212121',
  textSecondary: '#757575',
  textTertiary: '#9E9E9E',
  textInverse: '#FFFFFF',
};

// Input field styles
export const inputStyles = {
  base: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    fontSize: typography.body.fontSize,
    backgroundColor: colors.surface,
    ...Platform.select({
      ios: {
        paddingVertical: spacing.md,
      },
      android: {
        paddingVertical: spacing.sm,
      },
      web: {
        paddingVertical: spacing.md,
        outline: 'none',
        ':focus': {
          borderColor: colors.primary,
          boxShadow: `0 0 0 3px ${colors.primaryLight}`,
        },
      },
    }),
  },
  error: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight + '20', // 20% opacity
  },
  success: {
    borderColor: colors.success,
    backgroundColor: colors.successLight + '20',
  },
};

// Button styles
export const buttonStyles = {
  primary: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.medium,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.small,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md - 1, // Adjust for border
    paddingHorizontal: spacing.lg,
  },
  text: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
};

// Container styles for responsive layout
export const containerStyles = {
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    ...Platform.select({
      web: {
        maxWidth: breakpoints.desktop,
        alignSelf: 'center' as const,
        width: '100%',
      },
    }),
  },
  content: {
    padding: spacing.md,
    ...Platform.select({
      web: {
        padding: screenWidth > breakpoints.tablet ? spacing.lg : spacing.md,
      },
    }),
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    ...shadows.medium,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    ...shadows.small,
  },
};

// Accessibility helpers
export const accessibilityHelpers = {
  touchTarget: {
    minHeight: 44,
    minWidth: 44,
  },
  largeText: {
    fontSize: typography.body.fontSize * 1.2,
    lineHeight: typography.body.lineHeight * 1.2,
  },
  highContrast: {
    primary: '#0D47A1', // Darker blue for better contrast
    secondary: '#2E7D32', // Darker green
    error: '#C62828', // Darker red
  },
};

// Animation configurations
export const animations = {
  fast: 200,
  medium: 300,
  slow: 500,
  
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
  
  spring: {
    tension: 100,
    friction: 7,
  },
};

// Layout helpers
export const layout = {
  isTablet: screenWidth >= breakpoints.tablet,
  isDesktop: false,
  isMobile: Platform.OS !== 'web' || screenWidth < breakpoints.tablet,
  
  // Safe area helpers
  safeArea: Platform.select({
    ios: {
      paddingTop: 44, // Status bar + nav bar on iOS
    },
    android: {
      paddingTop: 0, // Handled by SafeAreaView
    },
    web: {
      paddingTop: 0,
    },
  }),
  
  // Common layout patterns
  centerContent: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  
  spaceBetween: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  
  column: {
    flexDirection: 'column' as const,
  },
};

// Export utility function to merge platform-specific styles
export const createResponsiveStyle = (baseStyle: any, platformStyles?: any) => {
  if (!platformStyles) return baseStyle;
  
  const platformStyle = Platform.select(platformStyles) || {};
  return {
    ...baseStyle,
    ...platformStyle,
  };
};

export default {
  breakpoints,
  getDeviceType,
  spacing,
  shadows,
  typography,
  colors,
  inputStyles,
  buttonStyles,
  containerStyles,
  accessibilityHelpers,
  animations,
  layout,
  createResponsiveStyle,
};