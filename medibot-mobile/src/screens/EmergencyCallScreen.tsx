import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Animated,
  Linking,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import EmergencyService from '../services/EmergencyService';
import { EmergencyCase } from '../types/Booking';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import ErrorBoundary from '../components/ErrorBoundary';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import { createLogger } from '../services/Logger';

const logger = createLogger('EmergencyCallScreen');

interface EmergencyCallScreenProps {
  navigation: any;
}

const EmergencyCallScreen: React.FC<EmergencyCallScreenProps> = ({ navigation }) => {
  const { theme, colors } = useTheme();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const styles = createStyles(colors, responsive);
  
  const [step, setStep] = useState<'initial' | 'countdown' | 'calling' | 'cancelled'>('initial');
  const [countdown, setCountdown] = useState(60); // 1 minute timer
  const [emergencyCase, setEmergencyCase] = useState<EmergencyCase | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [emergencyType, setEmergencyType] = useState<string>('medical');
  const [severity, setSeverity] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [loading, setLoading] = useState(false);

  const emergencyService = EmergencyService.getInstance();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    trackScreen('EmergencyCallScreen', {
      currentStep: step,
      emergencyType,
      severity
    });
    
    // Get location permission and current location
    getCurrentLocation();
    
    // Start pulse animation for emergency button
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true
        })
      ])
    );
    pulse.start();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      pulse.stop();
    };
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    } catch (error) {
      logger.error('Error getting location', error);
    }
  };

  const startEmergencyCountdown = () => {
    if (!symptoms.trim()) {
      Alert.alert('Information Required', 'Please describe the emergency situation before proceeding.');
      return;
    }

    setStep('countdown');
    setCountdown(60);

    // Create emergency timer
    timerRef.current = emergencyService.createEmergencyTimer(
      (secondsLeft) => {
        setCountdown(secondsLeft);
      },
      () => {
        // Timer completed - make the call
        makeEmergencyCall();
      },
      60
    );
  };

  const cancelEmergencyCall = async () => {
    if (timerRef.current) {
      emergencyService.cancelTimer(timerRef.current);
      timerRef.current = null;
    }

    if (emergencyCase) {
      try {
        await emergencyService.cancelEmergencyCall(
          emergencyCase.id, 
          'Cancelled by user during countdown'
        );
      } catch (error) {
        logger.error('Error cancelling emergency case', error);
      }
    }

    setStep('cancelled');
    
    Alert.alert(
      'Emergency Call Cancelled',
      'The emergency call has been cancelled. If you need assistance, you can start again or contact emergency services directly.',
      [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]
    );
  };

  const callEmergencyImmediately = async () => {
    const emergencyNumber = Platform.select({
      ios: 'tel:000',
      android: 'tel:000',
      default: 'tel:000'
    });

    try {
      // Mobile: attempt to dial directly
      const supported = await Linking.canOpenURL(emergencyNumber);
      if (supported) {
        await Linking.openURL(emergencyNumber);
      } else {
        Alert.alert(
          'Cannot Make Call',
          'Your device cannot make phone calls. Please dial 000 manually.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      logger.error('Error making emergency call', error);
      Alert.alert(
        'Call Failed',
        'Unable to initiate call. Please dial 000 manually.',
        [{ text: 'OK' }]
      );
    }
  };

  const makeEmergencyCall = async () => {
    setStep('calling');
    setLoading(true);

    try {
      // Create emergency case
      const emergencyCaseData: Partial<EmergencyCase> = {
        emergencyType,
        symptoms: symptoms.split(',').map(s => s.trim()).filter(s => s.length > 0),
        severity,
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: 'Current GPS Location'
        } : undefined,
        emergencyContacts: [], // Would be populated from user profile
        notes: `Emergency initiated from MediBot app. Symptoms: ${symptoms}`
      };

      const result = await emergencyService.initiateEmergencyCall(emergencyCaseData);
      
      // Also make the actual phone call
      await callEmergencyImmediately();
      
      // Log emergency call details
      logger.info('Emergency call initiated', {
        caseId: result.caseId,
        mockNumber: '123456789',
        hasLocation: !!location,
        locationCoords: location ? `${location.coords.latitude}, ${location.coords.longitude}` : 'Not available',
        symptoms
      });

      Alert.alert(
        'Emergency Services Contacted',
        `Emergency call initiated successfully.\n\nCase ID: ${result.caseId}\n\nMock Number Dialed: 123456789\n(In real implementation, this would be 000)\n\n${result.estimatedResponse}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('Chat')
          }
        ]
      );

    } catch (error) {
      Alert.alert(
        'Emergency Call Failed',
        'Unable to connect to emergency services. Please dial 000 directly for immediate assistance.',
        [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderInitialScreen = () => (
    <ScrollView contentContainerStyle={styles.initialContainer}>
      <View style={styles.warningBanner}>
        <MaterialIcons name="warning" size={24} color="#FF3B30" />
        <Text style={styles.warningText}>
          This is for medical emergencies requiring immediate assistance
        </Text>
      </View>

      <Text style={styles.title}>Emergency Medical Assistance</Text>
      <Text style={styles.subtitle}>
        If you're experiencing a life-threatening emergency, this will connect you to emergency services in Australia.
      </Text>

      <View style={styles.formContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Emergency Type</Text>
          <View style={styles.typeButtons}>
            {[
              { key: 'medical', label: 'Medical', icon: 'local-hospital' },
              { key: 'cardiac', label: 'Heart/Chest', icon: 'favorite' },
              { key: 'breathing', label: 'Breathing', icon: 'air' },
              { key: 'trauma', label: 'Injury/Trauma', icon: 'healing' }
            ].map(type => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeButton,
                  emergencyType === type.key && styles.selectedType
                ]}
                onPress={() => setEmergencyType(type.key)}
              >
                <MaterialIcons name={type.icon as any} size={24} color={emergencyType === type.key ? '#FFFFFF' : '#007AFF'} />
                <Text style={[
                  styles.typeButtonText,
                  emergencyType === type.key && styles.selectedTypeText
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Severity Level</Text>
          <View style={styles.severitySlider}>
            {[1, 2, 3, 4, 5].map(level => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.severityButton,
                  severity === level && styles.selectedSeverity,
                  level >= 4 && styles.criticalSeverity
                ]}
                onPress={() => setSeverity(level as 1 | 2 | 3 | 4 | 5)}
              >
                <Text style={[
                  styles.severityText,
                  severity === level && styles.selectedSeverityText
                ]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.severityLabel}>
            1 = Mild | 3 = Serious | 5 = Life-threatening
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Describe the Emergency *</Text>
          <TextInput
            style={styles.symptomInput}
            placeholder="Please describe symptoms, injury, or medical emergency..."
            value={symptoms}
            onChangeText={setSymptoms}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.locationInfo}>
          <MaterialIcons name="location-on" size={20} color="#007AFF" />
          <Text style={styles.locationText}>
            {location 
              ? `Location services enabled - Emergency services will receive your GPS coordinates`
              : 'Location not available - Please provide address to emergency operator'
            }
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.immediateCallButton}
          onPress={() => {
            Alert.alert(
              'IMMEDIATE EMERGENCY CALL',
              'This will call emergency services (000) immediately. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'CALL NOW', 
                  style: 'destructive',
                  onPress: callEmergencyImmediately
                }
              ]
            );
          }}
        >
          <MaterialIcons name="emergency" size={28} color="#FFFFFF" />
          <Text style={styles.immediateCallText}>CALL NOW</Text>
          <Text style={styles.immediateCallSubtext}>No countdown</Text>
        </TouchableOpacity>

        <Animated.View style={[styles.emergencyButtonContainer, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={styles.emergencyButton}
            onPress={startEmergencyCountdown}
            disabled={!symptoms.trim()}
          >
            <MaterialIcons name="phone" size={32} color="#FFFFFF" />
            <Text style={styles.emergencyButtonText}>START EMERGENCY CALL</Text>
            <Text style={styles.emergencyButtonSubtext}>
              1-minute countdown before dialing
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderCountdownScreen = () => (
    <View style={styles.countdownContainer}>
      <View style={styles.countdownContent}>
        <MaterialIcons name="timer" size={80} color="#FF3B30" />
        <Text style={styles.countdownTitle}>Emergency Call Starting</Text>
        
        <View style={styles.timerDisplay}>
          <Text style={styles.timerText}>{formatTime(countdown)}</Text>
          <Text style={styles.timerLabel}>Time remaining to cancel</Text>
        </View>

        <View style={styles.emergencyInfo}>
          <Text style={styles.infoTitle}>Emergency Details:</Text>
          <Text style={styles.infoText}>Type: {emergencyType}</Text>
          <Text style={styles.infoText}>Severity: {severity}/5</Text>
          <Text style={styles.infoText}>Symptoms: {symptoms}</Text>
          {location && (
            <Text style={styles.infoText}>
              Location: GPS coordinates will be shared
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.emergencyCancelButton}
          onPress={cancelEmergencyCall}
        >
          <MaterialIcons name="cancel" size={24} color="#FFFFFF" />
          <Text style={styles.cancelButtonText}>CANCEL EMERGENCY CALL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCallingScreen = () => (
    <View style={styles.callingContainer}>
      <ActivityIndicator size="large" color="#FF3B30" />
      <Text style={styles.callingTitle}>Connecting to Emergency Services...</Text>
      <Text style={styles.callingSubtext}>
        Dialing mock number: 123456789
        {'\n'}(In real implementation: 000)
      </Text>
      
      <View style={styles.callingInfo}>
        <MaterialIcons name="info" size={20} color="#007AFF" />
        <Text style={styles.callingInfoText}>
          Your location and emergency details are being transmitted to emergency services.
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Single Red Banner Header with safe area padding */}
      <View style={[styles.bannerHeader, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (step === 'countdown' || step === 'calling') {
              Alert.alert(
                'Cancel Emergency Call',
                'Are you sure you want to cancel the emergency call?',
                [
                  { text: 'No', style: 'cancel' },
                  { text: 'Yes', onPress: cancelEmergencyCall }
                ]
              );
            } else {
              navigation.goBack();
            }
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Emergency Call</Text>
          <Text style={styles.headerSubtitle}>Immediate emergency assistance</Text>
        </View>
        <View style={styles.emergencyIndicator}>
          <MaterialIcons name="emergency" size={24} color="#FFFFFF" />
        </View>
      </View>

      {step === 'initial' && renderInitialScreen()}
      {step === 'countdown' && renderCountdownScreen()}
      {step === 'calling' && renderCallingScreen()}
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
    backgroundColor: colors.background
  },
  bannerHeader: {
    backgroundColor: '#FF4444', // Red for emergency
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
  emergencyIndicator: {
    padding: 4,
    marginTop: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: contentPadding,
    paddingVertical: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerBackButton: {
    padding: 5
  },
  initialContainer: {
    padding: 20,
    flexGrow: 1
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2F2',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30'
  },
  warningText: {
    marginLeft: 10,
    color: '#FF3B30',
    fontWeight: '600',
    flex: 1
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22
  },
  formContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30
  },
  formGroup: {
    marginBottom: 25
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 15,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
    backgroundColor: '#F8F9FF'
  },
  selectedType: {
    backgroundColor: '#007AFF'
  },
  typeButtonText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    textAlign: 'center'
  },
  selectedTypeText: {
    color: '#FFFFFF'
  },
  severitySlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  severityButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background
  },
  selectedSeverity: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF'
  },
  criticalSeverity: {
    borderColor: '#FF3B30'
  },
  severityText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textSecondary
  },
  selectedSeverityText: {
    color: '#FFFFFF'
  },
  severityLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic'
  },
  symptomInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 100
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '15',
    padding: 15,
    borderRadius: 8,
    marginTop: 10
  },
  locationText: {
    marginLeft: 10,
    fontSize: 14,
    color: colors.primary,
    flex: 1,
    lineHeight: 20
  },
  emergencyButtonContainer: {
    marginBottom: 20
  },
  emergencyButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10
  },
  emergencyButtonSubtext: {
    color: '#FFE5E5',
    fontSize: 14,
    marginTop: 5
  },
  cancelButton: {
    alignItems: 'center',
    padding: 15
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500'
  },
  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  countdownContent: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 350
  },
  countdownTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'center'
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 30
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#FF3B30',
    fontFamily: 'monospace'
  },
  timerLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 10
  },
  emergencyInfo: {
    backgroundColor: colors.background,
    padding: 15,
    borderRadius: 8,
    width: '100%',
    marginBottom: 30
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5
  },
  emergencyCancelButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10
  },
  callingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  callingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    textAlign: 'center'
  },
  callingSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22
  },
  callingInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '15',
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    maxWidth: 300
  },
  callingInfoText: {
    marginLeft: 10,
    fontSize: 14,
    color: colors.primary,
    flex: 1,
    lineHeight: 20
  },
  
  // New button container and immediate call styles
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 15,
  },
  immediateCallButton: {
    backgroundColor: '#FF0000',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  immediateCallText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 10,
    letterSpacing: 1,
  },
  immediateCallSubtext: {
    color: '#FFE4E1',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 15,
  },
});
};

const EmergencyCallScreenWithErrorBoundary: React.FC<EmergencyCallScreenProps> = (props) => (
  <ErrorBoundary>
    <EmergencyCallScreen {...props} />
  </ErrorBoundary>
);

export default EmergencyCallScreenWithErrorBoundary;