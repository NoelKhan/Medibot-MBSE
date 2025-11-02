import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { notificationService, NotificationSettings } from '../services/notification';
import EmptyState from '../components/EmptyState';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import { createLogger } from '../services/Logger';

const logger = createLogger('NotificationPreferencesScreen');

interface NotificationPreferencesScreenProps {
  navigation: any;
  route?: {
    params?: {
      userId?: string;
    };
  };
}

const NotificationPreferencesScreen: React.FC<NotificationPreferencesScreenProps> = ({ 
  navigation,
  route,
}) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationSettings | null>(null);

  useEffect(() => {
    trackScreen('NotificationPreferencesScreen', {
      userId: route?.params?.userId
    });
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = notificationService.getSettings();
      setPreferences(prefs);
    } catch (error) {
      logger.error('Error loading preferences', error);
      Alert.alert(
        'Error',
        'Failed to load notification preferences. Using defaults.',
        [{ text: 'OK' }]
      );
      // Set defaults
      setPreferences({
        pushNotifications: false,
        emailNotifications: true,
        smsNotifications: false,
        appointmentReminders: true,
        medicationReminders: true,
        followUpReminders: true,
        emergencyAlerts: true,
        marketingMessages: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    if (!preferences) return;

    // Store old value for rollback
    const oldValue = preferences[key];
    
    try {
      // Optimistically update UI
      const updatedPrefs = { ...preferences, [key]: value };
      setPreferences(updatedPrefs);

      // Update backend
      await notificationService.updateSettings(updatedPrefs);
      
      Analytics.track(AnalyticsEvent.FEATURE_USED, {
        feature: 'notification_settings',
        setting: key,
        value: String(value),
      });
      
      logger.info('Preference updated successfully', { key, value });
    } catch (error) {
      logger.error('Error updating preference', error);
      
      // Revert to old value on error
      const revertedPrefs = { ...preferences, [key]: oldValue };
      setPreferences(revertedPrefs);
      
      Alert.alert(
        'Update Failed', 
        'Failed to update preference. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const saveAllPreferences = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      await notificationService.updateSettings(preferences);
      Alert.alert('Success', 'Notification preferences saved successfully!');
      navigation.goBack();
    } catch (error) {
      logger.error('Error saving preferences', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!preferences) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Preferences</Text>
          <View style={styles.headerSpacer} />
        </View>
        <EmptyState
          icon="notifications-none"
          title="No Notification Preferences"
          message="Unable to load your notification preferences. Please try again."
          actionLabel="Retry"
          onAction={loadPreferences}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Preferences</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Notification Channels Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="notifications" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Notification Channels</Text>
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Push Notifications</Text>
              <Text style={styles.preferenceDescription}>
                Receive notifications on this device
              </Text>
            </View>
            <Switch
              value={preferences.pushNotifications}
              onValueChange={(value) => updatePreference('pushNotifications', value)}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={preferences.pushNotifications ? colors.primary : colors.textSecondary}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Email Notifications</Text>
              <Text style={styles.preferenceDescription}>
                Receive notifications via email
              </Text>
            </View>
            <Switch
              value={preferences.emailNotifications}
              onValueChange={(value) => updatePreference('emailNotifications', value)}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={preferences.emailNotifications ? colors.primary : colors.textSecondary}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>SMS Notifications</Text>
              <Text style={styles.preferenceDescription}>
                Receive notifications via text message
              </Text>
            </View>
            <Switch
              value={preferences.smsNotifications}
              onValueChange={(value) => updatePreference('smsNotifications', value)}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={preferences.smsNotifications ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Notification Types Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="category" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Notification Types</Text>
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Appointment Reminders</Text>
              <Text style={styles.preferenceDescription}>
                Reminders for upcoming appointments
              </Text>
            </View>
            <Switch
              value={preferences.appointmentReminders}
              onValueChange={(value) => updatePreference('appointmentReminders', value)}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={preferences.appointmentReminders ? colors.primary : colors.textSecondary}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Medication Reminders</Text>
              <Text style={styles.preferenceDescription}>
                Reminders to take your medications
              </Text>
            </View>
            <Switch
              value={preferences.medicationReminders}
              onValueChange={(value) => updatePreference('medicationReminders', value)}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={preferences.medicationReminders ? colors.primary : colors.textSecondary}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Follow-up Reminders</Text>
              <Text style={styles.preferenceDescription}>
                Reminders for follow-up care
              </Text>
            </View>
            <Switch
              value={preferences.followUpReminders}
              onValueChange={(value) => updatePreference('followUpReminders', value)}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={preferences.followUpReminders ? colors.primary : colors.textSecondary}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Emergency Alerts</Text>
              <Text style={styles.preferenceDescription}>
                Critical emergency notifications (always on)
              </Text>
            </View>
            <Switch
              value={preferences.emergencyAlerts}
              onValueChange={(value) => updatePreference('emergencyAlerts', value)}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={preferences.emergencyAlerts ? colors.primary : colors.textSecondary}
              disabled={true}
            />
          </View>

          <View style={styles.preferenceRow}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceLabel}>Marketing Messages</Text>
              <Text style={styles.preferenceDescription}>
                Updates and promotional content
              </Text>
            </View>
            <Switch
              value={preferences.marketingMessages}
              onValueChange={(value) => updatePreference('marketingMessages', value)}
              trackColor={{ false: colors.border, true: colors.primary + '80' }}
              thumbColor={preferences.marketingMessages ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="info-outline" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Information</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              📱 Push notifications require device permissions
            </Text>
            <Text style={styles.infoText}>
              📧 Email notifications sent to your registered email
            </Text>
            <Text style={styles.infoText}>
              💬 SMS notifications may incur carrier charges
            </Text>
            <Text style={styles.infoText}>
              🚨 Emergency alerts cannot be disabled for safety
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveAllPreferences}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="save" size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Preferences</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    errorText: {
      marginTop: 16,
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    retryButton: {
      marginTop: 24,
      paddingHorizontal: 32,
      paddingVertical: 12,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    headerSpacer: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    section: {
      backgroundColor: colors.surface,
      marginTop: 16,
      paddingVertical: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    warningBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.warning + '20', // Use theme warning color with transparency
      padding: 12,
      marginHorizontal: 16,
      marginBottom: 12,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
    },
    warningText: {
      marginLeft: 8,
      fontSize: 14,
      color: isDark ? colors.warning : '#D97706', // Darker shade for light mode
      flex: 1,
    },
    preferenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    preferenceInfo: {
      flex: 1,
      marginRight: 16,
    },
    preferenceLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    preferenceDescription: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    timingCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      backgroundColor: isDark ? colors.background : '#F5F5F5',
      borderRadius: 12,
    },
    timingLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    timingValue: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    timingDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    timingButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    timingButton: {
      flex: 1,
      marginHorizontal: 4,
      paddingVertical: 8,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    timingButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timingButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    timingButtonTextActive: {
      color: '#FFFFFF',
    },
    quietHoursContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    quietHoursRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    quietHoursLabel: {
      fontSize: 15,
      color: colors.text,
    },
    quietHoursValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    quietHoursNote: {
      marginTop: 8,
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      maxWidth: '60%',
    },
    infoCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 16,
      backgroundColor: isDark ? colors.background : '#F5F5F5',
      borderRadius: 12,
    },
    infoText: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
      lineHeight: 20,
    },
    footer: {
      padding: 16,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      marginLeft: 8,
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
    },
  });

const NotificationPreferencesScreenWithErrorBoundary: React.FC<NotificationPreferencesScreenProps> = (props) => (
  <ErrorBoundary>
    <NotificationPreferencesScreen {...props} />
  </ErrorBoundary>
);

export default NotificationPreferencesScreenWithErrorBoundary;
