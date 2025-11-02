/**
 * Emergency Call Functionality Test
 * Tests the core emergency call workflow to ensure it's working
 */

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import EmergencyService from '../services/EmergencyService';
import NotificationService from '../services/NotificationService';

export const EmergencyCallTest: React.FC = () => {
  const testEmergencyCall = async () => {
    try {
      console.log('🧪 Testing Emergency Call Functionality...');
      
      // Test 1: Initialize services
      const emergencyService = EmergencyService.getInstance();
      const notificationService = NotificationService.getInstance();
      
      await notificationService.initialize();
      console.log('✅ Services initialized successfully');
      
      // Test 2: Test emergency case creation
      const mockEmergencyCase = {
        userId: 'test-user-123',
        emergencyType: 'medical' as const,
        symptoms: ['chest pain', 'difficulty breathing'],
        severity: 5 as const,
        location: {
          latitude: -37.8136,
          longitude: 144.9631,
          address: 'Melbourne, Australia'
        },
        notes: 'Test emergency call from functionality test'
      };
      
      const result = await emergencyService.initiateEmergencyCall(mockEmergencyCase);
      console.log('✅ Emergency call initiated:', result.caseId);
      
      // Test 3: Test notification system
      await notificationService.sendEmergencyNotification(
        '🚨 Test Emergency Alert',
        'This is a test of the emergency notification system'
      );
      console.log('✅ Emergency notification sent successfully');
      
      // Test 4: Test emergency call progress notification
      await notificationService.showEmergencyCallProgress(10);
      console.log('✅ Emergency call progress notification sent');
      
      Alert.alert(
        '✅ Emergency Call Test Passed',
        `All emergency call functions are working correctly!\n\nCase ID: ${result.caseId}\nEstimated Response: ${result.estimatedResponse}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Emergency Call Test Failed:', error);
      Alert.alert(
        '❌ Emergency Call Test Failed',
        `Error: ${error instanceof Error ? error.message : String(error)}\n\nPlease check the console for more details.`,
        [{ text: 'OK' }]
      );
    }
  };

  const testNotificationSettings = async () => {
    try {
      const notificationService = NotificationService.getInstance();
      await notificationService.initialize();
      
      const settings = await notificationService.getSettings();
      console.log('🔧 Current Notification Settings:', settings);
      
      Alert.alert(
        'Notification Settings',
        `Emergency Notifications: ${settings.emergencyNotifications ? 'Enabled' : 'Disabled'}\nPush Notifications: ${settings.pushNotifications ? 'Enabled' : 'Disabled'}`,
        [{ text: 'OK' }]
      );
      
    } catch (error) {
      console.error('❌ Notification Settings Test Failed:', error);
    }
  };

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: 20,
      backgroundColor: '#f5f5f5'
    }}>
      <Text style={{ 
        fontSize: 24, 
        fontWeight: 'bold', 
        marginBottom: 20,
        textAlign: 'center',
        color: '#333'
      }}>
        🚨 Emergency Call Test
      </Text>
      
      <Text style={{
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22
      }}>
        Test the emergency call functionality to ensure all services are working correctly.
      </Text>
      
      <TouchableOpacity
        onPress={testEmergencyCall}
        style={{
          backgroundColor: '#dc3545',
          paddingVertical: 15,
          paddingHorizontal: 30,
          borderRadius: 10,
          marginBottom: 15,
          minWidth: 250,
          alignItems: 'center'
        }}
      >
        <Text style={{ 
          color: 'white', 
          fontSize: 18, 
          fontWeight: 'bold' 
        }}>
          🧪 Test Emergency Call
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={testNotificationSettings}
        style={{
          backgroundColor: '#007bff',
          paddingVertical: 15,
          paddingHorizontal: 30,
          borderRadius: 10,
          minWidth: 250,
          alignItems: 'center'
        }}
      >
        <Text style={{ 
          color: 'white', 
          fontSize: 18, 
          fontWeight: 'bold' 
        }}>
          🔧 Check Notification Settings
        </Text>
      </TouchableOpacity>
      
      <Text style={{
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 30,
        lineHeight: 20
      }}>
        This test will verify that:
        {'\n'}• Emergency services can be initialized
        {'\n'}• Emergency cases can be created
        {'\n'}• Notifications can be sent
        {'\n'}• All services are properly connected
      </Text>
    </View>
  );
};