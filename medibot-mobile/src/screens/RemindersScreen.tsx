import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Platform,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import * as remindersApi from '../api/reminders.api';
import { notificationService } from '../services/notification';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import EmptyState from '../components/EmptyState';
import { createLogger } from '../services/Logger';
import { authService } from '../services/auth';

const logger = createLogger('RemindersScreen');

interface Reminder {
  id: string;
  title: string;
  description: string;
  type: 'medication' | 'appointment' | 'followup' | 'custom';
  time: Date;
  enabled: boolean;
  repeat: 'once' | 'daily' | 'weekly' | 'monthly';
  icon: string;
  color: string;
}

interface RemindersScreenProps {
  navigation: any;
  route?: {
    params?: {
      userId?: string;
    };
  };
}

const RemindersScreen: React.FC<RemindersScreenProps> = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<Reminder['type']>('medication');
  const [time, setTime] = useState(new Date());
  const [repeat, setRepeat] = useState<Reminder['repeat']>('daily');

  useEffect(() => {
    trackScreen('RemindersScreen', {
      userId: route?.params?.userId
    });
    
    loadReminders();
  }, []);

  const getUserId = async (): Promise<string> => {
    try {
      const user = await authService.getCurrentUser();
      return user?.id || route?.params?.userId || 'guest';
    } catch (error) {
      logger.warn('Could not get user ID', error);
      return route?.params?.userId || 'guest';
    }
  };

  const loadReminders = async () => {
    try {
      setLoading(true);
      const userId = await getUserId();
      
      // Fetch reminders from backend
      const apiReminders = await remindersApi.getReminders(userId);
      
      // Convert API MedicationReminder format to local Reminder format for display
      // MedicationReminder has: medicationName, dosage, frequency, scheduledTimes[], startDate, endDate, enabled
      const convertedReminders: Reminder[] = apiReminders.map((apiRem) => ({
        id: apiRem.id,
        title: apiRem.medicationName,
        description: `${apiRem.dosage} - ${apiRem.frequency}${apiRem.notes ? '\n' + apiRem.notes : ''}`,
        type: 'medication' as Reminder['type'],
        // Use first scheduled time as the primary reminder time
        time: new Date(`1970-01-01T${apiRem.scheduledTimes[0] || '09:00'}:00`),
        enabled: apiRem.enabled,
        repeat: apiRem.frequency.toLowerCase().includes('daily') ? 'daily' :
                apiRem.frequency.toLowerCase().includes('week') ? 'weekly' :
                apiRem.frequency.toLowerCase().includes('month') ? 'monthly' : 'once',
        icon: getReminderIcon('medication'),
        color: getReminderColor('medication'),
      }));
      
      // If no reminders exist, add sample/mock reminders for demonstration
      if (convertedReminders.length === 0) {
        const mockReminders: Reminder[] = [
          {
            id: 'mock-1',
            title: 'Morning Medication',
            description: 'Take blood pressure medication',
            type: 'medication',
            time: new Date(new Date().setHours(8, 0, 0, 0)),
            enabled: true,
            repeat: 'daily',
            icon: 'medication',
            color: colors.success || '#4CAF50',
          },
          {
            id: 'mock-2',
            title: 'Doctor Appointment',
            description: 'Follow-up consultation with Dr. Smith',
            type: 'appointment',
            time: new Date(new Date().setDate(new Date().getDate() + 3)),
            enabled: true,
            repeat: 'once',
            icon: 'event',
            color: colors.primary || '#2196F3',
          },
          {
            id: 'mock-3',
            title: 'Health Check Follow-up',
            description: 'Review test results and discuss treatment',
            type: 'followup',
            time: new Date(new Date().setDate(new Date().getDate() + 7)),
            enabled: true,
            repeat: 'once',
            icon: 'schedule',
            color: colors.warning || '#FF9800',
          },
        ];
        
        setReminders(mockReminders);
        logger.info('No reminders found. Showing sample reminders for demonstration');
      } else {
        setReminders(convertedReminders);
      }
    } catch (error) {
      logger.error('Error loading reminders', error);
      // Show empty state on error
      setReminders([]);
      Alert.alert('Error', 'Failed to load reminders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getReminderIcon = (type: Reminder['type']) => {
    switch (type) {
      case 'medication': return 'medication';
      case 'appointment': return 'event';
      case 'followup': return 'schedule';
      case 'custom': return 'notifications';
    }
  };

  const getReminderColor = (type: Reminder['type']) => {
    // Use theme-aware colors
    switch (type) {
      case 'medication': return colors.success || '#4CAF50';
      case 'appointment': return colors.primary || '#2196F3';
      case 'followup': return colors.warning || '#FF9800';
      case 'custom': return colors.secondary || '#9C27B0';
    }
  };

  const openAddModal = () => {
    setEditingReminder(null);
    setTitle('');
    setDescription('');
    setType('medication');
    setTime(new Date());
    setRepeat('daily');
    setShowAddModal(true);
  };

  const openEditModal = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setTitle(reminder.title);
    setDescription(reminder.description);
    setType(reminder.type);
    setTime(reminder.time);
    setRepeat(reminder.repeat);
    setShowAddModal(true);
  };

  const saveReminder = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a reminder title');
      return;
    }

    const newReminder: Reminder = {
      id: editingReminder ? editingReminder.id : Date.now().toString(),
      title,
      description,
      type,
      time,
      enabled: true,
      repeat,
      icon: getReminderIcon(type),
      color: getReminderColor(type),
    };

    try {
      const userId = await getUserId();
      
      if (editingReminder && !editingReminder.id.startsWith('mock-')) {
        // Update existing reminder via API
        // MedicationReminder expects: medicationName, dosage, frequency, scheduledTimes, startDate, endDate?, enabled, notes?
        await remindersApi.updateReminder(editingReminder.id, {
          medicationName: newReminder.title,
          dosage: description.split('-')[0]?.trim() || 'As prescribed',
          frequency: newReminder.repeat === 'daily' ? 'Once daily' : 
                     newReminder.repeat === 'weekly' ? 'Once weekly' : 
                     newReminder.repeat === 'monthly' ? 'Once monthly' : 'As needed',
          scheduledTimes: [newReminder.time.toTimeString().slice(0, 5)], // "HH:MM" format
          enabled: newReminder.enabled,
          notes: description.split('-').slice(1).join('-').trim() || undefined,
        });
      } else if (!editingReminder) {
        // Create new reminder via API
        const apiReminder = await remindersApi.createReminder({
          userId,
          medicationName: newReminder.title,
          dosage: description.split('-')[0]?.trim() || 'As prescribed',
          frequency: newReminder.repeat === 'daily' ? 'Once daily' : 
                     newReminder.repeat === 'weekly' ? 'Once weekly' : 
                     newReminder.repeat === 'monthly' ? 'Once monthly' : 'As needed',
          scheduledTimes: [newReminder.time.toTimeString().slice(0, 5)], // "HH:MM" format
          startDate: new Date().toISOString(),
          notes: description.split('-').slice(1).join('-').trim() || undefined,
        });
        newReminder.id = apiReminder.id;
      }

      if (editingReminder) {
        // Update existing reminder in state
        setReminders(reminders.map(r => r.id === editingReminder.id ? newReminder : r));
      } else {
        // Add new reminder to state
        setReminders([...reminders, newReminder]);
      }

      Alert.alert('Success', `Reminder ${editingReminder ? 'updated' : 'created'} successfully`);
      setShowAddModal(false);
      
      // Reload reminders to sync with backend
      await loadReminders();
    } catch (error) {
      logger.error('Error saving reminder', error);
      Alert.alert('Error', 'Failed to save reminder. Please try again.');
    }
  };

  const toggleReminder = async (reminderId: string) => {
    const reminder = reminders.find(r => r.id === reminderId);
    if (!reminder) return;

    const updatedReminder = { ...reminder, enabled: !reminder.enabled };
    setReminders(reminders.map(r => r.id === reminderId ? updatedReminder : r));

    // Update backend if not a mock reminder
    if (!reminderId.startsWith('mock-')) {
      try {
        if (updatedReminder.enabled) {
          // Re-enable: update reminder as enabled
          await remindersApi.updateReminder(reminderId, {
            enabled: true,
          });
        } else {
          // Disable: set enabled to false
          await remindersApi.updateReminder(reminderId, {
            enabled: false,
          });
        }
      } catch (error) {
        logger.error('Error toggling reminder', error);
        // Revert on error
        setReminders(reminders.map(r => r.id === reminderId ? reminder : r));
      }
    }
  };

  const deleteReminder = async (reminderId: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from backend if it's not a mock reminder
              if (!reminderId.startsWith('mock-')) {
                await remindersApi.deleteReminder(reminderId);
              }
              setReminders(reminders.filter(r => r.id !== reminderId));
              Alert.alert('Success', 'Reminder deleted successfully');
            } catch (error) {
              logger.error('Error deleting reminder', error);
              Alert.alert('Error', 'Failed to delete reminder');
            }
          }
        }
      ]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const ReminderCard = ({ reminder }: { reminder: Reminder }) => (
    <TouchableOpacity 
      style={[styles.reminderCard, !reminder.enabled && styles.reminderDisabled]}
      onPress={() => openEditModal(reminder)}
    >
      <View style={styles.reminderHeader}>
        <View style={[styles.reminderIcon, { backgroundColor: reminder.color + '20' }]}>
          <MaterialIcons name={reminder.icon as any} size={24} color={reminder.color} />
        </View>
        <View style={styles.reminderInfo}>
          <Text style={[styles.reminderTitle, !reminder.enabled && styles.disabledText]}>
            {reminder.title}
          </Text>
          <Text style={[styles.reminderDescription, !reminder.enabled && styles.disabledText]}>
            {reminder.description}
          </Text>
        </View>
        <Switch
          value={reminder.enabled}
          onValueChange={() => toggleReminder(reminder.id)}
          trackColor={{ false: colors.border, true: reminder.color + '80' }}
          thumbColor={reminder.enabled ? reminder.color : colors.card}
        />
      </View>
      
      <View style={styles.reminderFooter}>
        <View style={styles.reminderTime}>
          <MaterialIcons name="access-time" size={16} color={colors.textSecondary} />
          <Text style={styles.reminderTimeText}>{formatTime(reminder.time)}</Text>
        </View>
        <View style={styles.reminderRepeat}>
          <MaterialIcons name="repeat" size={16} color={colors.textSecondary} />
          <Text style={styles.reminderRepeatText}>{reminder.repeat}</Text>
        </View>
        <TouchableOpacity onPress={() => deleteReminder(reminder.id)}>
          <MaterialIcons name="delete" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const TypeButton = ({ 
    type: buttonType, 
    label, 
    icon 
  }: { 
    type: Reminder['type']; 
    label: string; 
    icon: string;
  }) => (
    <TouchableOpacity
      style={[
        styles.typeButton,
        type === buttonType && { backgroundColor: getReminderColor(buttonType) }
      ]}
      onPress={() => setType(buttonType)}
    >
      <MaterialIcons 
        name={icon as any} 
        size={20} 
        color={type === buttonType ? colors.card : colors.text} 
      />
      <Text style={[
        styles.typeButtonText,
        type === buttonType && { color: colors.card }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const RepeatButton = ({ value, label }: { value: Reminder['repeat']; label: string }) => (
    <TouchableOpacity
      style={[
        styles.repeatButton,
        repeat === value && { backgroundColor: colors.primary }
      ]}
      onPress={() => setRepeat(value)}
    >
      <Text style={[
        styles.repeatButtonText,
        repeat === value && { color: colors.card }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Reminders</Text>
        <TouchableOpacity onPress={openAddModal}>
          <MaterialIcons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading reminders...</Text>
        </View>
      ) : (
        <>
          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{reminders.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{reminders.filter(r => r.enabled).length}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{reminders.filter(r => r.repeat === 'daily').length}</Text>
              <Text style={styles.statLabel}>Daily</Text>
            </View>
          </View>

          {/* Reminders List */}
          <ScrollView style={styles.content}>
            {reminders.length === 0 ? (
              <EmptyState
                icon="notifications-none"
                title="No Reminders Yet"
                message="Tap the + button to create your first reminder for medications, appointments, or follow-ups."
                actionLabel="Create Reminder"
                onAction={openAddModal}
              />
            ) : (
          <View style={styles.remindersList}>
            {reminders.map(reminder => (
              <ReminderCard key={reminder.id} reminder={reminder} />
            ))}
          </View>
        )}
      </ScrollView>
      </>
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        statusBarTranslucent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingReminder ? 'Edit Reminder' : 'New Reminder'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Type Selection */}
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeButtons}>
                <TypeButton type="medication" label="Medication" icon="medication" />
                <TypeButton type="appointment" label="Appointment" icon="event" />
                <TypeButton type="followup" label="Follow-up" icon="schedule" />
                <TypeButton type="custom" label="Custom" icon="notifications" />
              </View>

              {/* Title Input */}
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Morning Medication"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />

              {/* Description Input */}
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add details about this reminder"
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />

              {/* Time Selection */}
              <Text style={styles.inputLabel}>Time</Text>
              <TouchableOpacity 
                style={styles.timeButton}
                onPress={() => {
                  Alert.alert(
                    'Set Time',
                    'Time picker will be available in the next update. For now, reminders are set for default times.',
                    [{ text: 'OK' }]
                  );
                }}
              >
                <MaterialIcons name="access-time" size={20} color={colors.primary} />
                <Text style={styles.timeButtonText}>{formatTime(time)}</Text>
              </TouchableOpacity>

              {/* Repeat Selection */}
              <Text style={styles.inputLabel}>Repeat</Text>
              <View style={styles.repeatButtons}>
                <RepeatButton value="once" label="Once" />
                <RepeatButton value="daily" label="Daily" />
                <RepeatButton value="weekly" label="Weekly" />
                <RepeatButton value="monthly" label="Monthly" />
              </View>

              {/* Save Button */}
              <TouchableOpacity style={styles.saveButton} onPress={saveReminder}>
                <MaterialIcons name="check" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>
                  {editingReminder ? 'Update Reminder' : 'Create Reminder'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  remindersList: {
    padding: 16,
  },
  reminderCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderDisabled: {
    opacity: 0.5,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  reminderDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  disabledText: {
    opacity: 0.5,
  },
  reminderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reminderTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  reminderTimeText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  reminderRepeat: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderRepeatText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    backgroundColor: colors.background,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  typeButtonText: {
    fontSize: 14,
    marginLeft: 4,
    color: colors.text,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
  },
  timeButtonText: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  repeatButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  repeatButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  repeatButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

const RemindersScreenWithErrorBoundary: React.FC<RemindersScreenProps> = (props) => (
  <ErrorBoundary>
    <RemindersScreen {...props} />
  </ErrorBoundary>
);

export default RemindersScreenWithErrorBoundary;
