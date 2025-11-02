/**
 * Global Auth Widget
 * ==================
 * Persistent authentication status display with logout functionality
 * Shows on all screens, works on mobile and web
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { createLogger } from '../services/Logger';

const logger = createLogger('GlobalAuthWidget');

interface GlobalAuthWidgetProps {
  navigation: any;
  onLogout?: () => void;
  position?: 'top' | 'bottom'; // Position on screen
}

interface UserData {
  id: string;
  fullName?: string;
  name?: string;
  email?: string;
  isGuest?: boolean;
}

export const GlobalAuthWidget: React.FC<GlobalAuthWidgetProps> = ({
  navigation,
  onLogout,
  position = 'top',
}) => {
  const { colors } = useTheme();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadUserData();
    
    // Re-check user data when screen focuses
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });

    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await AsyncStorage.getItem('currentUser');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      logger.error('Error loading user data', error as Error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear user data
              await AsyncStorage.removeItem('currentUser');
              await AsyncStorage.removeItem('@medibot_auth_token');
              await AsyncStorage.removeItem('@medibot_refresh_token');
              
              setUser(null);
              setExpanded(false);
              
              // Call custom logout handler
              if (onLogout) {
                onLogout();
              } else {
                // Navigate to welcome screen
                navigation.navigate('Welcome');
              }
              
              Alert.alert('Success', 'You have been logged out successfully.');
            } catch (error) {
              logger.error('Error during logout', error as Error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleProfilePress = () => {
    setExpanded(false);
    if (user?.isGuest) {
      Alert.alert(
        'Guest User',
        'You are currently using MediBot as a guest. Would you like to create an account for full features?',
        [
          { text: 'Not Now', style: 'cancel' },
          { 
            text: 'Create Account', 
            onPress: () => navigation.navigate('PatientLogin')
          },
        ]
      );
    } else {
      navigation.navigate('Profile', { user });
    }
  };

  // Don't render if not logged in
  if (!user || loading) {
    return null;
  }

  const userName = user.fullName || user.name || 'User';
  const userType = user.isGuest ? 'Guest' : 'Member';

  return (
    <View style={[
      styles.container,
      position === 'top' ? styles.positionTop : styles.positionBottom,
      { backgroundColor: colors.surface },
      styles.webContainer,
    ]}>
      {/* Collapsed View */}
      {!expanded && (
        <TouchableOpacity
          style={[styles.collapsedView, { backgroundColor: colors.primary }]}
          onPress={() => setExpanded(true)}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={16} color="#FFFFFF" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={styles.userType}>{userType}</Text>
          </View>
          <MaterialIcons name="expand-more" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Expanded View */}
      {expanded && (
        <View style={[styles.expandedView, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.expandedHeader}>
            <View style={styles.userInfoExpanded}>
              <View style={[styles.avatarLarge, { backgroundColor: colors.primary }]}>
                <MaterialIcons name="person" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.userDetails}>
                <Text style={[styles.userNameLarge, { color: colors.text }]}>
                  {userName}
                </Text>
                <Text style={[styles.userTypeLarge, { color: colors.textSecondary }]}>
                  {userType}
                </Text>
                {user.email && (
                  <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                    {user.email}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setExpanded(false)}
            >
              <MaterialIcons name="expand-less" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.border }]}
              onPress={handleProfilePress}
            >
              <MaterialIcons name="account-circle" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                {user.isGuest ? 'Create Account' : 'View Profile'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { borderColor: colors.border }]}
              onPress={() => {
                setExpanded(false);
                navigation.navigate('NotificationPreferences', { userId: user.id });
              }}
            >
              <MaterialIcons name="notifications" size={20} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                Notification Settings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.logoutButton]}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={20} color="#E53E3E" />
              <Text style={[styles.actionText, { color: '#E53E3E' }]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  positionTop: {
    top: 0,
  },
  positionBottom: {
    bottom: 0,
  },
  webContainer: {
    maxWidth: 1200,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  collapsedView: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  userType: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },
  expandedView: {
    padding: 16,
    borderBottomWidth: 1,
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  userInfoExpanded: {
    flexDirection: 'row',
    flex: 1,
  },
  avatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameLarge: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  userTypeLarge: {
    fontSize: 12,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 11,
  },
  closeButton: {
    padding: 4,
  },
  actions: {
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  logoutButton: {
    borderColor: '#FED7D7',
    backgroundColor: '#FFF5F5',
  },
  actionText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default GlobalAuthWidget;
