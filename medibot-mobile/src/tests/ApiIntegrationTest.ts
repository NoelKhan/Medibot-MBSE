/**
 * API Integration Test
 * ====================
 * Test script to verify backend API connectivity
 * 
 * Usage:
 * 1. Start backend: cd medibot-backend && npm run start:dev
 * 2. Run this test from the app to verify connection
 */

import { apiClient } from '../services/ApiClient';
import { authApiService } from '../services/AuthApiService';
import { usersApiService } from '../services/UsersApiService';
import { bookingsApiService } from '../services/BookingsApiService';
import { casesApiService } from '../services/CasesApiService';
import { emergencyApiService } from '../services/EmergencyApiService';

export class ApiIntegrationTest {
  
  /**
   * Test 1: Check if backend is online
   */
  static async testConnection(): Promise<boolean> {
    console.log('🔍 Testing backend connection...');
    try {
      const isOnline = await apiClient.isOnline();
      console.log(isOnline ? '✅ Backend is online' : '❌ Backend is offline');
      return isOnline;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  /**
   * Test 2: Register and login flow
   */
  static async testAuth(): Promise<any> {
    console.log('\n🔐 Testing authentication...');
    
    try {
      // Generate unique email
      const timestamp = Date.now();
      const testEmail = `test${timestamp}@medibot.com`;
      const testPassword = 'Test123!';
      
      // Register
      console.log('📝 Registering user...');
      const registerResult = await authApiService.register({
        email: testEmail,
        password: testPassword,
        fullName: 'Test User',
        phoneNumber: '+1234567890',
      });
      console.log('✅ User registered:', registerResult.user.id);
      
      // Logout
      await authApiService.logout();
      console.log('✅ Logged out');
      
      // Login
      console.log('🔑 Logging in...');
      const loginResult = await authApiService.login(testEmail, testPassword);
      console.log('✅ User logged in:', loginResult.user.id);
      
      // Get current user
      console.log('👤 Getting current user...');
      const currentUser = await authApiService.getCurrentUser();
      console.log('✅ Current user:', currentUser.id);
      
      return loginResult.user;
    } catch (error: any) {
      console.error('❌ Auth test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 3: User profile operations
   */
  static async testUsers(userId: string): Promise<void> {
    console.log('\n👤 Testing user operations...');
    
    try {
      // Get user
      console.log('📋 Getting user...');
      const user = await usersApiService.getUser(userId);
      console.log('✅ User retrieved:', user.id);
      
      // Update profile
      console.log('✏️ Updating profile...');
      await usersApiService.updateProfile(userId, {
        bloodType: 'O+',
        height: 175,
        weight: 70,
      });
      console.log('✅ Profile updated');
      
      // Add medical history
      console.log('🏥 Adding medical history...');
      await usersApiService.addMedicalHistory(userId, {
        condition: 'Test Condition',
        diagnosedDate: new Date().toISOString().split('T')[0],
        status: 'active',
        notes: 'Test notes',
      });
      console.log('✅ Medical history added');
      
      // Add medication
      console.log('💊 Adding medication...');
      await usersApiService.addMedication(userId, {
        name: 'Test Medication',
        dosage: '10mg',
        frequency: 'Once daily',
        startDate: new Date().toISOString().split('T')[0],
      });
      console.log('✅ Medication added');
      
      // Add allergy
      console.log('🤧 Adding allergy...');
      await usersApiService.addAllergy(userId, {
        allergen: 'Test Allergen',
        reaction: 'Test reaction',
        severity: 'mild',
      });
      console.log('✅ Allergy added');
      
      console.log('✅ User operations test passed');
    } catch (error: any) {
      console.error('❌ User operations test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 4: Medical case operations
   */
  static async testCases(userId: string): Promise<string> {
    console.log('\n🏥 Testing medical case operations...');
    
    try {
      // Create case
      console.log('📝 Creating medical case...');
      const medicalCase = await casesApiService.createCase({
        patientId: userId,
        chiefComplaint: 'Test complaint',
        symptoms: ['symptom1', 'symptom2'],
        severity: 3,
      });
      console.log('✅ Case created:', medicalCase.id);
      
      // Add note
      console.log('📄 Adding case note...');
      await casesApiService.addNote(medicalCase.id, {
        content: 'Test note',
        noteType: 'clinical',
        isVisibleToPatient: true,
      });
      console.log('✅ Note added');
      
      // Create triage
      console.log('🩺 Creating triage...');
      await casesApiService.createTriage(medicalCase.id, {
        esiLevel: 3,
        vitalSigns: {
          bloodPressure: '120/80',
          heartRate: 75,
          temperature: 37.0,
        },
        assessmentNotes: 'Test assessment',
      });
      console.log('✅ Triage created');
      
      console.log('✅ Case operations test passed');
      return medicalCase.id;
    } catch (error: any) {
      console.error('❌ Case operations test failed:', error.message);
      throw error;
    }
  }

  /**
   * Test 5: Emergency operations
   */
  static async testEmergency(userId: string): Promise<void> {
    console.log('\n🚨 Testing emergency operations...');
    
    try {
      // Create emergency
      console.log('📞 Creating emergency...');
      const emergency = await emergencyApiService.createEmergency({
        userId: userId,
        emergencyType: 'medical',
        severity: 4,
        description: 'Test emergency',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          address: 'Test Address',
        },
      });
      console.log('✅ Emergency created:', emergency.id);
      
      // Update emergency
      console.log('✏️ Updating emergency...');
      await emergencyApiService.updateEmergency(emergency.id, {
        status: 'assigned',
        notes: 'Test update',
      });
      console.log('✅ Emergency updated');
      
      console.log('✅ Emergency operations test passed');
    } catch (error: any) {
      console.error('❌ Emergency operations test failed:', error.message);
      throw error;
    }
  }

  /**
   * Run all tests
   */
  static async runAll(): Promise<void> {
    console.log('🚀 Starting API Integration Tests\n');
    console.log('Make sure backend is running: npm run start:dev\n');
    
    try {
      // Test 1: Connection
      const isOnline = await this.testConnection();
      if (!isOnline) {
        throw new Error('Backend is not reachable');
      }

      // Test 2: Authentication
      const user = await this.testAuth();

      // Test 3: User operations
      await this.testUsers(user.id);

      // Test 4: Medical cases
      await this.testCases(user.id);

      // Test 5: Emergency
      await this.testEmergency(user.id);

      console.log('\n✅ All tests passed! API integration working correctly 🎉');
    } catch (error: any) {
      console.error('\n❌ Test suite failed:', error.message);
      console.error('Full error:', error);
    }
  }
}

// Example usage:
// import { ApiIntegrationTest } from './ApiIntegrationTest';
// ApiIntegrationTest.runAll();
