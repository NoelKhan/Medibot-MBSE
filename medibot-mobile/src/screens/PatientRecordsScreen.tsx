/**
 * PATIENT RECORDS SCREEN
 * ======================
 * Comprehensive patient records management for medical staff
 * 
 * Features:
 * - View all patients (registered + guests)
 * - Search by name, email, phone
 * - Filter by patient type, case count
 * - Sort by name, recent activity, case count
 * - Quick access to patient consultation
 * - View patient statistics
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { PatientUser, MedicalCase } from '../types/Booking';
import { UserAuthService } from '../services/UserAuthService'; // TODO: Migrate to new MedicalService when available
import ErrorBoundary from '../components/ErrorBoundary';
import EmptyState from '../components/EmptyState';
import { Analytics, trackScreen } from '../services/Analytics';
import { createLogger } from '../services/Logger';

const logger = createLogger('PatientRecordsScreen');

type Props = NativeStackScreenProps<RootStackParamList, 'PatientRecords'>;

type SortOption = 'name' | 'recent' | 'cases';
type FilterOption = 'all' | 'registered' | 'guest';

const PatientRecordsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const responsive = useResponsive();
  const styles = createStyles(colors, isDark, responsive);

  const userAuthService = UserAuthService.getInstance();

  const [patients, setPatients] = useState<PatientUser[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    trackScreen('PatientRecordsScreen');
    loadPatients();
  }, []);

  useEffect(() => {
    filterAndSortPatients();
  }, [patients, searchQuery, sortBy, filterBy]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const allPatients = userAuthService.getAllUsers();
      setPatients(allPatients);
      logger.info('Patients loaded', { count: allPatients.length });
    } catch (error) {
      logger.error('Error loading patients', error);
      Alert.alert('Error', 'Failed to load patient records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAndSortPatients = () => {
    let filtered = [...patients];

    // Apply filter
    if (filterBy === 'registered') {
      filtered = filtered.filter((p) => p.userType === 'registered');
    } else if (filterBy === 'guest') {
      filtered = filtered.filter((p) => p.userType === 'guest');
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.email?.toLowerCase().includes(query) ||
          p.phone?.toLowerCase().includes(query)
      );
    }

    // Apply sort
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'recent') {
      filtered.sort((a, b) => {
        const aTime = a.lastActivity?.getTime() || 0;
        const bTime = b.lastActivity?.getTime() || 0;
        return bTime - aTime;
      });
    } else if (sortBy === 'cases') {
      filtered.sort((a, b) => (b.totalCases || 0) - (a.totalCases || 0));
    }

    setFilteredPatients(filtered);
  };

  const handlePatientPress = (patient: PatientUser) => {
    // Get the most recent active case for this patient
    const activeCases = patient.activeCases || [];
    if (activeCases.length > 0) {
      const mostRecentCase = activeCases[0];
      navigation.navigate('PatientConsultation', {
        caseId: mostRecentCase,
        patientId: patient.id,
      });
    } else if (patient.caseHistory && patient.caseHistory.length > 0) {
      const mostRecentCase = patient.caseHistory[0];
      navigation.navigate('PatientConsultation', {
        caseId: mostRecentCase,
        patientId: patient.id,
      });
    } else {
      Alert.alert('No Cases', 'This patient has no medical cases yet.');
    }
  };

  const renderPatientCard = ({ item }: { item: PatientUser }) => {
    const isGuest = item.userType === 'guest';
    const activeCases = (item.activeCases || []).length;
    const totalCases = item.totalCases || 0;

    return (
      <TouchableOpacity
        style={[styles.patientCard, { backgroundColor: colors.card }]}
        onPress={() => handlePatientPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.patientHeader}>
          <View style={styles.patientAvatar}>
            <MaterialIcons
              name={isGuest ? 'person-outline' : 'person'}
              size={32}
              color={isGuest ? colors.textSecondary : colors.primary}
            />
          </View>
          <View style={styles.patientInfo}>
            <Text style={[styles.patientName, { color: colors.text }]}>
              {item.name}
            </Text>
            {item.email && (
              <Text style={[styles.patientContact, { color: colors.textSecondary }]}>
                {item.email}
              </Text>
            )}
            {item.phone && (
              <Text style={[styles.patientContact, { color: colors.textSecondary }]}>
                {item.phone}
              </Text>
            )}
          </View>
          <View style={styles.patientBadge}>
            {isGuest ? (
              <View style={[styles.badge, { backgroundColor: colors.warning + '20' }]}>
                <Text style={[styles.badgeText, { color: colors.warning }]}>Guest</Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: colors.success + '20' }]}>
                <Text style={[styles.badgeText, { color: colors.success }]}>Registered</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.patientStats}>
          <View style={styles.stat}>
            <MaterialIcons name="medical-services" size={16} color={colors.primary} />
            <Text style={[styles.statText, { color: colors.text }]}>
              {activeCases} Active
            </Text>
          </View>
          <View style={styles.stat}>
            <MaterialIcons name="history" size={16} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.text }]}>
              {totalCases} Total
            </Text>
          </View>
          {item.lastActivity && (
            <View style={styles.stat}>
              <MaterialIcons name="access-time" size={16} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {formatDate(item.lastActivity)}
              </Text>
            </View>
          )}
        </View>

        {/* Allergies Warning */}
        {item.allergies && item.allergies.length > 0 && (
          <View style={[styles.allergyWarning, { backgroundColor: colors.error + '15' }]}>
            <MaterialIcons name="warning" size={16} color={colors.error} />
            <Text style={[styles.allergyText, { color: colors.error }]}>
              {item.allergies.length} Known Allerg{item.allergies.length === 1 ? 'y' : 'ies'}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <MaterialIcons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search patients by name, email, or phone..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters and Sort */}
      <View style={styles.controlsContainer}>
        <View style={styles.filterContainer}>
          <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Filter:</Text>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterBy === 'all' && { backgroundColor: colors.primary },
              { borderColor: colors.primary },
            ]}
            onPress={() => setFilterBy('all')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: filterBy === 'all' ? '#FFFFFF' : colors.text },
              ]}
            >
              All ({patients.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterBy === 'registered' && { backgroundColor: colors.primary },
              { borderColor: colors.primary },
            ]}
            onPress={() => setFilterBy('registered')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: filterBy === 'registered' ? '#FFFFFF' : colors.text },
              ]}
            >
              Registered ({patients.filter((p) => p.userType === 'registered').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterButton,
              filterBy === 'guest' && { backgroundColor: colors.primary },
              { borderColor: colors.primary },
            ]}
            onPress={() => setFilterBy('guest')}
          >
            <Text
              style={[
                styles.filterButtonText,
                { color: filterBy === 'guest' ? '#FFFFFF' : colors.text },
              ]}
            >
              Guests ({patients.filter((p) => p.userType === 'guest').length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sortContainer}>
          <Text style={[styles.controlLabel, { color: colors.textSecondary }]}>Sort:</Text>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === 'recent' && { backgroundColor: colors.primary },
              { borderColor: colors.primary },
            ]}
            onPress={() => setSortBy('recent')}
          >
            <MaterialIcons
              name="access-time"
              size={16}
              color={sortBy === 'recent' ? '#FFFFFF' : colors.text}
            />
            <Text
              style={[
                styles.sortButtonText,
                { color: sortBy === 'recent' ? '#FFFFFF' : colors.text },
              ]}
            >
              Recent
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === 'name' && { backgroundColor: colors.primary },
              { borderColor: colors.primary },
            ]}
            onPress={() => setSortBy('name')}
          >
            <MaterialIcons
              name="sort-by-alpha"
              size={16}
              color={sortBy === 'name' ? '#FFFFFF' : colors.text}
            />
            <Text
              style={[
                styles.sortButtonText,
                { color: sortBy === 'name' ? '#FFFFFF' : colors.text },
              ]}
            >
              Name
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sortButton,
              sortBy === 'cases' && { backgroundColor: colors.primary },
              { borderColor: colors.primary },
            ]}
            onPress={() => setSortBy('cases')}
          >
            <MaterialIcons
              name="medical-services"
              size={16}
              color={sortBy === 'cases' ? '#FFFFFF' : colors.text}
            />
            <Text
              style={[
                styles.sortButtonText,
                { color: sortBy === 'cases' ? '#FFFFFF' : colors.text },
              ]}
            >
              Cases
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
          Showing {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading patient records...
          </Text>
        </View>
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>Patient Records</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {patients.length} total patients
            </Text>
          </View>
          <TouchableOpacity onPress={loadPatients} style={styles.refreshButton}>
            <MaterialIcons name="refresh" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Patient List */}
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id}
          renderItem={renderPatientCard}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <EmptyState
              icon="people"
              title="No Patients Found"
              message={
                searchQuery
                  ? 'No patients match your search criteria'
                  : 'No patient records available'
              }
            />
          }
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadPatients();
          }}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

