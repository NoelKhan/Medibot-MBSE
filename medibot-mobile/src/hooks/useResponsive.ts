/**
 * Responsive Hook
 * ================
 * Provides utilities for handling different screen sizes and orientations
 */

import { useState, useEffect } from 'react';
import { Dimensions, Platform, ScaledSize } from 'react-native';

interface ResponsiveInfo {
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isSmallDevice: boolean;
  isMediumDevice: boolean;
  isLargeDevice: boolean;
  isTablet: boolean;
  isPhone: boolean;
  scale: number;
  fontScale: number;
}

export const useResponsive = (): ResponsiveInfo => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height, scale, fontScale } = dimensions;
  const isPortrait = height >= width;
  const isLandscape = width > height;

  // Device size categories based on width
  const isSmallDevice = width < 375;
  const isMediumDevice = width >= 375 && width < 768;
  const isLargeDevice = width >= 768;
  const isTablet = width >= 768 || height >= 768;
  const isPhone = !isTablet;

  return {
    width,
    height,
    isPortrait,
    isLandscape,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
    isTablet,
    isPhone,
    scale,
    fontScale,
  };
};

/**
 * Get responsive padding based on screen size
 */
export const getResponsivePadding = (dimensions: { width: number; height: number }) => {
  const { width } = dimensions;
  if (width >= 768) return 32; // Tablet
  if (width >= 375) return 20; // Medium phone
  return 16; // Small phone
};

/**
 * Get responsive font size
 */
export const getResponsiveFontSize = (baseSize: number, dimensions: { width: number }) => {
  const { width } = dimensions;
  if (width >= 768) return baseSize * 1.2; // Tablet
  if (width < 375) return baseSize * 0.9; // Small phone
  return baseSize;
};

/**
 * Get number of columns for grid layouts
 */
export const getGridColumns = (dimensions: { width: number; height: number }) => {
  const { width, height } = dimensions;
  const isLandscape = width > height;
  
  if (width >= 1024) return isLandscape ? 4 : 3;
  if (width >= 768) return isLandscape ? 3 : 2;
  if (width >= 600) return 2;
  return 1;
};
