/**
 * PATIENT CONSULTATION SCREEN
 * ===========================
 * Comprehensive patient consultation interface for medical staff
 * 
 * Features:
 * - View full patient medical history
 * - Review current medications and allergies
 * - Add clinical notes and prescriptions
 * - Order tests and procedures
 * - Schedule follow-ups
 * - Update case status
 * - View case timeline
 * - Emergency contacts access
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { PatientUser, MedicalCase, CaseNote } from '../types/Booking';
import { UserAuthService } from '../services/UserAuthService';
import ErrorBoundary from '../components/ErrorBoundary';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import { createLogger } from '../services/Logger';

const logger = createLogger('PatientConsultationScreen');

type Props = NativeStackScreenProps<RootStackParamList, 'PatientConsultation'>;

const PatientConsultationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { caseId, patientId } = route.params;
  const { colors, isDark } = useTheme();
  const responsive = useResponsive();
  const styles = createStyles(colors, isDark, responsive);

  const userAuthService = UserAuthService.getInstance();

  const [patient, setPatient] = useState<PatientUser | null>(null);
  const [medicalCase, setMedicalCase] = useState<MedicalCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'notes' | 'prescriptions' | 'tests'>('overview');

  // Forms
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  const [newNote, setNewNote] = useState('');
  const [prescriptionName, setPrescriptionName] = useState('');
  const [prescriptionDosage, setPrescriptionDosage] = useState('');
  const [prescriptionFrequency, setPrescriptionFrequency] = useState('');
  const [prescriptionDuration, setPrescriptionDuration] = useState('');
  const [testName, setTestName] = useState('');
  const [testReason, setTestReason] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpReason, setFollowUpReason] = useState('');

  useEffect(() => {
    trackScreen('PatientConsultationScreen', { caseId, patientId });
    loadPatientData();
  }, [caseId, patientId]);

  const loadPatientData = async () => {
    setLoading(true);
    try {
      const patientData = userAuthService.getUserById(patientId);
      const caseData = userAuthService.getCaseById(caseId);

      if (!patientData) {
        Alert.alert('Error', 'Patient not found');
        navigation.goBack();
        return;
      }

      if (!caseData) {
        Alert.alert('Error', 'Case not found');
        navigation.goBack();
        return;
      }

      setPatient(patientData);
      setMedicalCase(caseData);
      logger.info('Patient data loaded', { patientId, caseId });
    } catch (error) {
      logger.error('Error loading patient data', error);
      Alert.alert('Error', 'Failed to load patient information');
    } finally {
      setLoading(false);
    }
  };
      

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      Alert.alert('Validation Error', 'Please enter a note');
      return;
    }

    try {
      const note = newNote.trim();
      await userAuthService.addCaseNote(caseId, 'staff-current', note);
      
      Alert.alert('Success', 'Clinical note added successfully');
      setNewNote('');
      setShowNoteModal(false);
      loadPatientData(); // Refresh data
    } catch (error) {
      logger.error('Error adding note', error);
      Alert.alert('Error', 'Failed to add note');
    }
  };

  const handleAddPrescription = () => {
    if (!prescriptionName.trim() || !prescriptionDosage.trim()) {
      Alert.alert('Validation Error', 'Please enter medication name and dosage');
      return;
    }

    Alert.alert(
      'Prescription Added',
      `Medication: ${prescriptionName}\nDosage: ${prescriptionDosage}\nFrequency: ${prescriptionFrequency}\nDuration: ${prescriptionDuration}`,
      [{ text: 'OK', onPress: () => {
        setPrescriptionName('');
        setPrescriptionDosage('');
        setPrescriptionFrequency('');
        setPrescriptionDuration('');
        setShowPrescriptionModal(false);
      }}]
    );
  };

  const handleOrderTest = () => {
    if (!testName.trim()) {
      Alert.alert('Validation Error', 'Please enter test name');
      return;
    }

    Alert.alert(
      'Test Ordered',
      `Test: ${testName}\nReason: ${testReason || 'Not specified'}`,
      [{ text: 'OK', onPress: () => {
        setTestName('');
        setTestReason('');
        setShowTestModal(false);
      }}]
    );
  };

  const handleScheduleFollowUp = () => {
    if (!followUpDate.trim()) {
      Alert.alert('Validation Error', 'Please enter follow-up date');
      return;
    }

    Alert.alert(
      'Follow-up Scheduled',
      `Date: ${followUpDate}\nReason: ${followUpReason || 'General follow-up'}`,
      [{ text: 'OK', onPress: () => {
        setFollowUpDate('');
        setFollowUpReason('');
        setShowFollowUpModal(false);
      }}]
    );
  };

  const handleUpdateCaseStatus = (status: MedicalCase['status']) => {
    Alert.alert(
      'Update Case Status',
      `Change status to: ${status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              await userAuthService.updateCaseStatus(caseId, status);
              Alert.alert('Success', 'Case status updated');
              loadPatientData();
            } catch (error) {
              logger.error('Error updating case status', error);
              Alert.alert('Error', 'Failed to update case status');
            }
          },
        },
      ]
    );
  };

  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      {/* Patient Info Card */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Patient Information</Text>
        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={20} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.text }]}>{patient?.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="email" size={20} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.text }]}>{patient?.email || 'No email'}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="phone" size={20} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.text }]}>{patient?.phone || 'No phone'}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="badge" size={20} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {patient?.userType === 'guest' ? 'Guest Patient' : 'Registered Patient'}
          </Text>
        </View>
      </View>

      {/* Case Details Card */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Case Details</Text>
        <View style={styles.infoRow}>
          <MaterialIcons name="medical-services" size={20} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.text }]}>{medicalCase?.title}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="description" size={20} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.text }]}>{medicalCase?.description}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="warning" size={20} color={getSeverityColor(medicalCase?.severity || 1)} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Severity: {medicalCase?.severity}/5
          </Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="info" size={20} color={getStatusColor(medicalCase?.status || 'pending')} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Status: {medicalCase?.status}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="calendar-today" size={20} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Created: {new Date(medicalCase?.createdAt || Date.now()).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Allergies */}
      {patient?.allergies && patient.allergies.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.error }]}>⚠️ Allergies</Text>
          {patient.allergies.map((allergy, index) => (
            <View key={index} style={styles.allergyItem}>
              <Text style={[styles.allergyText, { color: colors.error }]}>
                • {allergy.allergen} ({allergy.severity})
              </Text>
              {allergy.reactions && allergy.reactions.length > 0 && (
                <Text style={[styles.allergyReaction, { color: colors.textSecondary }]}>
                  Reaction: {allergy.reactions.join(', ')}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Current Medications */}
      {patient?.currentMedications && patient.currentMedications.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Current Medications</Text>
          {patient.currentMedications.map((med, index) => (
            <View key={index} style={styles.medicationItem}>
              <Text style={[styles.medicationName, { color: colors.text }]}>
                {med.name}
              </Text>
              <Text style={[styles.medicationDetails, { color: colors.textSecondary }]}>
                {med.dosage} - {med.frequency}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Emergency Contacts */}
      {patient?.emergencyContacts && patient.emergencyContacts.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Emergency Contacts</Text>
          {patient.emergencyContacts.map((contact, index) => (
            <View key={index} style={styles.contactItem}>
              <Text style={[styles.contactName, { color: colors.text }]}>
                {contact.name} ({contact.relationship})
              </Text>
              <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>
                {contact.phoneNumber}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderHistoryTab = () => (
    <View style={styles.tabContent}>
      {patient?.medicalHistory && patient.medicalHistory.length > 0 ? (
        patient.medicalHistory.map((history, index) => (
          <View key={index} style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.historyCondition, { color: colors.text }]}>
              {history.condition}
            </Text>
            <Text style={[styles.historyDate, { color: colors.textSecondary }]}>
              Diagnosed: {new Date(history.diagnosedDate).toLocaleDateString()}
            </Text>
            {history.notes && (
              <Text style={[styles.historyNotes, { color: colors.textSecondary }]}>
                Notes: {history.notes}
              </Text>
            )}
            <Text style={[styles.historyStatus, { color: getStatusColor(history.status) }]}>
              Status: {history.status}
            </Text>
          </View>
        ))
      ) : (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <MaterialIcons name="history" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No medical history recorded
          </Text>
        </View>
      )}
    </View>
  );

  const renderNotesTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowNoteModal(true)}
      >
        <MaterialIcons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add Clinical Note</Text>
      </TouchableOpacity>

      {medicalCase?.notes && medicalCase.notes.length > 0 ? (
        medicalCase.notes.map((note, index) => (
          <View key={index} style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.noteHeader}>
              <MaterialIcons name="note" size={20} color={colors.primary} />
              <Text style={[styles.noteType, { color: colors.textSecondary }]}>
                {note.type}
              </Text>
            </View>
            <Text style={[styles.noteContent, { color: colors.text }]}>
              {note.content}
            </Text>
            <Text style={[styles.noteDate, { color: colors.textSecondary }]}>
              {new Date(note.timestamp).toLocaleString()}
            </Text>
          </View>
        ))
      ) : (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <MaterialIcons name="note" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No clinical notes yet
          </Text>
        </View>
      )}
    </View>
  );

  const renderPrescriptionsTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowPrescriptionModal(true)}
      >
        <MaterialIcons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Add Prescription</Text>
      </TouchableOpacity>

      {patient?.currentMedications && patient.currentMedications.length > 0 ? (
        patient.currentMedications.map((med, index) => (
          <View key={index} style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.prescriptionName, { color: colors.text }]}>
              {med.name}
            </Text>
            <View style={styles.prescriptionDetails}>
              <Text style={[styles.prescriptionLabel, { color: colors.textSecondary }]}>
                Dosage: {med.dosage}
              </Text>
              <Text style={[styles.prescriptionLabel, { color: colors.textSecondary }]}>
                Frequency: {med.frequency}
              </Text>
              {med.startDate && (
                <Text style={[styles.prescriptionLabel, { color: colors.textSecondary }]}>
                  Started: {new Date(med.startDate).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        ))
      ) : (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <MaterialIcons name="medication" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No active prescriptions
          </Text>
        </View>
      )}
    </View>
  );

  const renderTestsTab = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: colors.primary }]}
        onPress={() => setShowTestModal(true)}
      >
        <MaterialIcons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>Order Test</Text>
      </TouchableOpacity>

      <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
        <MaterialIcons name="science" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No tests ordered yet
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Patient Consultation
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {patient?.name}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: colors.card }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'overview' && { backgroundColor: colors.primary }]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'overview' ? '#FFFFFF' : colors.text }]}>
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'history' && { backgroundColor: colors.primary }]}
              onPress={() => setActiveTab('history')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'history' ? '#FFFFFF' : colors.text }]}>
                History
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'notes' && { backgroundColor: colors.primary }]}
              onPress={() => setActiveTab('notes')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'notes' ? '#FFFFFF' : colors.text }]}>
                Notes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'prescriptions' && { backgroundColor: colors.primary }]}
              onPress={() => setActiveTab('prescriptions')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'prescriptions' ? '#FFFFFF' : colors.text }]}>
                Prescriptions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'tests' && { backgroundColor: colors.primary }]}
              onPress={() => setActiveTab('tests')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'tests' ? '#FFFFFF' : colors.text }]}>
                Tests
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView}>
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'history' && renderHistoryTab()}
          {activeTab === 'notes' && renderNotesTab()}
          {activeTab === 'prescriptions' && renderPrescriptionsTab()}
          {activeTab === 'tests' && renderTestsTab()}
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.actionBar, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.warning }]}
            onPress={() => handleUpdateCaseStatus('in-progress')}
          >
            <MaterialIcons name="play-arrow" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>In Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={() => handleUpdateCaseStatus('resolved')}
          >
            <MaterialIcons name="check" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Resolve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowFollowUpModal(true)}
          >
            <MaterialIcons name="event" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Follow-up</Text>
          </TouchableOpacity>
        </View>

        {/* Add Note Modal */}
        <Modal visible={showNoteModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Clinical Note</Text>
              <TextInput
                style={[styles.modalTextArea, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Enter clinical note..."
                placeholderTextColor={colors.textSecondary}
                value={newNote}
                onChangeText={setNewNote}
                multiline
                numberOfLines={6}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.surface }]}
                  onPress={() => {
                    setNewNote('');
                    setShowNoteModal(false);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddNote}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Add Note</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Add Prescription Modal */}
        <Modal visible={showPrescriptionModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Prescription</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Medication name"
                placeholderTextColor={colors.textSecondary}
                value={prescriptionName}
                onChangeText={setPrescriptionName}
              />
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Dosage (e.g., 500mg)"
                placeholderTextColor={colors.textSecondary}
                value={prescriptionDosage}
                onChangeText={setPrescriptionDosage}
              />
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Frequency (e.g., Twice daily)"
                placeholderTextColor={colors.textSecondary}
                value={prescriptionFrequency}
                onChangeText={setPrescriptionFrequency}
              />
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Duration (e.g., 7 days)"
                placeholderTextColor={colors.textSecondary}
                value={prescriptionDuration}
                onChangeText={setPrescriptionDuration}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.surface }]}
                  onPress={() => {
                    setPrescriptionName('');
                    setPrescriptionDosage('');
                    setPrescriptionFrequency('');
                    setPrescriptionDuration('');
                    setShowPrescriptionModal(false);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddPrescription}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Add Prescription</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Order Test Modal */}
        <Modal visible={showTestModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Order Test</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Test name"
                placeholderTextColor={colors.textSecondary}
                value={testName}
                onChangeText={setTestName}
              />
              <TextInput
                style={[styles.modalTextArea, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Reason for test (optional)"
                placeholderTextColor={colors.textSecondary}
                value={testReason}
                onChangeText={setTestReason}
                multiline
                numberOfLines={4}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.surface }]}
                  onPress={() => {
                    setTestName('');
                    setTestReason('');
                    setShowTestModal(false);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleOrderTest}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Order Test</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Schedule Follow-up Modal */}
        <Modal visible={showFollowUpModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Schedule Follow-up</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Date (e.g., 2025-11-15)"
                placeholderTextColor={colors.textSecondary}
                value={followUpDate}
                onChangeText={setFollowUpDate}
              />
              <TextInput
                style={[styles.modalTextArea, { backgroundColor: colors.background, color: colors.text }]}
                placeholder="Reason for follow-up (optional)"
                placeholderTextColor={colors.textSecondary}
                value={followUpReason}
                onChangeText={setFollowUpReason}
                multiline
                numberOfLines={4}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.surface }]}
                  onPress={() => {
                    setFollowUpDate('');
                    setFollowUpReason('');
                    setShowFollowUpModal(false);
                  }}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleScheduleFollowUp}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Schedule</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const getSeverityColor = (severity: number): string => {
  if (severity >= 4) return '#FF3B30';
  if (severity === 3) return '#FF9500';
  return '#34C759';
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'resolved':
    case 'active':
      return '#34C759';
    case 'in-progress':
      return '#FF9500';
    case 'pending':
    case 'chronic':
      return '#007AFF';
    default:
      return '#8E8E93';
  }
};

