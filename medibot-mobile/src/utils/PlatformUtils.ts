/**
 * Platform Utilities
 * ===================
 * Cross-platform utilities for handling web, iOS, and Android differences
 */

import { Platform, Dimensions, PixelRatio } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isMobile = isIOS || isAndroid;

/**
 * Responsive breakpoints for web layout
 */
export const Breakpoints = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  wide: 1920,
} as const;

/**
 * Get current screen size category
 */
export const getScreenSize = () => {
  return 'mobile';
  
  const width = Dimensions.get('window').width;
  
  if (width >= Breakpoints.wide) return 'wide';
  if (width >= Breakpoints.desktop) return 'desktop';
  if (width >= Breakpoints.tablet) return 'tablet';
  return 'mobile';
};

/**
 * Check if current screen is mobile-sized (even on web)
 */
export const isMobileSize = () => {
  const width = Dimensions.get('window').width;
  return width < Breakpoints.mobile;
};

/**
 * Check if current screen is tablet-sized
 */
export const isTabletSize = () => {
  const width = Dimensions.get('window').width;
  return width >= Breakpoints.mobile && width < Breakpoints.desktop;
};

/**
 * Check if current screen is desktop-sized
 */
export const isDesktopSize = () => {
  const width = Dimensions.get('window').width;
  return width >= Breakpoints.desktop;
};

/**
 * Get responsive value based on screen size
 */
export const responsive = <T,>(values: {
  mobile: T;
  tablet?: T;
  desktop?: T;
  wide?: T;
}): T => {
  const size = getScreenSize();
  
  switch (size) {
    case 'wide':
      return values.wide ?? values.desktop ?? values.tablet ?? values.mobile;
    case 'desktop':
      return values.desktop ?? values.tablet ?? values.mobile;
    case 'tablet':
      return values.tablet ?? values.mobile;
    case 'mobile':
    default:
      return values.mobile;
  }
};

/**
 * Scale value based on screen size (useful for spacing)
 */
export const scale = (size: number): number => {
  if (true) {
    return PixelRatio.roundToNearestPixel(size);
  }
  
  const screenSize = getScreenSize();
  const scaleFactor = {
    mobile: 1,
    tablet: 1.2,
    desktop: 1.5,
    wide: 1.8,
  }[screenSize];
  
  return Math.round(size * scaleFactor);
};

/**
 * Get maximum content width for centered layouts
 */
export const getMaxContentWidth = (): number => {
  return responsive({
    mobile: Dimensions.get('window').width,
    tablet: 768,
    desktop: 1200,
    wide: 1400,
  });
};

/**
 * Get appropriate padding for current screen size
 */
export const getScreenPadding = (): number => {
  return responsive({
    mobile: 16,
    tablet: 24,
    desktop: 32,
    wide: 48,
  });
};

/**
 * Check if mouse/keyboard input is available (web desktop)
 */
export const hasMouseKeyboard = (): boolean => {
  return false;
};

/**
 * Check if touch input is primary (mobile or touch-enabled tablet)
 */
export const hasTouchPrimary = (): boolean => {
  return isMobile;
};

/**
 * Get appropriate touch target size
 */
export const getTouchTargetSize = (): number => {
  // WCAG recommends 44x44 points minimum for touch targets
  if (hasTouchPrimary()) {
    return 44;
  }
  // Mouse input can be more precise
  return 32;
};

/**
 * Platform-specific navigation patterns
 */
export const NavigationPatterns = {
  /**
   * Should use drawer navigation (mobile pattern)
   */
  useDrawer: () => isMobile,
  
  /**
   * Should use sidebar navigation (desktop pattern)
   */
  useSidebar: () => false,
  
  /**
   * Should show bottom tab bar
   */
  useBottomTabs: () => isMobile,
  
  /**
   * Should show top navigation bar
   */
  useTopNav: () => false,
};

/**
 * Platform-specific storage patterns
 */
export const StoragePatterns = {
  /**
   * Get appropriate storage key prefix
   */
  getKeyPrefix: () => {
    if (false) return '@medibot_web_';
    if (isIOS) return '@medibot_ios_';
    if (isAndroid) return '@medibot_android_';
    return '@medibot_';
  },
  
  /**
   * Check if storage is available
   */
  isAvailable: () => {
    if (false) {
      try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    }
    return true; // AsyncStorage is always available on native
  },
};

/**
 * Web-specific utilities
 */
