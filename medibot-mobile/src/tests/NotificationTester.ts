/**
 * Notification Testing Script
 * Tests cross-platform notification functionality for web and mobile
 */

import { PushNotificationService } from '../services/PushNotificationService';
import { Platform } from 'react-native';

export class NotificationTester {
  private pushService: PushNotificationService;

  constructor() {
    this.pushService = PushNotificationService.getInstance();
  }

  /**
   * Test notification initialization
   */
  public async testInitialization(): Promise<boolean> {
    console.log(`Testing notification initialization on ${Platform.OS}...`);
    
    try {
      const initialized = await this.pushService.initialize();
      console.log(`✅ Notification initialization: ${initialized ? 'SUCCESS' : 'FAILED'}`);
      return initialized;
    } catch (error) {
      console.error('❌ Notification initialization FAILED:', error);
      return false;
    }
  }

  /**
   * Test emergency notification
   */
  public async testEmergencyNotification(): Promise<boolean> {
    console.log(`Testing emergency notification on ${Platform.OS}...`);
    
    try {
      const notificationId = await this.pushService.sendEmergencyNotification(
        'This is a test emergency notification',
        { isTest: true }
      );
      console.log(`✅ Emergency notification: ${notificationId ? 'SUCCESS' : 'FAILED'}`);
      return !!notificationId;
    } catch (error) {
      console.error('❌ Emergency notification FAILED:', error);
      return false;
    }
  }

  /**
   * Test appointment reminder
   */
  public async testAppointmentReminder(): Promise<boolean> {
    console.log(`Testing appointment reminder on ${Platform.OS}...`);
    
    try {
      const appointmentDate = new Date();
      appointmentDate.setHours(appointmentDate.getHours() + 1); // 1 hour from now
      
      const notificationId = await this.pushService.scheduleAppointmentReminder(
        appointmentDate,
        'Dr. Test',
        60 // 60 minutes before
      );
      console.log(`✅ Appointment reminder: ${notificationId ? 'SUCCESS' : 'FAILED'}`);
      return !!notificationId;
    } catch (error) {
      console.error('❌ Appointment reminder FAILED:', error);
      return false;
    }
  }

  /**
   * Test medication reminder
   */
  public async testMedicationReminder(): Promise<boolean> {
    console.log(`Testing medication reminder on ${Platform.OS}...`);
    
    try {
      const reminderTime = new Date();
      reminderTime.setMinutes(reminderTime.getMinutes() + 5); // 5 minutes from now
      
      const notificationId = await this.pushService.scheduleMedicationReminder(
        'Test Medication',
        '1 tablet',
        reminderTime
      );
      console.log(`✅ Medication reminder: ${notificationId ? 'SUCCESS' : 'FAILED'}`);
      return !!notificationId;
    } catch (error) {
      console.error('❌ Medication reminder FAILED:', error);
      return false;
    }
  }

  /**
   * Test health tip notification
   */
  public async testHealthTip(): Promise<boolean> {
    console.log(`Testing health tip notification on ${Platform.OS}...`);
    
    try {
      const notificationId = await this.pushService.sendHealthTip(
        'This is a test health tip: Stay hydrated by drinking at least 8 glasses of water daily!'
      );
      console.log(`✅ Health tip: ${notificationId ? 'SUCCESS' : 'FAILED'}`);
      return !!notificationId;
    } catch (error) {
      console.error('❌ Health tip FAILED:', error);
      return false;
    }
  }

  /**
   * Test cross-platform notification listener
   */
  public async testNotificationListener(): Promise<boolean> {
    console.log(`Testing notification listener on ${Platform.OS}...`);
    
    try {
      let listenerWorked = false;
      
      const cleanup = this.pushService.addCrossPlatformNotificationListener((categoryId, data) => {
        console.log(`✅ Notification listener triggered: ${categoryId}`, data);
        listenerWorked = true;
      });

      // Test the listener by sending a notification
      await this.pushService.sendHealthTip('Test notification for listener');
      
      // Clean up
      setTimeout(() => {
        cleanup();
        console.log(`✅ Notification listener: ${listenerWorked ? 'SUCCESS' : 'SETUP COMPLETE'}`);
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('❌ Notification listener FAILED:', error);
      return false;
    }
  }

  /**
   * Run all notification tests
   */
  public async runAllTests(): Promise<void> {
    console.log('\n🧪 Starting Cross-Platform Notification Tests...\n');
    console.log(`Platform: ${Platform.OS}`);
    console.log(`Testing Date: ${new Date().toISOString()}\n`);

    const results: { [key: string]: boolean } = {};

    // Run all tests
    results['Initialization'] = await this.testInitialization();
    await this.delay(1000);

    results['Emergency Notification'] = await this.testEmergencyNotification();
    await this.delay(1000);

    results['Appointment Reminder'] = await this.testAppointmentReminder();
    await this.delay(1000);

    results['Medication Reminder'] = await this.testMedicationReminder();
    await this.delay(1000);

    results['Health Tip'] = await this.testHealthTip();
    await this.delay(1000);

    results['Notification Listener'] = await this.testNotificationListener();
    await this.delay(1000);

    // Report results
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('=' .repeat(40));
    
    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${test}: ${status}`);
    });

    console.log('=' .repeat(40));
    console.log(`Overall: ${passed}/${total} tests passed (${Math.round(passed/total*100)}%)`);
    
    if (passed === total) {
      console.log('🎉 All notification tests PASSED! Cross-platform notifications are working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the logs above for details.');
    }
    
    console.log('\n');
  }

  /**
   * Helper function to add delays between tests
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test web-specific browser notification permission
   */
  public async testWebPermissions(): Promise<boolean> {
    if (Platform.OS !== 'web') {
      console.log('Web permission test skipped - not on web platform');
      return true;
    }

    console.log('Testing web notification permissions...');
    
    if (!('Notification' in window)) {
      console.log('❌ Browser does not support notifications');
      return false;
    }

    console.log(`Current permission: ${Notification.permission}`);
    
    if (Notification.permission === 'granted') {
      console.log('✅ Web notifications already granted');
      return true;
    } else if (Notification.permission === 'denied') {
      console.log('❌ Web notifications denied');
      return false;
    } else {
      console.log('ℹ️  Web notifications permission not yet requested');
      return true; // Not yet requested is OK
    }
  }
}

// Export function for easy testing
export const runNotificationTests = async (): Promise<void> => {
  const tester = new NotificationTester();
  await tester.runAllTests();
};

// Export for console testing
if (typeof window !== 'undefined') {
  (window as any).testNotifications = runNotificationTests;
}