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
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Doctor, AvailabilitySlot, BookingRequest } from '../types/Booking';
import BookingService from '../services/BookingService';
// Removed deprecated notificationService import
import { useTheme } from '../contexts/ThemeContext';
import { createLogger } from '../services/Logger';

const logger = createLogger('BookDoctorScreen');

interface BookDoctorScreenProps {
  navigation: any;
}

const BookDoctorScreen: React.FC<BookDoctorScreenProps> = ({ navigation }) => {
  const { theme, colors } = useTheme();
  const styles = createStyles(colors);
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showAvailability, setShowAvailability] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [bookingReason, setBookingReason] = useState('');
  const [consultationType, setConsultationType] = useState<'in-person' | 'telehealth'>('in-person');
  const [urgency, setUrgency] = useState<'routine' | 'urgent'>('routine');
  const [symptoms, setSymptoms] = useState('');

  const specialties = [
    'All',
    'General Practice',
    'Cardiology', 
    'Dermatology',
    'Mental Health',
    'Pediatrics',
    'Orthopedics',
    'Gynecology'
  ];

  const bookingService = BookingService.getInstance();

  useEffect(() => {
    loadDoctors();
  }, [selectedSpecialty]);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const result = await bookingService.searchDoctors(
        selectedSpecialty === 'All' ? undefined : selectedSpecialty
      );
      setDoctors(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to load doctors. Please try again.');
      logger.error('Error loading doctors', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = async (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    try {
      const availability = await bookingService.getDoctorAvailability(
        doctor.id, 
        new Date()
      );
      setAvailabilitySlots(availability);
      setShowAvailability(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load availability. Please try again.');
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedSlot || !bookingReason.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    const bookingRequest: BookingRequest = {
      doctorId: selectedDoctor.id,
      preferredDate: selectedSlot.date,
      preferredTime: selectedSlot.startTime,
      consultationType,
      reason: bookingReason,
      urgency,
      symptoms: symptoms.split(',').map(s => s.trim()).filter(s => s.length > 0),
      patientNotes: `Consultation type: ${consultationType}\nSymptoms: ${symptoms}`
    };

    try {
      setLoading(true);
      const result = await bookingService.createAppointment(bookingRequest);
      // Appointment reminder logic removed (migration)
      Alert.alert(
        'Booking Confirmed!',
        `Your appointment has been booked successfully!\n\n👨‍⚕️ Doctor: ${selectedDoctor.name}\n📅 Date: ${selectedSlot.date.toLocaleDateString()}\n⏰ Time: ${selectedSlot.startTime}\n🏥 Location: ${selectedDoctor.hospital}\n\nConfirmation Code: ${result.confirmationCode}\nAppointment ID: ${result.appointmentId}\n\n📧 You will receive a confirmation email shortly.`,
        [
          {
            text: 'Done',
            onPress: () => {
              setShowAvailability(false);
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Booking Failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.hospital.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-AU', {
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const renderDoctorCard = ({ item: doctor }: { item: Doctor }) => (
    <TouchableOpacity
      style={styles.doctorCard}
      onPress={() => handleDoctorSelect(doctor)}
    >
      <View style={styles.doctorHeader}>
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
          <Text style={styles.doctorHospital}>{doctor.hospital}</Text>
        </View>
        <View style={styles.doctorMeta}>
          <View style={styles.ratingContainer}>
            <MaterialIcons name="star" size={16} color={colors.warning} />
            <Text style={styles.rating}>{doctor.rating}</Text>
          </View>
          <Text style={styles.experience}>{doctor.experience} years exp.</Text>
          <Text style={styles.fee}>${doctor.consultationFee}</Text>
        </View>
      </View>
      
      <View style={styles.doctorDetails}>
        <Text style={styles.location}>
          <MaterialIcons name="location-on" size={14} color={colors.textSecondary} />
          {` ${doctor.location.address}, ${doctor.location.city}`}
        </Text>
        <Text style={styles.qualifications}>
          {doctor.qualifications.join(', ')}
        </Text>
        <Text style={styles.languages}>
          Languages: {doctor.languages.join(', ')}
        </Text>
      </View>
      
      <View style={styles.availabilityPreview}>
        <Text style={styles.availabilityText}>
          {doctor.availability.length > 0 
            ? `Next available: ${formatDate(doctor.availability[0].date)}`
            : 'No availability'
          }
        </Text>
        <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
      </View>
    </TouchableOpacity>
  );

  const renderAvailabilitySlot = ({ item: slot }: { item: AvailabilitySlot }) => (
    <TouchableOpacity
      style={[
        styles.slotCard,
        selectedSlot?.id === slot.id && styles.selectedSlot
      ]}
      onPress={() => setSelectedSlot(slot)}
    >
      <Text style={styles.slotDate}>{formatDate(slot.date)}</Text>
      <Text style={styles.slotTime}>{slot.startTime} - {slot.endTime}</Text>
      <Text style={styles.slotType}>
        {slot.consultationType === 'both' ? 'In-person or Telehealth' : slot.consultationType}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Doctor</Text>
      </View>

      {/* Emergency Warning Banner */}
      <View style={styles.emergencyWarning}>
        <MaterialIcons name="warning" size={20} color={colors.error} />
        <Text style={styles.emergencyWarningText}>
          🚨 For medical emergencies, use the Emergency Call feature or dial 000 immediately
        </Text>
        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={() => navigation.navigate('EmergencyCall' as any, { emergencyType: 'medical' })}
        >
          <Text style={styles.emergencyButtonText}>Emergency</Text>
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search doctors, specialties, hospitals..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.specialtyFilter}
        >
          {specialties.map((specialty) => (
            <TouchableOpacity
              key={specialty}
              style={[
                styles.specialtyButton,
                selectedSpecialty === specialty && styles.selectedSpecialty
              ]}
              onPress={() => setSelectedSpecialty(specialty)}
            >
              <Text style={[
                styles.specialtyButtonText,
                selectedSpecialty === specialty && styles.selectedSpecialtyText
              ]}>
                {specialty}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Doctors List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading doctors...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDoctors}
          renderItem={renderDoctorCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.doctorsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Availability Modal */}
      <Modal
        visible={showAvailability}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAvailability(false)}>
              <MaterialIcons name="close" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Book Appointment</Text>
            <View style={styles.placeholder} />
          </View>

          {selectedDoctor && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.doctorSummary}>
                <Text style={styles.modalDoctorName}>{selectedDoctor.name}</Text>
                <Text style={styles.modalDoctorSpecialty}>{selectedDoctor.specialty}</Text>
                <Text style={styles.modalDoctorFee}>${selectedDoctor.consultationFee} consultation fee</Text>
              </View>

              {/* Available Slots */}
              <View style={styles.slotsSection}>
                <Text style={styles.sectionTitle}>Available Times</Text>
                <FlatList
                  data={availabilitySlots}
                  renderItem={renderAvailabilitySlot}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>

              {/* Booking Details */}
              {selectedSlot && (
                <View style={styles.bookingForm}>
                  <Text style={styles.sectionTitle}>Booking Details</Text>
                  
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Consultation Type</Text>
                    <View style={styles.radioGroup}>
                      <TouchableOpacity
                        style={[
                          styles.radioOption,
                          consultationType === 'in-person' && styles.selectedRadio
                        ]}
                        onPress={() => setConsultationType('in-person')}
                      >
                        <Text style={styles.radioText}>In-Person</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.radioOption,
                          consultationType === 'telehealth' && styles.selectedRadio
                        ]}
                        onPress={() => setConsultationType('telehealth')}
                      >
                        <Text style={styles.radioText}>Telehealth</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Urgency</Text>
                    <View style={styles.radioGroup}>
                      {(['routine', 'urgent'] as const).map(level => (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.radioOption,
                            urgency === level && styles.selectedRadio
                          ]}
                          onPress={() => setUrgency(level)}
                        >
                          <Text style={styles.radioText}>
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Reason for Visit *</Text>
                    <TextInput
                      style={styles.textArea}
                      placeholder="Please describe the reason for your visit..."
                      value={bookingReason}
                      onChangeText={setBookingReason}
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Symptoms (optional)</Text>
                    <TextInput
                      style={styles.textArea}
                      placeholder="List your symptoms, separated by commas..."
                      value={symptoms}
                      onChangeText={setSymptoms}
                      multiline
                      numberOfLines={2}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.bookButton,
                      (!bookingReason.trim() || loading) && styles.disabledButton
                    ]}
                    onPress={handleBookAppointment}
                    disabled={!bookingReason.trim() || loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.bookButtonText}>Confirm Booking</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  backButton: {
    marginRight: 15
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text
  },
  emergencyWarning: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.error
  },
  emergencyWarningText: {
    flex: 1,
    fontSize: 13,
    color: colors.error,
    marginLeft: 8,
    fontWeight: '500'
  },
  emergencyButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  },
  searchContainer: {
    backgroundColor: colors.surface,
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 10,
    fontSize: 16,
    color: colors.text
  },
  specialtyFilter: {
    flexDirection: 'row'
  },
  specialtyButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginRight: 10
  },
  selectedSpecialty: {
    backgroundColor: colors.primary
  },
  specialtyButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500'
  },
  selectedSpecialtyText: {
    color: '#FFFFFF'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    color: colors.textSecondary,
    fontSize: 16
  },
  doctorsList: {
    padding: 15
  },
  doctorCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  doctorInfo: {
    flex: 1
  },
  doctorName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2
  },
  doctorSpecialty: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 2
  },
  doctorHospital: {
    fontSize: 14,
    color: colors.textSecondary
  },
  doctorMeta: {
    alignItems: 'flex-end'
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text
  },
  experience: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2
  },
  fee: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28A745'
  },
  doctorDetails: {
    marginBottom: 10
  },
  location: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4
  },
  qualifications: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2
  },
  languages: {
    fontSize: 13,
    color: colors.textSecondary
  },
  availabilityPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0'
  },
  availabilityText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text
  },
  placeholder: {
    width: 24
  },
  modalContent: {
    flex: 1,
    padding: 15
  },
  doctorSummary: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15
  },
  modalDoctorName: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4
  },
  modalDoctorSpecialty: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 4
  },
  modalDoctorFee: {
    fontSize: 14,
    color: '#28A745',
    fontWeight: '500'
  },
  slotsSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10
  },
  slotCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  selectedSlot: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF'
  },
  slotDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2
  },
  slotTime: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 2
  },
  slotType: {
    fontSize: 12,
    color: colors.textSecondary
  },
  bookingForm: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15
  },
  formGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  radioOption: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8
  },
  selectedRadio: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF'
  },
  radioText: {
    fontSize: 14,
    color: colors.text
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top'
  },
  bookButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10
  },
  disabledButton: {
    backgroundColor: '#CCC'
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default BookDoctorScreen;