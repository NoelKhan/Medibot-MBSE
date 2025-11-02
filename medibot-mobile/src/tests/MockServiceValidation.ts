/**
 * MOCK SERVICE VALIDATION
 * Tests to ensure mock services return consistent data matching API contracts
 */

import MockReminderFollowupService from '../services/MockReminderFollowupService';

export interface ValidationResult {
  service: string;
  passed: boolean;
  tests: {
    name: string;
    passed: boolean;
    message: string;
  }[];
}

/**
 * Validate MockReminderFollowupService
 */
export async function validateMockReminderFollowupService(): Promise<ValidationResult> {
  const service = MockReminderFollowupService.getInstance();
  const result: ValidationResult = {
    service: 'MockReminderFollowupService',
    passed: true,
    tests: [],
  };

  try {
    // Initialize service
    await service.initialize();

    // Test 1: Get User Reminders
    try {
      const reminders = await service.getUserReminders('user_test');
      const test1 = {
        name: 'getUserReminders',
        passed: reminders.length > 0,
        message: reminders.length > 0 
          ? `✅ Found ${reminders.length} reminders` 
          : '❌ No reminders found',
      };
      result.tests.push(test1);
      if (!test1.passed) result.passed = false;
    } catch (error) {
      result.tests.push({
        name: 'getUserReminders',
        passed: false,
        message: `❌ Error: ${error}`,
      });
      result.passed = false;
    }

    // Test 2: Get Pending Reminders
    try {
      const pendingReminders = await service.getPendingReminders('user_test');
      const test2 = {
        name: 'getPendingReminders',
        passed: true,
        message: `✅ Found ${pendingReminders.length} pending reminders`,
      };
      result.tests.push(test2);
    } catch (error) {
      result.tests.push({
        name: 'getPendingReminders',
        passed: false,
        message: `❌ Error: ${error}`,
      });
      result.passed = false;
    }

    // Test 3: Create Reminder
    try {
      const newReminder = await service.createReminder({
        userId: 'user_test',
        title: 'Test Reminder',
        description: 'This is a test',
        type: 'general',
        scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'pending',
        priority: 'low',
      });
      const test3 = {
        name: 'createReminder',
        passed: newReminder.id !== undefined && newReminder.title === 'Test Reminder',
        message: newReminder.id 
          ? `✅ Created reminder with ID: ${newReminder.id}` 
          : '❌ Failed to create reminder',
      };
      result.tests.push(test3);
      if (!test3.passed) result.passed = false;
    } catch (error) {
      result.tests.push({
        name: 'createReminder',
        passed: false,
        message: `❌ Error: ${error}`,
      });
      result.passed = false;
    }

    // Test 4: Get User Followups
    try {
      const followups = await service.getUserFollowups('user_test');
      const test4 = {
        name: 'getUserFollowups',
        passed: followups.length > 0,
        message: followups.length > 0 
          ? `✅ Found ${followups.length} followups` 
          : '❌ No followups found',
      };
      result.tests.push(test4);
      if (!test4.passed) result.passed = false;
    } catch (error) {
      result.tests.push({
        name: 'getUserFollowups',
        passed: false,
        message: `❌ Error: ${error}`,
      });
      result.passed = false;
    }

    // Test 5: Get Statistics
    try {
      const stats = await service.getStatistics('user_test');
      const test5 = {
        name: 'getStatistics',
        passed: stats.totalReminders >= 0 && stats.totalFollowups >= 0,
        message: `✅ Stats: ${stats.totalReminders} reminders, ${stats.totalFollowups} followups`,
      };
      result.tests.push(test5);
      if (!test5.passed) result.passed = false;
    } catch (error) {
      result.tests.push({
        name: 'getStatistics',
        passed: false,
        message: `❌ Error: ${error}`,
      });
      result.passed = false;
    }

    // Test 6: Data Consistency - Check reminder structure
    try {
      const reminders = await service.getUserReminders('user_test');
      const firstReminder = reminders[0];
      const hasRequiredFields = !!(firstReminder && 
        firstReminder.id && 
        firstReminder.userId && 
        firstReminder.title && 
        firstReminder.type && 
        firstReminder.scheduledTime && 
        firstReminder.status && 
        firstReminder.priority);
      
      const test6 = {
        name: 'reminderStructure',
        passed: hasRequiredFields,
        message: hasRequiredFields 
          ? '✅ Reminder structure matches API contract' 
          : '❌ Reminder missing required fields',
      };
      result.tests.push(test6);
      if (!test6.passed) result.passed = false;
    } catch (error) {
      result.tests.push({
        name: 'reminderStructure',
        passed: false,
        message: `❌ Error: ${error}`,
      });
      result.passed = false;
    }

    // Test 7: Data Consistency - Check followup structure
    try {
      const followups = await service.getUserFollowups('user_test');
      const firstFollowup = followups[0];
      const hasRequiredFields = !!(firstFollowup && 
        firstFollowup.id && 
        firstFollowup.caseId && 
        firstFollowup.userId && 
        firstFollowup.type && 
        firstFollowup.scheduledDate && 
        firstFollowup.status && 
        firstFollowup.message &&
        firstFollowup.priority);
      
      const test7 = {
        name: 'followupStructure',
        passed: hasRequiredFields,
        message: hasRequiredFields 
          ? '✅ Followup structure matches API contract' 
          : '❌ Followup missing required fields',
      };
      result.tests.push(test7);
      if (!test7.passed) result.passed = false;
    } catch (error) {
      result.tests.push({
        name: 'followupStructure',
        passed: false,
        message: `❌ Error: ${error}`,
      });
      result.passed = false;
    }

  } catch (error) {
    result.passed = false;
    result.tests.push({
      name: 'initialization',
      passed: false,
      message: `❌ Service initialization failed: ${error}`,
    });
  }

  return result;
}

/**
 * Run all mock service validations
 */
export async function runAllValidations(): Promise<ValidationResult[]> {
  console.log('🧪 Running Mock Service Validations...\n');

  const results: ValidationResult[] = [];

  // Validate MockReminderFollowupService
  const reminderFollowupResult = await validateMockReminderFollowupService();
  results.push(reminderFollowupResult);

  // Print results
  console.log('\n📊 VALIDATION RESULTS:\n');
  results.forEach(result => {
    console.log(`${result.passed ? '✅' : '❌'} ${result.service}`);
    result.tests.forEach(test => {
      console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}: ${test.message}`);
    });
    console.log('');
  });

  const allPassed = results.every(r => r.passed);
  console.log(allPassed 
    ? '🎉 ALL VALIDATIONS PASSED!' 
    : '⚠️  SOME VALIDATIONS FAILED - Check logs above');

  return results;
}

/**
 * Quick validation check (can be called from console)
 */
export async function quickValidation(): Promise<boolean> {
  const results = await runAllValidations();
  return results.every(r => r.passed);
}