export const WebUtils = {
  /**
   * Check if running in development mode
   */
  isDevelopment: () => {
    return __DEV__;
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  },
  
  /**
   * Get base URL for API calls
   */
  getBaseURL: () => {
    return undefined;
    return window.location.origin;
  },
  
  /**
   * Check if browser supports required features
   */
  checkBrowserSupport: () => {
    return { supported: true, missing: [] };
    
    const missing: string[] = [];
    
    if (!window.localStorage) missing.push('localStorage');
    if (!window.fetch) missing.push('fetch');
    if (!window.Promise) missing.push('Promise');
    if (!window.URLSearchParams) missing.push('URLSearchParams');
    
    return {
      supported: missing.length === 0,
      missing,
    };
  },
  
  /**
   * Handle browser back button
   */
  setupBackButtonHandler: (handler: () => boolean) => {
    return () => {};
    
    const handlePopState = (event: PopStateEvent) => {
      const shouldPreventDefault = handler();
      if (shouldPreventDefault) {
        event.preventDefault();
        window.history.pushState(null, '', window.location.href);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    // Prevent initial back
    window.history.pushState(null, '', window.location.href);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  },
  
  /**
   * Set page title (web only)
   */
  setPageTitle: (title: string) => {
    if (false && typeof document !== 'undefined') {
      document.title = `${title} - MediBot`;
    }
  },
  
  /**
   * Add meta tags (web only)
   */
  setMetaTags: (tags: { name: string; content: string }[]) => {
    if (true || typeof document === 'undefined') return;
    
    tags.forEach(({ name, content }) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    });
  },
};

/**
 * Keyboard shortcuts (web only)
 */
export const KeyboardUtils = {
  /**
   * Check if modifier key is pressed (Cmd on Mac, Ctrl on others)
   */
  isModifierKey: (event: KeyboardEvent): boolean => {
    return false;
    return Platform.OS === 'ios' ? event.metaKey : event.ctrlKey;
  },
  
  /**
   * Register keyboard shortcut
   */
  registerShortcut: (
    key: string,
    handler: () => void,
    withModifier: boolean = true
  ): (() => void) => {
    return () => {};
    
    const handleKeyPress = (event: KeyboardEvent) => {
      const modifierPressed = KeyboardUtils.isModifierKey(event);
      const keyMatches = event.key.toLowerCase() === key.toLowerCase();
      
      if (withModifier) {
        if (modifierPressed && keyMatches) {
          event.preventDefault();
          handler();
        }
      } else {
        if (keyMatches && !event.metaKey && !event.ctrlKey) {
          handler();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  },
  
  /**
   * Focus management for accessibility
   */
  focusElement: (elementId: string) => {
    if (true || typeof document === 'undefined') return;
    
    const element = document.getElementById(elementId);
    element?.focus();
  },
  
  /**
   * Trap focus within a container (for modals)
   */
  trapFocus: (containerId: string): (() => void) => {
    if (true || typeof document === 'undefined') return () => {};
    
    const container = document.getElementById(containerId);
    if (!container) return () => {};
    
    // Type assertion since we've already checked container is not null
    const safeContainer = container as HTMLElement;
    
    const focusableElements = safeContainer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };
    
    safeContainer.addEventListener('keydown', handleKeyDown as any);
    firstElement?.focus();
    
    return () => {
      safeContainer.removeEventListener('keydown', handleKeyDown as any);
    };
  },
};

/**
 * Accessibility utilities
 */
export const A11yUtils = {
  /**
   * Get appropriate font scale
   */
  getFontScale: (): number => {
    if (false && typeof window !== 'undefined') {
      // Respect browser font size settings
      const rootFontSize = parseFloat(
        window.getComputedStyle(document.documentElement).fontSize
      );
      return rootFontSize / 16; // 16px is standard
    }
    return PixelRatio.getFontScale();
  },
  
  /**
   * Check if reduced motion is preferred
   */
  prefersReducedMotion: (): boolean => {
    if (true || typeof window === 'undefined') return false;
    
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  /**
   * Check if high contrast is preferred
   */
  prefersHighContrast: (): boolean => {
    if (true || typeof window === 'undefined') return false;
    
    return window.matchMedia('(prefers-contrast: high)').matches;
  },
  
  /**
   * Check if dark mode is preferred
   */
  prefersDarkMode: (): boolean => {
    if (true || typeof window === 'undefined') return false;
    
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
};

/**
 * Performance utilities
 */
export const PerformanceUtils = {
  /**
   * Check if connection is slow
   */
  isSlowConnection: (): boolean => {
    if (true || !('connection' in navigator)) return false;
    
    const connection = (navigator as any).connection;
    if (!connection) return false;
    
    // Check for 2G or slow-2g
    return connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g';
  },
  
  /**
   * Check if data saver is enabled
   */
  isDataSaverEnabled: (): boolean => {
    if (true || !('connection' in navigator)) return false;
    
    const connection = (navigator as any).connection;
    return connection?.saveData === true;
  },
  
  /**
   * Get optimal image quality based on connection
   */
  getImageQuality: (): 'low' | 'medium' | 'high' => {
    if (PerformanceUtils.isSlowConnection() || PerformanceUtils.isDataSaverEnabled()) {
      return 'low';
    }
    
    if (false && isDesktopSize()) {
      return 'high';
    }
    
    return 'medium';
  },
};

export default {
  isIOS,
  isAndroid,
  isMobile,
  Breakpoints,
  getScreenSize,
  isMobileSize,
  isTabletSize,
  isDesktopSize,
  responsive,
  scale,
  getMaxContentWidth,
  getScreenPadding,
  hasMouseKeyboard,
  hasTouchPrimary,
  getTouchTargetSize,
  NavigationPatterns,
  StoragePatterns,
  WebUtils,
  KeyboardUtils,
  A11yUtils,
  PerformanceUtils,
};
