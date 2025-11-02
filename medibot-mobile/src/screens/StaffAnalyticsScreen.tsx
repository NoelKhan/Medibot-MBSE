/**
 * STAFF ANALYTICS SCREEN
 * =======================
 * Performance metrics, cases handled, response times, patient outcomes
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import ErrorBoundary from '../components/ErrorBoundary';
import { trackScreen } from '../services/Analytics';

type Props = NativeStackScreenProps<RootStackParamList, 'StaffAnalytics'>;

const StaffAnalyticsScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const responsive = useResponsive();
  const styles = createStyles(colors, isDark, responsive);

  // If you have a UserAuthService, import it. Otherwise, comment out or replace with your own logic.
  // const userAuthService = UserAuthService.getInstance();

  const [stats, setStats] = useState({
    totalCases: 0,
    resolvedCases: 0,
    pendingCases: 0,
    avgResponseTime: 0,
    totalPatients: 0,
  });
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
    trackScreen('StaffAnalyticsScreen');
    // Uncomment and use if you have userAuthService
    // loadAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      // handle error
    }
    setLoading(false);
  };

  // Uncomment and use if you have userAuthService
  // const loadAnalytics = () => {
  //   const allCases = userAuthService.getAllCases();
  //   const allPatients = userAuthService.getAllUsers();
  //   setStats({
  //     totalCases: allCases.length,
  //     resolvedCases: allCases.filter((c) => c.status === 'resolved').length,
  //     pendingCases: allCases.filter((c) => c.status === 'open').length,
  //     avgResponseTime: 24, // Mock average in hours
  //     totalPatients: allPatients.length,
  //   });
  // };

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Performance Analytics</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Overview Stats */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="medical-services" size={32} color={colors.primary} />
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {stats.totalCases}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Total Cases
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="check-circle" size={32} color={colors.success} />
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {stats.resolvedCases}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Resolved
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="pending" size={32} color={colors.warning} />
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {stats.pendingCases}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Pending
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <MaterialIcons name="people" size={32} color={colors.primary} />
              <Text style={[styles.statNumber, { color: colors.text }]}>
                {stats.totalPatients}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Patients
              </Text>
            </View>
          </View>

          {/* Performance Metrics */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Performance Metrics
            </Text>
            
            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Avg. Response Time
              </Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {stats.avgResponseTime}h
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Resolution Rate
              </Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {stats.totalCases > 0
                  ? Math.round((stats.resolvedCases / stats.totalCases) * 100)
                  : 0}
                %
              </Text>
            </View>

            <View style={styles.metricRow}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                Cases This Month
              </Text>
              <Text style={[styles.metricValue, { color: colors.text }]}>
                {stats.totalCases}
              </Text>
            </View>
          </View>

          {/* Case Distribution */}
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Case Distribution
            </Text>
            
            <View style={styles.distributionBar}>
              <View
                style={[
                  styles.distributionSegment,
                  {
                    backgroundColor: colors.success,
                    flex: stats.resolvedCases,
                  },
                ]}
              />
              <View
                style={[
                  styles.distributionSegment,
                  {
                    backgroundColor: colors.warning,
                    flex: stats.pendingCases,
                  },
                ]}
              />
              <View
                style={[
                  styles.distributionSegment,
                  {
                    backgroundColor: colors.error,
                    flex: Math.max(
                      stats.totalCases - stats.resolvedCases - stats.pendingCases,
                      0
                    ),
                  },
                ]}
              />
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>
                  Resolved ({stats.resolvedCases})
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>
                  Pending ({stats.pendingCases})
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
                <Text style={[styles.legendText, { color: colors.text }]}>
                  In Progress (
                  {Math.max(
                    stats.totalCases - stats.resolvedCases - stats.pendingCases,
                    0
                  )}
                  )
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const createStyles = (colors: any, isDark: boolean, responsive: any) => {
  const isTablet = responsive.isTablet;

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    headerTitle: {
      fontSize: isTablet ? 22 : 18,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      padding: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      minWidth: 150,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
    },
    statNumber: {
      fontSize: isTablet ? 32 : 28,
      fontWeight: '700',
      marginTop: 8,
    },
    statLabel: {
      fontSize: isTablet ? 14 : 12,
      marginTop: 4,
    },
    card: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '600',
      marginBottom: 16,
    },
    metricRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    metricLabel: {
      fontSize: isTablet ? 16 : 14,
    },
    metricValue: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '600',
    },
    distributionBar: {
      flexDirection: 'row',
      height: 20,
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 16,
    },
    distributionSegment: {
      minWidth: 10,
    },
    legend: {
      gap: 8,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendText: {
      fontSize: isTablet ? 14 : 12,
    },
  });
};

export default StaffAnalyticsScreen;
