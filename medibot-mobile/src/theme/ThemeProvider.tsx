/**
 * Global Theme Provider for MediBot Healthcare App
 * Provides consistent theming and styling across all components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { Colors, AppColors } from './colors';

interface ThemeContextType {
  colors: typeof Colors;
  appColors: typeof AppColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  typography: {
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
    weights: {
      normal: '400';
      medium: '500';
      semibold: '600';
      bold: '700';
      extrabold: '800';
    };
    lineHeights: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

const defaultTheme: ThemeContextType = {
  colors: Colors,
  appColors: AppColors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7,
    },
  },
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  shadows: {
    sm: `0 1px 3px ${Colors.shadow.light}`,
    md: `0 4px 8px ${Colors.shadow.medium}`,
    lg: `0 8px 16px ${Colors.shadow.dark}`,
  },
};

const ThemeContext = createContext<ThemeContextType>(defaultTheme);

interface ThemeProviderProps {
  children: ReactNode;
  theme?: Partial<ThemeContextType>;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  theme = {} 
}) => {
  const mergedTheme = {
    ...defaultTheme,
    ...theme,
  };

  return (
    <ThemeContext.Provider value={mergedTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hooks for specific theme parts
export const useColors = () => {
  const { colors, appColors } = useTheme();
  return { colors, appColors };
};

export const useSpacing = () => {
  const { spacing } = useTheme();
  return spacing;
};

export const useTypography = () => {
  const { typography } = useTheme();
  return typography;
};

// Common style generators using theme
export const createThemedStyles = (theme: ThemeContextType) => ({
  // Common container styles
  container: {
    backgroundColor: theme.colors.background.primary,
    flex: 1,
  },
  
  card: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Button styles
  primaryButton: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  secondaryButton: {
    backgroundColor: theme.colors.background.primary,
    borderWidth: 2,
    borderColor: theme.colors.primary[500],
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Text styles
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.sizes.xxl * theme.typography.lineHeights.tight,
  },

  subtitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.sizes.lg * theme.typography.lineHeights.normal,
  },

  body: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.normal,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.sizes.md * theme.typography.lineHeights.normal,
  },

  // Input styles
  input: {
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text.primary,
  },

  inputFocused: {
    borderColor: theme.colors.primary[500],
    backgroundColor: theme.colors.background.primary,
  },
});

export default ThemeProvider;