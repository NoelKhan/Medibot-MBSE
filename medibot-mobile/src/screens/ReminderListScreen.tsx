/**
 * Reminder List Screen
 * ====================
 * View, create, edit, and delete reminders
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import MockReminderFollowupService, { MockReminder } from '../services/MockReminderFollowupService';
import EmptyState from '../components/EmptyState';
import ErrorBoundary from '../components/ErrorBoundary';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import { createLogger } from '../services/Logger';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';

const logger = createLogger('ReminderListScreen');

type ReminderStatus = 'pending' | 'sent' | 'dismissed' | 'completed';
type ReminderType = 'medication' | 'appointment' | 'followup' | 'test' | 'general';
type ReminderPriority = 'low' | 'medium' | 'high' | 'urgent';

const ReminderListScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const responsive = useResponsive();
  const styles = createStyles(colors, isDark, responsive);
  
  const [reminders, setReminders] = useState<MockReminder[]>([]);
  const [filteredReminders, setFilteredReminders] = useState<MockReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | ReminderStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<MockReminder | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<ReminderType>('general');
  const [formPriority, setFormPriority] = useState<ReminderPriority>('medium');
  const [saving, setSaving] = useState(false);

  const reminderService = MockReminderFollowupService.getInstance();

  useEffect(() => {
    trackScreen('ReminderListScreen');
    loadReminders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reminders, filter, searchQuery]);

  const loadReminders = async () => {
    try {
      setLoading(true);
      await reminderService.initialize();
      const data = await reminderService.getUserReminders('user_test');
      setReminders(data);
    } catch (error) {
      logger.error('Error loading reminders', error);
      Alert.alert('Error', 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reminders];

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(r => r.status === filter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.title.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query)
      );
    }

    // Sort by scheduled time
    filtered.sort((a, b) => {
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime();
    });

    setFilteredReminders(filtered);
  };

  const openCreateModal = () => {
    resetForm();
    setEditingReminder(null);
    setShowCreateModal(true);
  };

  const openEditModal = (reminder: MockReminder) => {
    setFormTitle(reminder.title);
    setFormDescription(reminder.description);
    setFormType(reminder.type);
    setFormPriority(reminder.priority);
    setEditingReminder(reminder);
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setFormType('general');
    setFormPriority('medium');
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      Alert.alert('Validation Error', 'Title is required');
      return;
    }

    try {
      setSaving(true);

      if (editingReminder) {
        // Update existing reminder
        const updated = await reminderService.updateReminderStatus(
          editingReminder.id,
          editingReminder.status
        );
        if (updated) {
          // Update other fields manually
          updated.title = formTitle;
          updated.description = formDescription;
          updated.type = formType;
          updated.priority = formPriority;
          updated.updatedAt = new Date();
          setReminders(prev =>
            prev.map(r => (r.id === updated.id ? updated : r))
          );
        }
        Alert.alert('Success', 'Reminder updated successfully');
      } else {
        // Create new reminder
        const newReminder = await reminderService.createReminder({
          userId: 'user_test',
          title: formTitle,
          description: formDescription,
          type: formType,
          priority: formPriority,
          scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          status: 'pending',
        });
        setReminders(prev => [...prev, newReminder]);
        Alert.alert('Success', 'Reminder created successfully');
      }

      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      logger.error('Error saving reminder', error);
      Alert.alert('Error', 'Failed to save reminder');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (reminder: MockReminder) => {
    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to delete "${reminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await reminderService.deleteReminder(reminder.id);
              setReminders(prev => prev.filter(r => r.id !== reminder.id));
              Alert.alert('Success', 'Reminder deleted');
            } catch (error) {
              logger.error('Error deleting reminder', error);
              Alert.alert('Error', 'Failed to delete reminder');
            }
          },
        },
      ]
    );
  };

  const handleMarkComplete = async (reminder: MockReminder) => {
    try {
      const updated = await reminderService.updateReminderStatus(reminder.id, 'completed');
      if (updated) {
        setReminders(prev =>
          prev.map(r => (r.id === updated.id ? updated : r))
        );
      }
    } catch (error) {
      logger.error('Error updating reminder', error);
      Alert.alert('Error', 'Failed to update reminder');
    }
  };

  const getPriorityColor = (priority: ReminderPriority) => {
    switch (priority) {
      case 'urgent':
        return '#DC2626';
      case 'high':
        return '#F59E0B';
      case 'medium':
        return '#3B82F6';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getTypeIcon = (type: ReminderType) => {
    switch (type) {
      case 'medication':
        return '💊';
      case 'appointment':
        return '📅';
      case 'followup':
        return '🔄';
      case 'test':
        return '🧪';
      case 'general':
        return '📝';
      default:
        return '📌';
    }
  };

  const formatDateTime = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (days < 0) return 'Overdue';
    if (days === 0 && hours < 24) return `In ${hours}h`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `In ${days} days`;
  };

  const renderReminder = ({ item }: { item: MockReminder }) => (
    <TouchableOpacity
      style={styles.reminderCard}
      onPress={() => openEditModal(item)}
    >
      <View style={styles.reminderHeader}>
        <Text style={styles.typeIcon}>{getTypeIcon(item.type)}</Text>
        <View style={styles.reminderHeaderText}>
          <Text style={styles.reminderTitle}>{item.title}</Text>
          <Text style={styles.reminderTime}>{formatDateTime(item.scheduledTime)}</Text>
        </View>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(item.priority) },
          ]}
        >
          <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.reminderDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.reminderFooter}>
        <View style={styles.reminderStatus}>
          <Text
            style={[
              styles.statusText,
              item.status === 'completed' && styles.completedText,
            ]}
          >
            {item.status.toUpperCase()}
          </Text>
          {item.recurring && (
            <Text style={styles.recurringText}>🔁 {item.recurring}</Text>
          )}
        </View>

        <View style={styles.actionButtons}>
          {item.status !== 'completed' && (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => handleMarkComplete(item)}
            >
              <Text style={styles.completeButtonText}>✓ Complete</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
          >
            <Text style={styles.deleteButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (label: string, value: 'all' | ReminderStatus) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === value && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === value && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Single Blue Banner Header with safe area padding */}
        <View style={[styles.bannerHeader, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.bannerTitle}>My Reminders</Text>
            <Text style={styles.bannerSubtitle}>Manage your alerts</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading reminders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Single Blue Banner Header with safe area padding */}
      <View style={[styles.bannerHeader, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.bannerTitle}>My Reminders</Text>
          <Text style={styles.bannerSubtitle}>Manage your alerts</Text>
        </View>
        <TouchableOpacity
          style={styles.headerCreateButton}
          onPress={openCreateModal}
        >
          <Text style={styles.headerCreateButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search reminders..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.filterContainer}>
        {renderFilterButton('All', 'all')}
        {renderFilterButton('Pending', 'pending')}
        {renderFilterButton('Completed', 'completed')}
        {renderFilterButton('Sent', 'sent')}
      </View>

      <FlatList
        data={filteredReminders}
        renderItem={renderReminder}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <EmptyState
            icon="notifications"
            title="No Reminders Found"
            message={
              filter !== 'all'
                ? 'Try changing the filter to see more reminders'
                : 'Create your first reminder to get started'
            }
            actionLabel={filter === 'all' ? 'Create Reminder' : undefined}
            onAction={filter === 'all' ? openCreateModal : undefined}
          />
        }
      />

      {/* Create/Edit Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingReminder ? 'Edit Reminder' : 'New Reminder'}
              </Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Title *"
              value={formTitle}
              onChangeText={setFormTitle}
              placeholderTextColor="#9CA3AF"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              value={formDescription}
              onChangeText={setFormDescription}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Type</Text>
              <View style={styles.pickerButtons}>
                {(['general', 'medication', 'appointment', 'followup', 'test'] as ReminderType[]).map(
                  type => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.pickerButton,
                        formType === type && styles.pickerButtonActive,
                      ]}
                      onPress={() => setFormType(type)}
                    >
                      <Text
                        style={[
                          styles.pickerButtonText,
                          formType === type && styles.pickerButtonTextActive,
                        ]}
                      >
                        {getTypeIcon(type)} {type}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>Priority</Text>
              <View style={styles.pickerButtons}>
                {(['low', 'medium', 'high', 'urgent'] as ReminderPriority[]).map(priority => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.pickerButton,
                      formPriority === priority && styles.pickerButtonActive,
                    ]}
                    onPress={() => setFormPriority(priority)}
                  >
                    <Text
                      style={[
                        styles.pickerButtonText,
                        formPriority === priority && styles.pickerButtonTextActive,
                      ]}
                    >
                      {priority}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingReminder ? 'Update' : 'Create'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: colors.info, // Use theme info color for reminders
    paddingBottom: isLandscape && !isTablet ? 12 : 16,
    paddingHorizontal: contentPadding,
    // paddingTop is set inline using insets.top
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginTop: 4,
  },
  backButton: {
    padding: 4,
    marginTop: 4,
  },
  bannerTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: isTablet ? 14 : 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  headerCreateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  headerCreateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: isTablet ? 15 : 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: isTablet ? 17 : 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    backgroundColor: isDark ? colors.card : colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    color: colors.text,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: isDark ? colors.card : colors.background,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: '#FFF',
  },
  listContainer: {
    padding: 16,
  },
  reminderCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  reminderHeaderText: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  reminderTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  reminderDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  reminderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  reminderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  completedText: {
    color: colors.success,
  },
  recurringText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  completeButton: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: isDark ? '#7F1D1D' : '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalClose: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  input: {
    backgroundColor: isDark ? colors.card : colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  pickerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: isDark ? colors.card : colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pickerButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  pickerButtonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: isDark ? colors.card : colors.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
};

const ReminderListScreenWithErrorBoundary: React.FC = (props) => (
  <ErrorBoundary>
    <ReminderListScreen {...props} />
  </ErrorBoundary>
);

export default ReminderListScreenWithErrorBoundary;
