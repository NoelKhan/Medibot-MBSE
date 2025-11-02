/**
 * DOCTOR SERVICES SCREEN
 * ======================
 * Unified screen for immediate consultations and scheduled appointments
 * 
 * Features:
 * - Tab 1: Immediate Consultation - Connect with online doctors now
 * - Tab 2: Book Appointment - Schedule future appointments
 * - Consistent UI/UX across both flows
 * - Theme-aware styling
 */

import React, { useState, useEffect, useRef } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Doctor, AvailabilitySlot, BookingRequest } from '../types/Booking';
import BookingService from '../services/BookingService';
// Removed deprecated notificationService import
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { calendarService } from '../services/CalendarService';
import EmptyState from '../components/EmptyState';
import ErrorBoundary from '../components/ErrorBoundary';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import { createLogger } from '../services/Logger';

const logger = createLogger('DoctorServicesScreen');

interface DoctorServicesScreenProps {
  navigation: any;
  route?: {
    params?: {
      user?: any;
      initialTab?: 'immediate' | 'scheduled';
    };
  };
}

interface OnlineDoctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  experience: number;
  consultationFee: number;
  languages: string[];
  isOnline: boolean;
  availableNow: boolean;
  estimatedWaitTime: number;
}

type ServiceTab = 'immediate' | 'scheduled';

