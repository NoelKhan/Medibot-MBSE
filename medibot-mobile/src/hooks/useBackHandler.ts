/**
 * useBackHandler Hook
 * ===================
 * Handle hardware back button on Android and back navigation
 */

import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';

/**
 * Hook to handle back button navigation
 * Navigates to a specific screen instead of default back behavior
 */
export const useBackHandler = (targetScreen?: string) => {
  const navigation = useNavigation();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (targetScreen) {
        (navigation as any).replace(targetScreen);
      } else if (navigation.canGoBack()) {
        navigation.goBack();
      }
      return true; // Prevent default behavior
    });

    return () => backHandler.remove();
  }, [navigation, targetScreen]);
};

/**
 * Hook to prevent back navigation (block back button)
 */
export const useBlockBackButton = () => {
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Block back button
    });

    return () => backHandler.remove();
  }, []);
};

export default useBackHandler;
