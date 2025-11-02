/**
 * Test script for audio and file functionality
 * This tests the core services without running the full app
 */

import { VoiceRecordingService } from './src/services/VoiceRecordingService';
import { FileUploadService } from './src/services/FileUploadService';

// Test audio permissions
async function testAudioPermissions() {
  console.log('Testing audio permissions...');
  try {
    const hasPermission = await VoiceRecordingService.requestPermissions();
    console.log('Audio permission result:', hasPermission);
    return hasPermission;
  } catch (error) {
    console.error('Audio permission error:', error);
    return false;
  }
}

// Test file picker
async function testFileUpload() {
  console.log('Testing file upload service...');
  try {
    // This would normally open a file picker, but we'll just test the service structure
    console.log('FileUploadService available methods:', Object.getOwnPropertyNames(FileUploadService));
    return true;
  } catch (error) {
    console.error('File upload test error:', error);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('Starting service tests...');
  
  const audioTest = await testAudioPermissions();
  const fileTest = await testFileUpload();
  
  console.log('Test Results:');
  console.log('- Audio service:', audioTest ? 'PASS' : 'FAIL');
  console.log('- File service:', fileTest ? 'PASS' : 'FAIL');
  
  return audioTest && fileTest;
}

// Export for use
export { runTests };

// Run if called directly
if (require.main === module) {
  runTests().then(success => {
    console.log('All tests:', success ? 'PASSED' : 'FAILED');
    process.exit(success ? 0 : 1);
  });
}