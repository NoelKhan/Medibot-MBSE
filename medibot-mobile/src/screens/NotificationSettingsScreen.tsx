import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
// Removed deprecated notificationService and NotificationSettings import
import ErrorBoundary from '../components/ErrorBoundary';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import EmptyState from '../components/EmptyState';
import { createLogger } from '../services/Logger';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';

const logger = createLogger('NotificationSettingsScreen');

interface NotificationSettingsScreenProps {
  navigation: any;
  route?: {
    params?: {
      user?: any;
    };
  };
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({ navigation, route }) => {
  const user = route?.params?.user;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const styles = createStyles(colors, isDark, responsive);
  
  // NotificationSettings state now local only (migration)
  const [settings, setSettings] = useState({
    smsNotifications: true,
    emailNotifications: true,
    appointmentReminders: true,
    medicationReminders: true,
    followUpReminders: true,
    emergencyAlerts: true,
    marketingMessages: false,
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  trackScreen('NotificationSettingsScreen');
  setLoading(false); // No backend fetch, just local state
  }, []);

  const loadSettings = async () => {
    // loadSettings removed (migration)
  };

  // Update notification setting logic removed (service deprecated)
  const updateSetting = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    // No backend update, just local state (migration)
  };

  const testNotifications = () => {
  // Test notification logic removed (migration)
  Alert.alert('Test Sent', 'This is a test alert. Push notifications are no longer supported.');
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Notifications',
      'Are you sure you want to reset all notification settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setSettings({
              smsNotifications: true,
              emailNotifications: true,
              appointmentReminders: true,
              medicationReminders: true,
              followUpReminders: true,
              emergencyAlerts: true,
              marketingMessages: false,
            });
          }
        }
      ]
    );
  };

  const SettingRow = ({ 
    title, 
    subtitle, 
    value, 
    onValueChange, 
    icon,
    critical = false 
  }: {
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    icon: string;
    critical?: boolean;
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <View style={styles.settingHeader}>
          <MaterialIcons 
            name={icon as any} 
            size={24} 
            color={critical ? '#f44336' : '#4CAF50'} 
          />
          <Text style={styles.settingTitle}>{title}</Text>
        </View>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#ccc', true: critical ? '#ffcdd2' : '#c8e6c9' }}
        thumbColor={value ? (critical ? '#f44336' : '#4CAF50') : '#f4f3f4'}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Single Banner Header with safe area padding */}
        <View style={[styles.bannerHeader, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Notification Preferences</Text>
            <Text style={styles.headerSubtitle}>Manage your alerts</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading notification settings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Single Banner Header with safe area padding */}
      <View style={[styles.bannerHeader, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notification Preferences</Text>
          <Text style={styles.headerSubtitle}>Manage your alerts</Text>
        </View>
        <TouchableOpacity onPress={resetSettings} style={styles.resetButton}>
          <MaterialIcons name="restore" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Communication</Text>
          
          <SettingRow
            title="SMS Notifications"
            subtitle="Receive text messages for important updates and reminders"
            value={settings.smsNotifications}
            onValueChange={(value) => updateSetting('smsNotifications', value)}
            icon="sms"
          />

          <SettingRow
            title="Email Notifications"
            subtitle="Get email confirmations and medical reports"
            value={settings.emailNotifications}
            onValueChange={(value) => updateSetting('emailNotifications', value)}
            icon="email"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Reminders</Text>
          
          <SettingRow
            title="Medication Reminders"
            subtitle="Enable medication reminder notifications"
            value={settings.medicationReminders}
            onValueChange={(value) => updateSetting('medicationReminders', value)}
            icon="notifications"
          />

          <SettingRow
            title="Appointment Reminders"
            subtitle="Get notified 24 hours before scheduled appointments"
            value={settings.appointmentReminders}
            onValueChange={(value) => updateSetting('appointmentReminders', value)}
            icon="event"
          />

          <SettingRow
            title="Follow-up Reminders"
            subtitle="Reminders to check on your health after consultations"
            value={settings.followUpReminders}
            onValueChange={(value) => updateSetting('followUpReminders', value)}
            icon="schedule"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Emergency</Text>
          
          <SettingRow
            title="Emergency Alerts"
            subtitle="Critical alerts for emergency situations (RECOMMENDED)"
            value={settings.emergencyAlerts}
            onValueChange={(value) => updateSetting('emergencyAlerts', value)}
            icon="emergency"
            critical={true}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧪 Testing</Text>
          
          <TouchableOpacity style={styles.testButton} onPress={testNotifications}>
            <MaterialIcons name="science" size={20} color="#2196F3" />
            <Text style={styles.testButtonText}>Test Notifications</Text>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Manage Reminders</Text>
          
          <TouchableOpacity 
            style={styles.manageButton}
            onPress={() => navigation.navigate('Reminders')}
          >
            <View style={styles.manageButtonContent}>
              <MaterialIcons name="alarm" size={20} color="#FF9800" />
              <View style={styles.manageButtonText}>
                <Text style={styles.manageButtonTitle}>My Reminders</Text>
                <Text style={styles.manageButtonSubtitle}>
                  Create and manage medication & appointment reminders
                </Text>
              </View>
            </View>
            <MaterialIcons name="arrow-forward-ios" size={16} color="#ccc" />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>💡 Important Notes</Text>
          <Text style={styles.infoText}>
            • Emergency notifications should remain enabled for your safety{'\n'}
            • SMS and email notifications use your device's default apps{'\n'}
            • Reminders help you stay on top of your health care{'\n'}
            • You can change these settings anytime
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any, isDark: boolean, responsive: any) => {
  const isLandscape = responsive.isLandscape;
  const isTablet = responsive.isTablet;
  const contentPadding = isTablet ? 24 : 16;
  
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bannerHeader: {
    backgroundColor: '#5856D6', // Purple to match theme
    paddingBottom: isLandscape && !isTablet ? 12 : 16,
    paddingHorizontal: contentPadding,
    // paddingTop is set inline using insets.top
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 12,
    marginTop: 4,
  },
  backButton: {
    padding: 4,
    marginTop: 4,
  },
  resetButton: {
    padding: 4,
    marginTop: 4,
  },
  headerTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: isTablet ? 14 : 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.surface,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: 32,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  testButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: isDark ? colors.border : '#FFF3E0',
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  manageButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  manageButtonText: {
    flex: 1,
    marginLeft: 12,
  },
  manageButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  manageButtonSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  infoSection: {
    backgroundColor: colors.surface,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
};

const NotificationSettingsScreenWithErrorBoundary: React.FC<NotificationSettingsScreenProps> = (props) => (
  <ErrorBoundary>
    <NotificationSettingsScreen {...props} />
  </ErrorBoundary>
);

export default NotificationSettingsScreenWithErrorBoundary;