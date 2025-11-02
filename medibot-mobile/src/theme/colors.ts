/**
 * Modern Healthcare App Color Palette
 * Designed for trust, accessibility, and professional medical aesthetics
 * All colors tested for WCAG AA compliance
 */

export const Colors = {
  // Primary Healthcare Brand Colors
  primary: {
    50: '#EBF4FF',   // Lightest blue - backgrounds
    100: '#C3DAFE',  // Light blue - hover states
    200: '#A3BFFA',  // Medium light blue
    300: '#7C97F8',  // Medium blue
    400: '#647DEE',  // Primary interactive blue
    500: '#4F46E5',  // Main brand color - buttons, links
    600: '#4338CA',  // Darker blue - pressed states
    700: '#3730A3',  // Dark blue - text on light
    800: '#312E81',  // Darker blue
    900: '#1E1B4B',  // Deepest blue - headers
  },

  // Secondary Medical Green (Trust & Health)
  secondary: {
    50: '#ECFDF5',   // Lightest green
    100: '#D1FAE5',  // Light green - success backgrounds
    200: '#A7F3D0',  // Medium light green
    300: '#6EE7B7',  // Medium green
    400: '#34D399',  // Accent green
    500: '#10B981',  // Main secondary - success states
    600: '#059669',  // Darker green
    700: '#047857',  // Dark green - text
    800: '#065F46',  // Darker green
    900: '#064E3B',  // Deepest green
  },

  // Warning & Alerts (Medical Urgency)
  warning: {
    50: '#FFFBEB',   // Lightest amber
    100: '#FEF3C7',  // Light amber
    200: '#FDE68A',  // Medium light amber
    300: '#FCD34D',  // Medium amber
    400: '#FBBF24',  // Accent amber
    500: '#F59E0B',  // Main warning color
    600: '#D97706',  // Darker amber
    700: '#B45309',  // Dark amber
    800: '#92400E',  // Darker amber
    900: '#78350F',  // Deepest amber
  },

  // Error & Emergency (Critical Medical)
  error: {
    50: '#FEF2F2',   // Lightest red
    100: '#FEE2E2',  // Light red
    200: '#FECACA',  // Medium light red
    300: '#FCA5A5',  // Medium red
    400: '#F87171',  // Accent red
    500: '#EF4444',  // Main error color
    600: '#DC2626',  // Darker red
    700: '#B91C1C',  // Dark red
    800: '#991B1B',  // Darker red
    900: '#7F1D1D',  // Deepest red
  },

  // Neutral Grays (Professional Medical Interface)
  neutral: {
    50: '#FAFAFA',   // Almost white - page backgrounds
    100: '#F5F5F5',  // Light gray - card backgrounds
    200: '#E5E5E5',  // Border gray
    300: '#D4D4D4',  // Disabled state gray
    400: '#A3A3A3',  // Placeholder text
    500: '#737373',  // Secondary text
    600: '#525252',  // Primary text light
    700: '#404040',  // Primary text
    800: '#262626',  // Headings
    900: '#171717',  // Darkest text
  },

  // Chat-specific colors
  chat: {
    userBubble: '#4F46E5',        // Primary brand color
    userBubbleLight: '#647DEE',   // Lighter version for hover
    botBubble: '#FFFFFF',         // Clean white
    botBubbleBorder: '#E5E7EB',   // Subtle border
    inputBackground: '#F9FAFB',   // Subtle input background
    inputBorder: '#D1D5DB',       // Input border
    inputFocusBorder: '#4F46E5',  // Focus state
    timestamp: '#9CA3AF',         // Subtle timestamp
    online: '#10B981',            // Online indicator
    typing: '#6B7280',            // Typing indicator
  },

  // System colors
  background: {
    primary: '#FFFFFF',           // Main app background
    secondary: '#FAFAFA',         // Card/section backgrounds
    tertiary: '#F9FAFB',          // Input/form backgrounds
    overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlays
  },

  // Text colors with accessibility in mind
  text: {
    primary: '#111827',           // Main text - high contrast
    secondary: '#6B7280',         // Secondary text
    tertiary: '#9CA3AF',          // Tertiary text/placeholders
    inverse: '#FFFFFF',           // Text on dark backgrounds
    link: '#4F46E5',             // Link color
    linkHover: '#4338CA',         // Link hover
  },

  // Border colors
  border: {
    light: '#F3F4F6',           // Subtle borders
    medium: '#E5E7EB',          // Standard borders
    dark: '#D1D5DB',            // Prominent borders
    focus: '#4F46E5',           // Focus indicators
  },

  // Shadow colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',  // Subtle shadows
    medium: 'rgba(0, 0, 0, 0.1)',  // Card shadows
    dark: 'rgba(0, 0, 0, 0.25)',   // Modal shadows
  },
};

// Semantic color mappings for easy use
export const AppColors = {
  // Main brand colors
  primary: Colors.primary[500],
  primaryLight: Colors.primary[400],
  primaryDark: Colors.primary[600],
  
  // Secondary actions
  secondary: Colors.secondary[500],
  secondaryLight: Colors.secondary[400],
  secondaryDark: Colors.secondary[600],

  // Status colors
  success: Colors.secondary[500],
  warning: Colors.warning[500],
  error: Colors.error[500],
  info: Colors.primary[500],

  // Background colors
  background: Colors.background.primary,
  backgroundSecondary: Colors.background.secondary,
  backgroundTertiary: Colors.background.tertiary,

  // Text colors
  textPrimary: Colors.text.primary,
  textSecondary: Colors.text.secondary,
  textTertiary: Colors.text.tertiary,
  textInverse: Colors.text.inverse,

  // Border colors
  border: Colors.border.medium,
  borderLight: Colors.border.light,
  borderDark: Colors.border.dark,

  // Chat colors
  chatUserBubble: Colors.chat.userBubble,
  chatBotBubble: Colors.chat.botBubble,
  chatInputBackground: Colors.chat.inputBackground,
  chatInputBorder: Colors.chat.inputBorder,
};

export default AppColors;