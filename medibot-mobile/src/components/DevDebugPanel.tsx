/**
 * DEVELOPER DEBUG PANEL
 * =====================
 * Collapsible debug panel for development/testing
 * Only visible in development builds (__DEV__ = true)
 * 
 * Features:
 * - Backend health status
 * - Mock mode indicators
 * - Migration mode toggle (Option A/B)
 * - Storage management
 * - Quick navigation to test screens
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { createLogger } from '../services/Logger';
import {
  API_CONFIG,
  MIGRATION_CONFIG,
  FEATURES,
  checkBackendHealth,
  isDebugEnabled,
} from '../config/FeatureFlags';

const logger = createLogger('DevDebugPanel');

interface DevDebugPanelProps {
  navigation?: any; // Optional navigation for quick access
}

export const DevDebugPanel: React.FC<DevDebugPanelProps> = ({ navigation }) => {
  // Only show in development
  if (!isDebugEnabled()) {
    return null;
  }

  const { colors, isDark, toggleTheme, theme } = useTheme();
  const styles = createStyles(colors, isDark);

  const [isVisible, setIsVisible] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [storageInfo, setStorageInfo] = useState<{ [key: string]: string }>({});

  // Check backend health on mount and when panel opens
  useEffect(() => {
    if (isVisible) {
      refreshBackendStatus();
      loadStorageInfo();
    }
  }, [isVisible]);

  const refreshBackendStatus = async () => {
    setBackendStatus('checking');
    const isHealthy = await checkBackendHealth();
    setBackendStatus(isHealthy ? 'online' : 'offline');
  };

  const loadStorageInfo = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const values = await AsyncStorage.multiGet(keys);
      const info: { [key: string]: string } = {};
      
      values.forEach(([key, value]) => {
        info[key] = value || 'null';
      });
      
      setStorageInfo(info);
    } catch (error) {
      logger.error('Failed to load storage info', error as Error);
    }
  };

  const toggleMigrationMode = () => {
    const newMode = !MIGRATION_CONFIG.FORCE_ROLE_SELECTION;
    MIGRATION_CONFIG.FORCE_ROLE_SELECTION = newMode;
    
    Alert.alert(
      'Migration Mode Switched',
      `Now using: ${newMode ? 'Option B (Strict Mode)' : 'Option A (Smart Routing)'}\n\nRestart app to see changes.`,
      [{ text: 'OK' }]
    );
  };

  const clearAllStorage = () => {
    Alert.alert(
      'Clear All Storage?',
      'This will remove all saved data including auth tokens, preferences, and cached data.\n\nApp will need to be restarted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Storage Cleared', 'Please restart the app to test fresh install behavior.');
            loadStorageInfo();
          },
        },
      ]
    );
  };

  const testBackendConnection = async () => {
    setBackendStatus('checking');
    const isHealthy = await checkBackendHealth();
    
    Alert.alert(
      'Backend Test',
      isHealthy 
        ? `✅ Backend is ONLINE\n\nURL: ${API_CONFIG.BACKEND_URL}\n\nAll API calls will use real backend.`
        : `❌ Backend is OFFLINE\n\nURL: ${API_CONFIG.BACKEND_URL}\n\nFalling back to mock mode.`,
      [{ text: 'OK' }]
    );
    
    setBackendStatus(isHealthy ? 'online' : 'offline');
  };

  const getStatusEmoji = () => {
    switch (backendStatus) {
      case 'online': return '✅';
      case 'offline': return '❌';
      case 'checking': return '⏳';
    }
  };

  const getStatusColor = () => {
    switch (backendStatus) {
      case 'online': return '#34C759';
      case 'offline': return '#FF3B30';
      case 'checking': return '#FF9500';
    }
  };

  return (
    <View style={styles.container}>
      {/* Toggle Button */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsVisible(!isVisible)}
      >
        <MaterialIcons name="bug-report" size={20} color={colors.primary} />
        <Text style={styles.toggleText}>
          Debug Panel {isVisible ? '▼' : '▶'}
        </Text>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
      </TouchableOpacity>

      {/* Debug Panel Content */}
      {isVisible && (
        <ScrollView style={styles.panel}>
          {/* Backend Status Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏥 Backend Status</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Status:</Text>
              <Text style={[styles.value, { color: getStatusColor() }]}>
                {getStatusEmoji()} {backendStatus.toUpperCase()}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>URL:</Text>
              <Text style={styles.valueSmall}>{API_CONFIG.BACKEND_URL}</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={testBackendConnection}>
              <MaterialIcons name="refresh" size={16} color={colors.surface} />
              <Text style={styles.buttonText}>Test Connection</Text>
            </TouchableOpacity>
          </View>

          {/* Mock Mode Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎭 Mock Mode</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Auth:</Text>
              <Text style={styles.value}>{API_CONFIG.MOCK_MODE.AUTH ? '✅ Enabled' : '❌ Disabled'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Bookings:</Text>
              <Text style={styles.value}>{API_CONFIG.MOCK_MODE.BOOKINGS ? '✅ Enabled' : '❌ Disabled'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Reminders:</Text>
              <Text style={styles.value}>{API_CONFIG.MOCK_MODE.REMINDERS ? '✅ Enabled' : '❌ Disabled'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Emergency:</Text>
              <Text style={styles.value}>{API_CONFIG.MOCK_MODE.EMERGENCY ? '✅ Enabled' : '❌ Disabled'}</Text>
            </View>
          </View>

          {/* Migration Mode Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔄 Migration Mode</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Current:</Text>
              <Text style={styles.value}>
                {MIGRATION_CONFIG.FORCE_ROLE_SELECTION ? 'Option B (Strict)' : 'Option A (Smart)'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Auto-Route:</Text>
              <Text style={styles.value}>{MIGRATION_CONFIG.AUTO_ROUTE_BY_ROLE ? '✅' : '❌'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Allow Switch:</Text>
              <Text style={styles.value}>{MIGRATION_CONFIG.ALLOW_ROLE_SWITCH ? '✅' : '❌'}</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={toggleMigrationMode}>
              <MaterialIcons name="swap-horiz" size={16} color={colors.surface} />
              <Text style={styles.buttonText}>Toggle Mode (A ⇄ B)</Text>
            </TouchableOpacity>
          </View>

          {/* Features Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Features</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Triage Chat:</Text>
              <Text style={styles.value}>{FEATURES.PATIENT_TRIAGE_CHAT ? '✅' : '❌'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Calendar Sync:</Text>
              <Text style={styles.value}>{FEATURES.CALENDAR_SYNC ? '✅' : '❌'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>SMS Reminders:</Text>
              <Text style={styles.value}>{FEATURES.SMS_REMINDERS ? '✅' : '❌'}</Text>
            </View>
          </View>

          {/* Storage Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💾 AsyncStorage</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Items:</Text>
              <Text style={styles.value}>{Object.keys(storageInfo).length}</Text>
            </View>
            {Object.keys(storageInfo).length > 0 && (
              <View style={styles.storageDetails}>
                {Object.entries(storageInfo).map(([key, value]) => (
                  <View key={key} style={styles.storageRow}>
                    <Text style={styles.storageKey}>{key}:</Text>
                    <Text style={styles.storageValue} numberOfLines={1}>
                      {value.substring(0, 30)}{value.length > 30 ? '...' : ''}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearAllStorage}>
              <MaterialIcons name="delete-forever" size={16} color="#fff" />
              <Text style={styles.buttonText}>Clear All Storage</Text>
            </TouchableOpacity>
          </View>

          {/* Theme Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎨 Theme</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Current:</Text>
              <Text style={styles.value}>{theme} {isDark ? '🌙' : '☀️'}</Text>
            </View>
            <TouchableOpacity style={styles.button} onPress={toggleTheme}>
              <MaterialIcons name="palette" size={16} color={colors.surface} />
              <Text style={styles.buttonText}>Toggle Theme</Text>
            </TouchableOpacity>
          </View>

          {/* Platform Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📱 Platform</Text>
            <View style={styles.row}>
              <Text style={styles.label}>OS:</Text>
              <Text style={styles.value}>{Platform.OS}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Version:</Text>
              <Text style={styles.value}>{Platform.Version}</Text>
            </View>
          </View>

          {/* Quick Navigation */}
          {navigation && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🚀 Quick Navigation</Text>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => navigation.navigate('ApiTest')}
              >
                <Text style={styles.navButtonText}>→ API Test Screen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navButton}
                onPress={() => navigation.navigate('RoleSelection')}
              >
                <Text style={styles.navButtonText}>→ Role Selection</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: Platform.select({ web: 20, ios: 10, android: 10 }),
      right: Platform.select({ web: 20, ios: 10, android: 10 }),
      maxWidth: Platform.select({ web: 400, ios: 350, android: 350 }),
      zIndex: 9999,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        android: {
          elevation: 8,
        },
        web: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
      }),
    },
    toggleButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toggleText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 6,
      marginRight: 6,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    panel: {
      maxHeight: 500,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 8,
      padding: 12,
    },
    section: {
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    label: {
      fontSize: 12,
      color: colors.textSecondary,
      flex: 1,
    },
    value: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      textAlign: 'right',
    },
    valueSmall: {
      fontSize: 10,
      color: colors.textSecondary,
      flex: 2,
      textAlign: 'right',
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      marginTop: 8,
      gap: 6,
    },
    dangerButton: {
      backgroundColor: '#FF3B30',
    },
    buttonText: {
      color: colors.surface,
      fontSize: 12,
      fontWeight: '600',
    },
    storageDetails: {
      marginTop: 8,
      padding: 8,
      backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
      borderRadius: 6,
      maxHeight: 150,
    },
    storageRow: {
      marginBottom: 4,
    },
    storageKey: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.primary,
    },
    storageValue: {
      fontSize: 10,
      color: colors.textSecondary,
      marginLeft: 8,
    },
    navButton: {
      padding: 8,
      backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
      borderRadius: 6,
      marginBottom: 6,
    },
    navButtonText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
    },
  });

export default DevDebugPanel;
