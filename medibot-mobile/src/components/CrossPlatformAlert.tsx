/**
 * Cross-Platform Alert Component for MediBot
 * Provides consistent alert/modal functionality across mobile and web platforms
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  cancelable?: boolean;
}

interface CrossPlatformAlertProps extends AlertOptions {
  visible: boolean;
  onDismiss: () => void;
}

const CrossPlatformAlert: React.FC<CrossPlatformAlertProps> = ({
  title,
  message,
  buttons = [{ text: 'OK' }],
  visible,
  onDismiss,
  cancelable = true,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onDismiss();
  };

  const handleBackdropPress = () => {
    if (cancelable) {
      onDismiss();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleBackdropPress}
      statusBarTranslucent
    >
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleBackdropPress}
        />
        
        <Animated.View 
          style={[
            styles.alertContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            }
          ]}
        >
          <View style={styles.alertContent}>
            {/* Header with icon */}
            <View style={styles.alertHeader}>
              <MaterialIcons 
                name="info" 
                size={24} 
                color="#2196F3" 
                style={styles.alertIcon}
              />
              <Text style={styles.alertTitle}>{title}</Text>
            </View>
            
            {/* Message */}
            {message && (
              <Text style={styles.alertMessage}>{message}</Text>
            )}
            
            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.alertButton,
                    button.style === 'cancel' && styles.cancelButton,
                    button.style === 'destructive' && styles.destructiveButton,
                    buttons.length === 1 && styles.singleButton,
                    buttons.length === 2 && index === 0 && styles.firstButton,
                    buttons.length === 2 && index === 1 && styles.secondButton,
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text style={[
                    styles.buttonText,
                    button.style === 'cancel' && styles.cancelButtonText,
                    button.style === 'destructive' && styles.destructiveButtonText,
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Alert Manager for imperative usage (similar to React Native Alert)
class AlertManager {
  private static currentAlert: AlertOptions & { id: number } | null = null;
  private static alertId = 0;
  private static listeners: ((alert: any) => void)[] = [];

  static show(title: string, message?: string, buttons?: AlertButton[], options?: { cancelable?: boolean }) {
    const alert = {
      id: ++this.alertId,
      title,
      message,
      buttons: buttons || [{ text: 'OK' }],
      cancelable: options?.cancelable ?? true,
    };
    
    this.currentAlert = alert;
    this.notifyListeners(alert);
  }

  static dismiss() {
    this.currentAlert = null;
    this.notifyListeners(null);
  }

  static addListener(listener: (alert: any) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private static notifyListeners(alert: any) {
    this.listeners.forEach(listener => listener(alert));
  }
}

// Hook for using alerts
export const useAlert = () => {
  const [currentAlert, setCurrentAlert] = useState<any>(null);

  useEffect(() => {
    const removeListener = AlertManager.addListener(setCurrentAlert);
    return removeListener;
  }, []);

  const showAlert = (title: string, message?: string, buttons?: AlertButton[], options?: { cancelable?: boolean }) => {
    AlertManager.show(title, message, buttons, options);
  };

  return {
    showAlert,
    currentAlert,
    dismissAlert: AlertManager.dismiss,
  };
};

// Cross-platform Alert API
export const showAlert = (title: string, message?: string, buttons?: AlertButton[], options?: { cancelable?: boolean }) => {
  // Use native Alert for mobile
  const { Alert } = require('react-native');
  Alert.alert(title, message, buttons, { cancelable: options?.cancelable });
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  alertContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    maxWidth: screenWidth - 40,
    width: '100%',
    maxHeight: screenHeight * 0.8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  alertContent: {
    padding: 24,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertIcon: {
    marginRight: 12,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  alertMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  alertButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  singleButton: {
    // Single button takes full width
  },
  firstButton: {
    // First button in two-button layout
  },
  secondButton: {
    // Second button in two-button layout
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  destructiveButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#666',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
});

// Provider component to wrap the app
export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentAlert, dismissAlert } = useAlert();

  return (
    <>
      {children}
      {currentAlert && (
        <CrossPlatformAlert
          {...currentAlert}
          visible={!!currentAlert}
          onDismiss={dismissAlert}
        />
      )}
    </>
  );
};

export default CrossPlatformAlert;