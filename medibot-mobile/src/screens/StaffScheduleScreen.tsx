/**
 * STAFF SCHEDULE SCREEN
 * ======================
 * View appointments, consultations, and shift information
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

type Props = NativeStackScreenProps<RootStackParamList, 'StaffSchedule'>;

const StaffScheduleScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const responsive = useResponsive();
  const styles = createStyles(colors, isDark, responsive);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSchedules();
    trackScreen('StaffScheduleScreen');
  }, []);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/schedule');
      const data = await res.json();
      setSchedules(data);
    } catch (err) {
      // handle error
    }
    setLoading(false);
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={[styles.header, { backgroundColor: colors.card }]}> 
          <TouchableOpacity onPress={() => navigation.goBack()}> 
            <MaterialIcons name="arrow-back" size={24} color={colors.text} /> 
          </TouchableOpacity> 
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Schedule</Text> 
        </View> 

        <ScrollView style={styles.content}> 
          {/* Today's Shift */} 
          <View style={[styles.card, { backgroundColor: colors.card }]}> 
            <Text style={[styles.cardTitle, { color: colors.text }]}>Today's Shift</Text> 
            <View style={styles.shiftInfo}> 
              <MaterialIcons name="access-time" size={20} color={colors.primary} /> 
              <Text style={[styles.shiftText, { color: colors.text }]}> 
                8:00 AM - 4:00 PM 
              </Text> 
            </View> 
            <View style={styles.shiftInfo}> 
              <MaterialIcons name="location-on" size={20} color={colors.primary} /> 
              <Text style={[styles.shiftText, { color: colors.text }]}> 
                Emergency Department - Floor 2 
              </Text> 
            </View> 
          </View> 

          {/* Upcoming Consultations */} 
          <View style={[styles.card, { backgroundColor: colors.card }]}> 
            <Text style={[styles.cardTitle, { color: colors.text }]}> 
              Upcoming Consultations 
            </Text> 
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}> 
              No scheduled consultations 
            </Text> 
          </View> 

          {/* This Week */} 
          <View style={[styles.card, { backgroundColor: colors.card }]}> 
            <Text style={[styles.cardTitle, { color: colors.text }]}>This Week</Text> 
            <View style={styles.weekSchedule}> 
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => ( 
                <View 
                  key={day} 
                  style={[ 
                    styles.dayCard, 
                    { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }, 
                  ]} 
                > 
                  <Text style={[styles.dayText, { color: colors.text }]}>{day}</Text> 
                  <Text style={[styles.dayShift, { color: colors.textSecondary }]}> 
                    {index < 5 ? '8am-4pm' : 'Off'} 
                  </Text> 
                </View> 
              ))} 
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
    card: {
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    shiftInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    shiftText: {
      fontSize: isTablet ? 16 : 14,
    },
    placeholderText: {
      fontSize: isTablet ? 14 : 12,
      fontStyle: 'italic',
    },
    weekSchedule: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    dayCard: {
      flex: 1,
      minWidth: 80,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    dayText: {
      fontSize: isTablet ? 14 : 12,
      fontWeight: '600',
      marginBottom: 4,
    },
    dayShift: {
      fontSize: isTablet ? 12 : 10,
    },
  });
};

export default StaffScheduleScreen;
