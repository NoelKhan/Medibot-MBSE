import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

export interface OrientationData {
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
  aspectRatio: number;
  scale: number;
}

export interface ResponsiveStyles {
  fontSize: number;
  padding: number;
  margin: number;
  buttonHeight: number;
  inputHeight: number;
  headerHeight: number;
}

export const useOrientation = () => {
  const [orientation, setOrientation] = useState<OrientationData>(() => {
    const window = Dimensions.get('window');
    return {
      width: window.width,
      height: window.height,
      isLandscape: window.width > window.height,
      isPortrait: window.width <= window.height,
      aspectRatio: window.width / window.height,
      scale: window.scale,
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
      setOrientation({
        width: window.width,
        height: window.height,
        isLandscape: window.width > window.height,
        isPortrait: window.width <= window.height,
        aspectRatio: window.width / window.height,
        scale: window.scale,
      });
    });

    return () => subscription?.remove();
  }, []);

  return orientation;
};

export const getResponsiveStyles = (orientation: OrientationData): ResponsiveStyles => {
  const baseSize = Math.min(orientation.width, orientation.height) / 20;
  
  return {
    fontSize: orientation.isLandscape ? baseSize * 0.8 : baseSize,
    padding: orientation.isLandscape ? baseSize * 0.6 : baseSize * 0.8,
    margin: orientation.isLandscape ? baseSize * 0.4 : baseSize * 0.6,
    buttonHeight: orientation.isLandscape ? 40 : 48,
    inputHeight: orientation.isLandscape ? 36 : 44,
    headerHeight: orientation.isLandscape ? 50 : 60,
  };
};

export const getOrientationStyles = (orientation: OrientationData) => {
  const responsive = getResponsiveStyles(orientation);
  
  return {
    container: {
      flex: 1,
      flexDirection: orientation.isLandscape ? 'row' as const : 'column' as const,
    },
    contentContainer: {
      flex: 1,
      padding: responsive.padding,
      paddingTop: orientation.isLandscape ? responsive.padding * 0.5 : responsive.padding,
    },
    headerContainer: {
      height: responsive.headerHeight,
      paddingHorizontal: responsive.padding,
      paddingVertical: responsive.padding * 0.5,
    },
    buttonContainer: {
      paddingHorizontal: responsive.padding,
      paddingVertical: responsive.padding * 0.5,
    },
    button: {
      height: responsive.buttonHeight,
      paddingHorizontal: responsive.padding,
      marginVertical: responsive.margin * 0.5,
    },
    input: {
      height: responsive.inputHeight,
      paddingHorizontal: responsive.padding * 0.8,
      marginVertical: responsive.margin * 0.3,
    },
    text: {
      fontSize: responsive.fontSize,
    },
    title: {
      fontSize: responsive.fontSize * 1.5,
    },
    subtitle: {
      fontSize: responsive.fontSize * 1.1,
    },
    modal: {
      maxWidth: orientation.isLandscape ? '70%' : '90%',
      maxHeight: orientation.isLandscape ? '80%' : '70%',
    },
    scrollContent: {
      paddingBottom: orientation.isLandscape ? responsive.padding : responsive.padding * 2,
    },
  };
};