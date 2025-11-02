import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from '../services/Logger';

const logger = createLogger('ThemeContext');

export type Theme = 'light' | 'dark' | 'auto';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  notification: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  emergency: string;
  highSeverity: string;
  recommendation: string;
  selfCare: string;
}

const lightColors: ThemeColors = {
  primary: '#4F46E5',        // Modern indigo - professional and trustworthy
  secondary: '#10B981',      // Medical green - health and wellness
  background: '#F9FAFB',     // Soft gray background - easy on eyes
  surface: '#FFFFFF',        // Pure white surfaces
  card: '#FFFFFF',          // White cards with shadows
  text: '#111827',          // Near black - excellent readability
  textSecondary: '#6B7280', // Medium gray - clear hierarchy
  border: '#E5E7EB',        // Light gray borders - subtle separation
  notification: '#3B82F6',  // Bright blue - attention grabbing
  error: '#EF4444',         // Clear red - errors and danger
  success: '#10B981',       // Green - success and confirmation
  warning: '#F59E0B',       // Amber - warnings and caution
  info: '#3B82F6',          // Blue - informational messages
  emergency: '#DC2626',     // Dark red - critical emergencies
  highSeverity: '#EA580C',  // Orange-red - high priority
  recommendation: '#8B5CF6', // Purple - AI recommendations
  selfCare: '#059669',      // Deep green - self-care actions
};

const darkColors: ThemeColors = {
  primary: '#818CF8',        // Light indigo - visible on dark
  secondary: '#34D399',      // Light green - maintains meaning
  background: '#111827',     // Very dark blue-gray - comfortable
  surface: '#1F2937',        // Dark gray surfaces
  card: '#374151',          // Medium dark cards
  text: '#F9FAFB',          // Off-white - reduced eye strain
  textSecondary: '#9CA3AF', // Light gray - clear but not harsh
  border: '#374151',        // Dark borders - subtle
  notification: '#60A5FA',  // Light blue - visible alert
  error: '#F87171',         // Light red - clear on dark
  success: '#34D399',       // Light green - positive feedback
  warning: '#FBBF24',       // Light amber - caution
  info: '#60A5FA',          // Light blue - information
  emergency: '#FCA5A5',     // Light red - critical on dark
  highSeverity: '#FB923C',  // Light orange - priority
  recommendation: '#A78BFA', // Light purple - AI suggestions
  selfCare: '#6EE7B7',      // Light green - wellness
};

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('auto');
  
  // Determine if dark mode should be active
  const isDark = useMemo(() => 
    theme === 'dark' || (theme === 'auto' && systemColorScheme === 'dark'),
    [theme, systemColorScheme]
  );
  
  const colors = useMemo(() => 
    isDark ? darkColors : lightColors,
    [isDark]
  );

  // Load saved theme preference
  useEffect(() => {
    loadTheme();
  }, []);

  // Save theme preference
  useEffect(() => {
    saveTheme(theme);
  }, [theme]);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        setThemeState(savedTheme as Theme);
        logger.info('Theme loaded:', savedTheme);
      }
    } catch (error) {
      logger.warn('Failed to load theme preference', error as Error);
    }
  };

  const saveTheme = async (themeToSave: Theme) => {
    try {
      await AsyncStorage.setItem('theme', themeToSave);
      logger.info('Theme saved:', themeToSave);
    } catch (error) {
      logger.warn('Failed to save theme preference', error as Error);
    }
  };

  const setTheme = (newTheme: Theme) => {
    logger.info('Setting theme:', newTheme);
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    const nextTheme: Theme = 
      theme === 'light' ? 'dark' : 
      theme === 'dark' ? 'auto' : 'light';
    logger.info(`Toggling theme from ${theme} to ${nextTheme}`);
    setTheme(nextTheme);
  };

  const value = useMemo<ThemeContextType>(() => ({
    theme,
    colors,
    isDark,
    toggleTheme,
    setTheme,
  }), [theme, colors, isDark]);

  useEffect(() => {
    logger.debug('Theme context updated:', { theme, isDark, background: colors.background });
  }, [theme, isDark, colors]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};