const createStyles = (colors: any, isDark: boolean, responsive: any) => {
  const isTablet = responsive.isTablet;

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      fontSize: isTablet ? 16 : 14,
      marginTop: 12,
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
    refreshButton: {
      marginLeft: 12,
    },
    listContent: {
      padding: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
    },
    searchInput: {
      flex: 1,
      fontSize: isTablet ? 16 : 14,
      marginLeft: 8,
      marginRight: 8,
    },
    controlsContainer: {
      marginBottom: 16,
    },
    filterContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      marginBottom: 12,
      gap: 8,
    },
    sortContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    controlLabel: {
      fontSize: isTablet ? 14 : 12,
      fontWeight: '600',
      marginRight: 8,
    },
    filterButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
    },
    filterButtonText: {
      fontSize: isTablet ? 14 : 12,
      fontWeight: '500',
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      gap: 4,
    },
    sortButtonText: {
      fontSize: isTablet ? 14 : 12,
      fontWeight: '500',
    },
    resultsContainer: {
      marginBottom: 12,
    },
    resultsText: {
      fontSize: isTablet ? 14 : 12,
    },
    patientCard: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
    },
    patientHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    patientAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    patientInfo: {
      flex: 1,
    },
    patientName: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    patientContact: {
      fontSize: isTablet ? 14 : 12,
      marginBottom: 2,
    },
    patientBadge: {
      marginLeft: 8,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: isTablet ? 12 : 10,
      fontWeight: '600',
    },
    patientStats: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 8,
    },
    stat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: isTablet ? 14 : 12,
    },
    allergyWarning: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      borderRadius: 8,
      gap: 6,
      marginTop: 8,
    },
    allergyText: {
      fontSize: isTablet ? 13 : 11,
      fontWeight: '600',
    },
  });
};

export default PatientRecordsScreen;