const DoctorServicesScreen: React.FC<DoctorServicesScreenProps> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const styles = createStyles(colors, responsive);
  
  const [activeTab, setActiveTab] = useState<ServiceTab>(route?.params?.initialTab || 'immediate');
  const [loading, setLoading] = useState(true);
  
  // Immediate consultation state
  const [onlineDoctors, setOnlineDoctors] = useState<OnlineDoctor[]>([]);
  const [selectedOnlineDoctor, setSelectedOnlineDoctor] = useState<OnlineDoctor | null>(null);
  const [consultationType, setConsultationType] = useState<'video' | 'phone' | 'chat'>('video');
  const [immediateSymptoms, setImmediateSymptoms] = useState('');
  const [immediateDescription, setImmediateDescription] = useState('');
  const [urgency, setUrgency] = useState<'routine' | 'urgent'>('routine');
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  
  // Scheduled appointment state
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showAvailability, setShowAvailability] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [bookingReason, setBookingReason] = useState('');
  const [scheduledConsultationType, setScheduledConsultationType] = useState<'in-person' | 'telehealth'>('in-person');
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Contact & Reminder Preferences (Phase 4)
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingMobile, setBookingMobile] = useState('');
  const [reminderCalendar, setReminderCalendar] = useState(true);
  const [reminderSMS, setReminderSMS] = useState(false);
  const [reminderEmail, setReminderEmail] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [consultationInProgress, setConsultationInProgress] = useState(false);

  // Scroll ref for modal
  const modalScrollRef = useRef<ScrollView>(null);

  const specialties = [
    'All',
    'General Practice',
    'Cardiology',
    'Dermatology',
    'Mental Health',
    'Pediatrics',
    'Orthopedics',
    'Gynecology',
  ];

  const bookingService = BookingService.getInstance();

  // Track screen view
  useEffect(() => {
    trackScreen('DoctorServicesScreen', { 
      initialTab: activeTab,
      hasUser: !!route?.params?.user 
    });
  }, []);

  // Auto-fill email/mobile from user profile
  useEffect(() => {
    const user = route?.params?.user;
    if (user) {
      if (user.email && !bookingEmail) {
        setBookingEmail(user.email);
      }
      if (user.phoneNumber && !bookingMobile) {
        setBookingMobile(user.phoneNumber);
      }
    }
  }, [route?.params?.user]);

  useEffect(() => {
    if (activeTab === 'immediate') {
      loadOnlineDoctors();
    } else {
      loadDoctors();
    }
  }, [activeTab, selectedSpecialty]);

  const loadOnlineDoctors = async () => {
    try {
      setLoading(true);
      // Mock online doctors
      const mockOnlineDoctors: OnlineDoctor[] = [
        {
          id: 'doc_online_001',
          name: 'Dr. Sarah Chen',
          specialty: 'General Practice',
          rating: 4.8,
          experience: 12,
          consultationFee: 75,
          languages: ['English', 'Mandarin'],
          isOnline: true,
          availableNow: true,
          estimatedWaitTime: 5,
        },
        {
          id: 'doc_online_002',
          name: 'Dr. Michael Johnson',
          specialty: 'Internal Medicine',
          rating: 4.9,
          experience: 15,
          consultationFee: 85,
          languages: ['English'],
          isOnline: true,
          availableNow: true,
          estimatedWaitTime: 3,
        },
        {
          id: 'doc_online_003',
          name: 'Dr. Priya Patel',
          specialty: 'Dermatology',
          rating: 4.7,
          experience: 10,
          consultationFee: 80,
          languages: ['English', 'Hindi'],
          isOnline: true,
          availableNow: true,
          estimatedWaitTime: 8,
        },
      ];
      setOnlineDoctors(mockOnlineDoctors);
    } catch (error) {
      Alert.alert('Error', 'Failed to load online doctors.');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const result = await bookingService.searchDoctors(
        selectedSpecialty === 'All' ? undefined : selectedSpecialty
      );
      setDoctors(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced search/filter for doctors
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = 
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doctor.location?.city && doctor.location.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doctor.location?.state && doctor.location.state.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doctor.qualifications && doctor.qualifications.some(q => q.toLowerCase().includes(searchQuery.toLowerCase())));
    
    return matchesSearch;
  });

  // Enhanced search for online doctors
  const filteredOnlineDoctors = onlineDoctors.filter(doctor => {
    const matchesSearch = 
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.languages.some(lang => lang.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  const handleImmediateConsultation = async () => {
    if (!selectedOnlineDoctor || !immediateDescription.trim()) {
      Alert.alert('Missing Information', 'Please select a doctor and describe your symptoms.');
      return;
    }

    Alert.alert(
      'Start Consultation',
      `Connect with ${selectedOnlineDoctor.name} via ${consultationType}?\n\nEstimated wait: ${selectedOnlineDoctor.estimatedWaitTime} min\nFee: $${selectedOnlineDoctor.consultationFee}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setConsultationInProgress(true);
            try {
              // TODO: Implement backend API call for consultation booking
              // const consultation = await bookingService.createImmediateConsultation({
              //   doctorId: selectedOnlineDoctor.id,
              //   description: immediateDescription,
              //   consultationType: consultationType,
              // });
              
              // Simulate API delay
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              setShowConsultationModal(false);
              Alert.alert('Success', 'Consultation request sent! You will be connected shortly.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to start consultation.');
            } finally {
              setConsultationInProgress(false);
            }
          },
        },
      ]
    );
  };

  const handleDoctorSelect = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setSelectedSlot(null);
    setBookingReason('');
    setLoadingSlots(true);
    
    try {
      const availability = await bookingService.getDoctorAvailability(doctor.id, new Date());
      setAvailabilitySlots(availability);
      setLoadingSlots(false);
    } catch (error) {
      setLoadingSlots(false);
      Alert.alert('Error', 'Failed to load availability. Please try again.');
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedSlot || !bookingReason.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    // Validate email (required)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!bookingEmail.trim() || !emailRegex.test(bookingEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    // Validate mobile if SMS reminder is selected
    if (reminderSMS && !bookingMobile.trim()) {
      Alert.alert('Mobile Required', 'Please enter a mobile number for SMS reminders.');
      return;
    }

    const bookingRequest: BookingRequest = {
      doctorId: selectedDoctor.id,
      preferredDate: selectedSlot.date,
      preferredTime: selectedSlot.startTime,
      consultationType: scheduledConsultationType,
      reason: bookingReason,
      urgency: 'routine',
      symptoms: [],
    };

    setBookingInProgress(true);
    try {
      const appointment = await bookingService.createAppointment(bookingRequest);
      
      // Store contact & reminder preferences (client-side for now)
      // TODO: Backend API integration - send to POST /api/appointments/:id/preferences
      const preferences = {
        email: bookingEmail,
        mobile: bookingMobile || undefined,
        reminders: {
          calendar: reminderCalendar,
          sms: reminderSMS,
          email: reminderEmail,
        },
      };
      logger.info('Booking preferences', preferences);
      
      // Backend automatically handles:
      // ✅ Push notification (appointment confirmed)
      // ✅ Email confirmation (if enabled in preferences)
      // ✅ Creates reminders (1hr + 24hr before appointment)
      
      const appointmentDate = new Date(selectedSlot.date);

      Alert.alert(
        '✅ Booking Confirmed!',
        `Your appointment has been booked successfully!\n\n👨‍⚕️ Doctor: ${selectedDoctor.name}\n📅 Date: ${appointmentDate.toLocaleDateString()}\n⏰ Time: ${selectedSlot.startTime}\n🏥 Location: ${selectedDoctor.hospital}\n📍 ${selectedDoctor.location?.address || 'Address not available'}\n\n✅ You will receive reminders before your appointment\n📧 Confirmation email has been sent\n🔔 Push notification sent`,
        [
          {
            text: 'Add to Calendar',
            onPress: async () => {
              await addToCalendar(
                appointmentDate,
                selectedSlot.startTime,
                selectedDoctor
              );
              closeAvailabilityModal();
              navigation.goBack();
            }
          },
          {
            text: 'Done',
            onPress: () => {
              closeAvailabilityModal();
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      logger.error('Booking error', error);
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setBookingInProgress(false);
    }
  };

  const closeAvailabilityModal = () => {
    setShowAvailability(false);
    setSelectedSlot(null);
    setBookingReason('');
    setBookingEmail('');
    setBookingMobile('');
    setReminderCalendar(true);
    setReminderSMS(false);
    setReminderEmail(true);
  };

  const closeBookingForm = () => {
    setSelectedDoctor(null);
    setSelectedSlot(null);
    setBookingReason('');
    setBookingEmail('');
    setBookingMobile('');
    setAvailabilitySlots([]);
  };

  const addToCalendar = async (date: Date, time: string, doctor: Doctor) => {
    try {
      await calendarService.addAppointmentToCalendar({
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        date: date,
        startTime: time,
        duration: 30, // 30 minutes
        location: `${doctor.hospital}, ${doctor.location?.address || ''}`,
        consultationFee: doctor.consultationFee,
        reason: bookingReason,
      });
    } catch (error) {
      logger.error('Error adding to calendar', error);
      // Error handling is done inside calendarService
    }
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'immediate' && styles.activeTab]}
        onPress={() => setActiveTab('immediate')}
      >
        <MaterialIcons
          name="video-call"
          size={24}
          color={activeTab === 'immediate' ? colors.primary : colors.textSecondary}
        />
        <Text style={[styles.tabText, activeTab === 'immediate' && styles.activeTabText]}>
          Consult Now
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'scheduled' && styles.activeTab]}
        onPress={() => setActiveTab('scheduled')}
      >
        <MaterialIcons
          name="event"
          size={24}
          color={activeTab === 'scheduled' ? colors.primary : colors.textSecondary}
        />
        <Text style={[styles.tabText, activeTab === 'scheduled' && styles.activeTabText]}>
          Book Appointment
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderOnlineDoctorCard = (doctor: OnlineDoctor) => (
    <TouchableOpacity
      key={doctor.id}
      style={[styles.doctorCard, selectedOnlineDoctor?.id === doctor.id && styles.selectedCard]}
      onPress={() => setSelectedOnlineDoctor(doctor)}
    >
      <View style={styles.doctorHeader}>
        <View style={styles.onlineIndicator} />
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </View>

      <View style={styles.doctorDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="star" size={16} color="#FFD700" />
          <Text style={styles.detailText}>{doctor.rating} • {doctor.experience} years</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="access-time" size={16} color={colors.primary} />
          <Text style={styles.detailText}>Available in {doctor.estimatedWaitTime} min</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="attach-money" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>${doctor.consultationFee}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderDoctorCard = (doctor: Doctor) => (
    <TouchableOpacity
      key={doctor.id}
      style={styles.doctorCard}
      onPress={() => handleDoctorSelect(doctor)}
    >
      <View style={styles.doctorHeader}>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
      </View>

      <View style={styles.doctorDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="star" size={16} color="#FFD700" />
          <Text style={styles.detailText}>{doctor.rating} • {doctor.experience} years</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="location-on" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>{`${doctor.location.city}, ${doctor.location.state}`}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="attach-money" size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>${doctor.consultationFee}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderImmediateConsultation = () => (
    <ScrollView style={styles.content}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, specialty, or language..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : filteredOnlineDoctors.length === 0 ? (
        <EmptyState
          icon="search-off"
          title="No Doctors Found"
          message="Try adjusting your search terms or check back later"
        />
      ) : (
        <>
          {filteredOnlineDoctors.map(renderOnlineDoctorCard)}

          {selectedOnlineDoctor && (
            <View style={styles.consultationForm}>
              <Text style={styles.sectionTitle}>Consultation Details</Text>

              <Text style={styles.label}>Consultation Type</Text>
              <View style={styles.typeSelector}>
                {(['video', 'phone', 'chat'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.typeButton, consultationType === type && styles.activeTypeButton]}
                    onPress={() => setConsultationType(type)}
                  >
                    <MaterialIcons
                      name={type === 'video' ? 'videocam' : type === 'phone' ? 'phone' : 'chat'}
                      size={20}
                      color={consultationType === type ? '#fff' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeButtonText,
                        consultationType === type && styles.activeTypeButtonText,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Describe Your Symptoms *</Text>
              <TextInput
                style={styles.textArea}
                placeholder="What brings you here today?"
                placeholderTextColor={colors.textSecondary}
                value={immediateDescription}
                onChangeText={setImmediateDescription}
                multiline
                numberOfLines={4}
              />

              <TouchableOpacity 
                style={[styles.primaryButton, consultationInProgress && styles.buttonDisabled]} 
                onPress={handleImmediateConsultation}
                disabled={consultationInProgress}
              >
                {consultationInProgress ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.buttonText}>Starting...</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="video-call" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Start Consultation</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );

  const renderScheduledAppointment = () => (
    <ScrollView style={styles.content}>
      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search doctors..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.specialtyScroll}>
        {specialties.map((specialty) => (
          <TouchableOpacity
            key={specialty}
            style={[
              styles.specialtyChip,
              selectedSpecialty === specialty && styles.activeSpecialtyChip,
            ]}
            onPress={() => setSelectedSpecialty(specialty)}
          >
            <Text
              style={[
                styles.specialtyChipText,
                selectedSpecialty === specialty && styles.activeSpecialtyChipText,
              ]}
            >
              {specialty}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : filteredDoctors.length === 0 ? (
        <EmptyState
          icon="search-off"
          title="No Doctors Found"
          message="Try adjusting your search or specialty filter"
        />
      ) : (
        filteredDoctors.map(renderDoctorCard)
      )}

      {/* Inline Booking Form - appears when doctor is selected */}
      {selectedDoctor && (
        <View style={styles.bookingSection}>
          <View style={styles.bookingHeader}>
            <View style={styles.doctorSummaryInline}>
              <Text style={styles.doctorSummaryName}>{selectedDoctor.name}</Text>
              <Text style={styles.doctorSummarySpecialty}>{selectedDoctor.specialty}</Text>
            </View>
            <TouchableOpacity onPress={closeBookingForm}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {loadingSlots ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading available times...</Text>
            </View>
          ) : availabilitySlots.length === 0 ? (
            <EmptyState
              icon="event-busy"
              title="No Available Slots"
              message="Try another doctor"
            />
          ) : (
            <>
              <Text style={styles.slotsHeader}>Select Time Slot</Text>
              {availabilitySlots.map((slot, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.slotCard, selectedSlot === slot && styles.selectedSlot]}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.7}
                >
                  <View style={styles.slotMainContent}>
                    <View style={styles.slotInfo}>
                      <MaterialIcons 
                        name="event" 
                        size={24} 
                        color={selectedSlot === slot ? '#FFFFFF' : colors.primary} 
                      />
                      <View style={styles.slotTextContainer}>
                        <Text style={[styles.slotDate, selectedSlot === slot && styles.selectedSlotText]}>
                          {new Date(slot.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </Text>
                        <Text style={[styles.slotTime, selectedSlot === slot && styles.selectedSlotText]}>
                          {slot.startTime} - {slot.endTime}
                        </Text>
                      </View>
                    </View>
                    {selectedSlot === slot && (
                      <MaterialIcons name="check-circle" size={28} color="#FFFFFF" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}

              {selectedSlot && (
                <View style={styles.bookingForm}>
                  <Text style={styles.label}>Reason for Visit *</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Describe your reason..."
                    placeholderTextColor={colors.textSecondary}
                    value={bookingReason}
                    onChangeText={setBookingReason}
                    multiline
                    numberOfLines={3}
                  />

                  <Text style={styles.label}>Type</Text>
                  <View style={styles.typeSelector}>
                    <TouchableOpacity
                      style={[styles.typeButton, scheduledConsultationType === 'in-person' && styles.activeTypeButton]}
                      onPress={() => setScheduledConsultationType('in-person')}
                    >
                      <Text style={[styles.typeButtonText, scheduledConsultationType === 'in-person' && styles.activeTypeButtonText]}>
                        In-Person
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.typeButton, scheduledConsultationType === 'telehealth' && styles.activeTypeButton]}
                      onPress={() => setScheduledConsultationType('telehealth')}
                    >
                      <Text style={[styles.typeButtonText, scheduledConsultationType === 'telehealth' && styles.activeTypeButtonText]}>
                        Telehealth
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.label}>Email *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="your.email@example.com"
                    placeholderTextColor={colors.textSecondary}
                    value={bookingEmail}
                    onChangeText={setBookingEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />

                  <TouchableOpacity 
                    style={[styles.primaryButton, bookingInProgress && styles.buttonDisabled]} 
                    onPress={handleBookAppointment}
                    disabled={bookingInProgress}
                  >
                    {bookingInProgress ? (
                      <>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.buttonText}>Booking...</Text>
                      </>
                    ) : (
                      <>
                        <MaterialIcons name="check" size={24} color="#fff" />
                        <Text style={styles.buttonText}>Confirm Booking</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
      {/* Single Purple Banner Header with safe area padding */}
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.topBarTitle}>Doctor Services</Text>
          <Text style={styles.topBarSubtitle}>Connect with healthcare professionals</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Emergency Warning Banner */}
      <View style={styles.emergencyWarning}>
        <MaterialIcons name="warning" size={20} color="#fff" />
        <Text style={styles.emergencyWarningText}>
          🚨 For medical emergencies, call emergency services immediately
        </Text>
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => {
            Alert.alert(
              'Emergency Call',
              'In a medical emergency, always call:\n\n🚑 911 (USA)\n🚑 000 (Australia)\n🚑 999 (UK)\n\nOr use the Emergency SOS feature on your phone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Dial Emergency', onPress: () => Alert.alert('Demo Mode', 'In production, this would dial emergency services.') }
              ]
            );
          }}
        >
          <Text style={styles.emergencyButtonText}>Emergency</Text>
        </TouchableOpacity>
      </View>

      {renderTabBar()}
      {activeTab === 'immediate' ? renderImmediateConsultation() : renderScheduledAppointment()}
      </KeyboardAvoidingView>
    </View>
  );
};

const createStyles = (colors: any, responsive: any) => {
  const isLandscape = responsive.isLandscape;
  const isTablet = responsive.isTablet;
  const contentPadding = isTablet ? 24 : 16;
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    flex1: {
      flex: 1,
    },
    topBar: {
      backgroundColor: '#5856D6', // Purple to match button scheme
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
    topBarTitle: {
      fontSize: isTablet ? 22 : 20,
      fontWeight: '700',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    topBarSubtitle: {
      fontSize: isTablet ? 14 : 13,
      color: 'rgba(255, 255, 255, 0.85)',
      lineHeight: 18,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      paddingVertical: 4,
      paddingHorizontal: 8,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginHorizontal: 4,
    },
    activeTab: {
      backgroundColor: colors.primary + '20',
    },
    tabText: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.primary,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    loader: {
      marginTop: 40,
    },
    doctorCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    selectedCard: {
      borderWidth: 2,
      borderColor: colors.primary,
    },
    doctorHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    onlineIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#4CAF50',
      marginRight: 12,
    },
    doctorInfo: {
      flex: 1,
    },
    doctorName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    doctorSpecialty: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    doctorDetails: {
      gap: 8,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    detailText: {
      fontSize: 14,
      color: colors.text,
    },
    consultationForm: {
      marginTop: 24,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
      marginTop: 12,
    },
    typeSelector: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },
    typeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    activeTypeButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    typeButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    activeTypeButtonText: {
      color: '#fff',
    },
    textArea: {
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      textAlignVertical: 'top',
      minHeight: 100,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 8,
      marginTop: 16,
      gap: 8,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      marginLeft: 12,
      fontSize: 16,
      color: colors.text,
    },
    specialtyScroll: {
      marginBottom: 16,
    },
    specialtyChip: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      backgroundColor: colors.surface,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeSpecialtyChip: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    specialtyChipText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    activeSpecialtyChipText: {
      color: '#fff',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
      maxHeight: '80%',
    },
    modalScrollView: {
      flex: 1,
    },
    modalScrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    doctorSummaryCard: {
      backgroundColor: colors.surface,
      padding: 16,
      marginHorizontal: 20,
      marginTop: 16,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    doctorSummaryName: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    doctorSummarySpecialty: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.primary,
      marginBottom: 4,
    },
    doctorSummaryHospital: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textSecondary,
    },
    slotsHeader: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
      marginTop: 4,
    },
    slotCard: {
      flexDirection: 'column',
      padding: 16,
      marginTop: 12,
      marginHorizontal: 0,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    selectedSlot: {
      borderColor: colors.primary,
      borderWidth: 3,
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    selectedSlotText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    slotMainContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    slotInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    slotTextContainer: {
      flexDirection: 'column',
      gap: 4,
    },
    slotDate: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    slotTime: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    slotActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginLeft: 12,
    },
    availableBadge: {
      backgroundColor: '#4CAF50',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
    },
    availableBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.5,
    },
    bookingForm: {
      marginTop: 20,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    emergencyWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f44336',
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 8,
    },
    emergencyWarningText: {
      flex: 1,
      color: '#fff',
      fontSize: 13,
      fontWeight: '500',
    },
    emergencyButton: {
      backgroundColor: '#fff',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    emergencyButtonText: {
      color: '#f44336',
      fontSize: 12,
      fontWeight: '700',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    emptyStateText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    // Phase 4: Contact & Reminder Styles
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    checkboxRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 12,
      gap: 12,
    },
    checkboxRowDisabled: {
      opacity: 0.5,
    },
    checkboxContent: {
      flex: 1,
    },
    checkboxLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    checkboxLabelDisabled: {
      color: colors.textSecondary,
    },
    checkboxDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    checkboxDescriptionDisabled: {
      opacity: 0.6,
    },
    bookingSection: {
  backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    bookingHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    doctorSummaryInline: {
      flex: 1,
    },
  });
};

const DoctorServicesScreenWithErrorBoundary: React.FC<DoctorServicesScreenProps> = (props) => (
  <ErrorBoundary>
    <DoctorServicesScreen {...props} />
  </ErrorBoundary>
);

export default DoctorServicesScreenWithErrorBoundary;
