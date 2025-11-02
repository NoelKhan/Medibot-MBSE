/**
 * MediBot Theme Configuration
 * ===========================
 * Material-UI theme matching mobile app design system
 */

import { createTheme } from '@mui/material/styles';
import type { ThemeOptions } from '@mui/material/styles';

// Primary Healthcare Brand Colors (matching mobile app exactly)
const primaryColors = {
  50: '#EEF2FF',
  100: '#E0E7FF',
  200: '#C7D2FE',
  300: '#A5B4FC',
  400: '#818CF8',
  500: '#4F46E5',   // Main brand color - matches mobile
  600: '#4338CA',
  700: '#3730A3',
  800: '#312E81',
  900: '#1E1B4B',
};

// Secondary Medical Green (matching mobile app exactly)
const secondaryColors = {
  50: '#ECFDF5',
  100: '#D1FAE5',
  200: '#A7F3D0',
  300: '#6EE7B7',
  400: '#34D399',
  500: '#10B981',   // Main secondary - matches mobile
  600: '#059669',
  700: '#047857',
  800: '#065F46',
  900: '#064E3B',
};

// Warning & Alerts (matching mobile)
const warningColors = {
  50: '#FFFBEB',
  100: '#FEF3C7',
  200: '#FDE68A',
  300: '#FCD34D',
  400: '#FBBF24',
  500: '#F59E0B',
  600: '#D97706',
  700: '#B45309',
  800: '#92400E',
  900: '#78350F',
};

// Error & Emergency (matching mobile)
const errorColors = {
  50: '#FEF2F2',
  100: '#FEE2E2',
  200: '#FECACA',
  300: '#FCA5A5',
  400: '#F87171',
  500: '#EF4444',
  600: '#DC2626',
  700: '#B91C1C',
  800: '#991B1B',
  900: '#7F1D1D',
};

// Neutral Grays (matching mobile)
const neutralColors = {
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#E5E5E5',
  300: '#D4D4D4',
  400: '#A3A3A3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
};

const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: primaryColors[500],
      light: primaryColors[300],
      dark: primaryColors[700],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: secondaryColors[500],
      light: secondaryColors[300],
      dark: secondaryColors[700],
      contrastText: '#FFFFFF',
    },
    error: {
      main: errorColors[500],
      light: errorColors[300],
      dark: errorColors[700],
      contrastText: '#FFFFFF',
    },
    warning: {
      main: warningColors[500],
      light: warningColors[300],
      dark: warningColors[700],
      contrastText: '#FFFFFF',
    },
    info: {
      main: primaryColors[400],
      light: primaryColors[200],
      dark: primaryColors[600],
      contrastText: '#FFFFFF',
    },
    success: {
      main: secondaryColors[500],
      light: secondaryColors[300],
      dark: secondaryColors[700],
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: neutralColors[800],
      secondary: neutralColors[600],
      disabled: neutralColors[400],
    },
    divider: neutralColors[200],
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01562em',
      color: neutralColors[900],
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.00833em',
      color: neutralColors[900],
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '0em',
      color: neutralColors[800],
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '0.00735em',
      color: neutralColors[800],
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '0em',
      color: neutralColors[800],
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      letterSpacing: '0.0075em',
      color: neutralColors[800],
    },
    body1: {
      fontSize: '1rem',
      letterSpacing: '0.00938em',
      color: neutralColors[700],
    },
    body2: {
      fontSize: '0.875rem',
      letterSpacing: '0.01071em',
      color: neutralColors[600],
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.02857em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '1rem',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
        elevation2: {
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
        elevation3: {
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover fieldset': {
              borderColor: primaryColors[400],
            },
            '&.Mui-focused fieldset': {
              borderColor: primaryColors[500],
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
};

export const medibotTheme = createTheme(themeOptions);

// Dark theme variant
export const medibotDarkTheme = createTheme({
  ...themeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: primaryColors[400],
      light: primaryColors[300],
      dark: primaryColors[600],
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: secondaryColors[400],
      light: secondaryColors[300],
      dark: secondaryColors[600],
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0BEC5',
      disabled: '#616161',
    },
    divider: '#424242',
  },
});

// Export color constants for use in components
export const medibotColors = {
  primary: primaryColors,
  secondary: secondaryColors,
  warning: warningColors,
  error: errorColors,
  neutral: neutralColors,
  
  // Chat-specific colors (matching mobile)
  chat: {
    userBubble: primaryColors[500],
    userBubbleLight: primaryColors[400],
    botBubble: '#FFFFFF',
    botBubbleBorder: '#E5E7EB',
    inputBackground: '#F9FAFB',
    inputBorder: '#D1D5DB',
    inputFocusBorder: primaryColors[500],
    timestamp: '#9CA3AF',
    online: secondaryColors[500],
    typing: '#6B7280',
  },
  
  // Status colors
  status: {
    emergency: errorColors[500],
    highSeverity: warningColors[600],
    recommendation: warningColors[400],
    selfCare: secondaryColors[500],
    online: secondaryColors[500],
    offline: neutralColors[400],
  },
};