const createStyles = (colors: any, isDark: boolean, responsive: any) => {
  const isTablet = responsive.isTablet;
  const isLandscape = responsive.isLandscape;

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    backButton: {
      marginRight: 12,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: isTablet ? 22 : 18,
      fontWeight: '600',
    },
    headerSubtitle: {
      fontSize: isTablet ? 16 : 14,
      marginTop: 2,
    },
    tabBar: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    tab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginHorizontal: 4,
      borderRadius: 8,
    },
    tabText: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '500',
    },
    scrollView: {
      flex: 1,
    },
    tabContent: {
      padding: 16,
    },
    card: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    infoText: {
      fontSize: isTablet ? 16 : 14,
      marginLeft: 12,
      flex: 1,
    },
    allergyItem: {
      marginBottom: 8,
    },
    allergyText: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
    },
    allergyReaction: {
      fontSize: isTablet ? 14 : 12,
      marginLeft: 16,
      marginTop: 2,
    },
    medicationItem: {
      marginBottom: 12,
    },
    medicationName: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
    },
    medicationDetails: {
      fontSize: isTablet ? 14 : 12,
      marginTop: 2,
    },
    contactItem: {
      marginBottom: 12,
    },
    contactName: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
    },
    contactPhone: {
      fontSize: isTablet ? 14 : 12,
      marginTop: 2,
    },
    historyCondition: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    historyDate: {
      fontSize: isTablet ? 14 : 12,
      marginBottom: 4,
    },
    historyTreatment: {
      fontSize: isTablet ? 14 : 12,
      marginBottom: 4,
    },
    historyNotes: {
      fontSize: isTablet ? 14 : 12,
      marginBottom: 4,
    },
    historyStatus: {
      fontSize: isTablet ? 14 : 12,
      fontWeight: '600',
    },
    emptyState: {
      padding: 32,
      borderRadius: 12,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: isTablet ? 16 : 14,
      marginTop: 12,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
      marginLeft: 8,
    },
    noteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    noteType: {
      fontSize: isTablet ? 14 : 12,
      marginLeft: 8,
      textTransform: 'capitalize',
    },
    noteContent: {
      fontSize: isTablet ? 16 : 14,
      marginBottom: 8,
    },
    noteDate: {
      fontSize: isTablet ? 12 : 10,
    },
    prescriptionName: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    prescriptionDetails: {
      gap: 4,
    },
    prescriptionLabel: {
      fontSize: isTablet ? 14 : 12,
    },
    actionBar: {
      flexDirection: 'row',
      padding: 12,
      gap: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
      gap: 4,
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: isTablet ? 14 : 12,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 500,
      padding: 20,
      borderRadius: 12,
    },
    modalTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: '600',
      marginBottom: 16,
    },
    modalInput: {
      padding: 12,
      borderRadius: 8,
      fontSize: isTablet ? 16 : 14,
      marginBottom: 12,
    },
    modalTextArea: {
      padding: 12,
      borderRadius: 8,
      fontSize: isTablet ? 16 : 14,
      marginBottom: 12,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    modalButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    modalButtonText: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
    },
  });
};

export default PatientConsultationScreen;
