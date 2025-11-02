/**
 * API Test Screen
 * ===============
 * Simple test screen to verify API integration
 * 
 * Usage: Import and navigate to this screen to test API
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ApiIntegrationTest } from '../tests/ApiIntegrationTest';
import { apiClient } from '../services/ApiClient';
import { authService } from '../services/auth';
import { API_CONFIG } from '../config/api.config';
import { createLogger } from '../services/Logger';
import { useResponsive } from '../hooks/useResponsive';

const logger = createLogger('ApiTestScreen');
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import ErrorBoundary from '../components/ErrorBoundary';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import EmptyState from '../components/EmptyState';

interface ApiTestScreenProps {
  navigation: any;
}

export const ApiTestScreen: React.FC<ApiTestScreenProps> = ({ navigation }) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  React.useEffect(() => {
    trackScreen('ApiTestScreen');
  }, []);

  const addResult = (message: string) => {
    setTestResults((prev) => [...prev, message]);
    logger.info('Test result', { message });
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testConnection = async () => {
    setIsLoading(true);
    clearResults();
    
    try {
      addResult('🔍 Testing backend connection...');
      addResult(`📍 Configured Base URL: ${API_CONFIG.baseURL}`);
      addResult(`📱 Platform: ${Platform.OS}`);
      
      // Direct axios test first
      addResult('\n🧪 Test 1: Direct axios call...');
      try {
        const directUrl = `${API_CONFIG.baseURL}/api/health`;
        addResult(`🌐 Trying: ${directUrl}`);
        const response = await axios.get(directUrl, { timeout: 5000 });
        addResult(`✅ Direct axios SUCCESS!`);
        addResult(`📊 Status: ${response.status}`);
        addResult(`📦 Data: ${JSON.stringify(response.data)}`);
      } catch (axiosError: any) {
        addResult(`❌ Direct axios FAILED: ${axiosError.message}`);
        if (axiosError.code) addResult(`   Code: ${axiosError.code}`);
        if (axiosError.response) {
          addResult(`   Response: ${axiosError.response.status}`);
        } else {
          addResult(`   No response - network/timeout issue`);
        }
      }
      
      // Now test with apiClient
      addResult('\n🧪 Test 2: ApiClient call...');
      addResult(`🌐 ApiClient URL: ${apiClient.getBaseURL()}/api/health`);
      
      const isOnline = await apiClient.isOnline();
      
      if (isOnline) {
        addResult('✅ ApiClient SUCCESS!');
        addResult('🎉 Backend is reachable via ApiClient!');
        Alert.alert('Success', 'Backend is online!');
      } else {
        addResult('❌ ApiClient returned false');
        addResult('⚠️  Check:');
        addResult('   1. Backend running (npm run start:dev)');
        addResult('   2. Same WiFi network');
        addResult('   3. Firewall allows port 3000');
        Alert.alert('Offline', 'Backend not reachable via ApiClient');
      }
    } catch (error: any) {
      addResult(`❌ Test crashed: ${error.message}`);
      addResult(`🔍 Error: ${error.name || 'Unknown'}`);
      addResult(`📡 Code: ${error.code || 'No code'}`);
      Alert.alert('Error', `Connection test crashed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testQuickAuth = async () => {
    setIsLoading(true);
    clearResults();
    
    try {
      const timestamp = Date.now();
      const testEmail = `test${timestamp}@medibot.com`;
      const testPassword = 'Test123!';
      
      addResult('📝 Registering new user...');
      addResult(`Email: ${testEmail}`);
      
      const result = await authService.register({
        email: testEmail,
        password: testPassword,
        name: 'Test User',
      });
      
      addResult(`✅ Registered successfully!`);
      addResult(`User ID: ${result.id}`);
      addResult(`User name: ${result.name}`);
      addResult(`User email: ${result.email}`);
      
      Alert.alert('Success', 'User registered successfully!');
    } catch (error: any) {
      addResult(`❌ Auth test failed: ${error.message}`);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const runFullTestSuite = async () => {
    // Temporarily disabled due to crashes
    Alert.alert(
      '⚠️ Full Test Suite Disabled',
      'Running all tests causes app crashes due to too many rapid API calls.\n\n' +
      'Please test individual endpoints:\n' +
      '1. Test Connection\n' +
      '2. Test Auth (register)\n' +
      '\n' +
      'Full suite will be fixed in a future update.',
      [{ text: 'OK' }]
    );
    return;
    
    /* Original implementation - disabled
    setIsLoading(true);
    clearResults();
    
    try {
      addResult('🚀 Starting full API integration test suite...\n');
      addResult('⚠️  This will take a while. Please be patient...\n');
      
      // ... rest of implementation
    } catch (error: any) {
      addResult(`\n❌ Test suite crashed: ${error.message}`);
      Alert.alert('Error', 'Test suite crashed. Try running individual tests instead.');
    } finally {
      setIsLoading(false);
    }
    */
  };

  const themedStyles = styles(colors, responsive);

  return (
    <View style={themedStyles.container}>
      {/* Single Purple Banner Header with safe area padding */}
      <View style={[themedStyles.bannerHeader, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={themedStyles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={themedStyles.headerContent}>
          <Text style={themedStyles.headerTitle}>API Integration Test</Text>
          <Text style={themedStyles.headerSubtitle}>
            Test backend connectivity and endpoints
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={themedStyles.scrollContent}>

        <View style={themedStyles.buttonContainer}>
        <TouchableOpacity
          style={[themedStyles.button, themedStyles.primaryButton]}
          onPress={testConnection}
          disabled={isLoading}
        >
          <Text style={themedStyles.buttonText}>
            {isLoading ? 'Testing...' : '🔍 Test Connection'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[themedStyles.button, themedStyles.secondaryButton]}
          onPress={testQuickAuth}
          disabled={isLoading}
        >
          <Text style={themedStyles.buttonText}>
            {isLoading ? 'Testing...' : '🔐 Test Auth'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[themedStyles.button, themedStyles.successButton]}
          onPress={runFullTestSuite}
          disabled={isLoading}
        >
          <Text style={themedStyles.buttonText}>
            {isLoading ? 'Running...' : '🚀 Run All Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[themedStyles.button, themedStyles.clearButton]}
          onPress={clearResults}
          disabled={isLoading}
        >
          <Text style={themedStyles.buttonTextDark}>Clear Results</Text>
        </TouchableOpacity>
      </View>

        {isLoading && (
          <View style={themedStyles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={themedStyles.loadingText}>Running tests...</Text>
          </View>
        )}

        <View style={themedStyles.resultsContainer}>
          {testResults.length === 0 ? (
            <EmptyState
              icon="bug-report"
              title="No Tests Run Yet"
              message="Run a test to see the results here. Start with 'Test Connection' to check backend availability."
              actionLabel="Test Connection"
              onAction={testConnection}
            />
          ) : (
            testResults.map((result, index) => (
              <Text key={index} style={themedStyles.resultText}>
                {result}
              </Text>
            ))
          )}
        </View>

        <View style={themedStyles.infoContainer}>
          <Text style={themedStyles.infoText}>
            💡 Backend must be running at: http://192.168.0.158:3000
          </Text>
          <Text style={themedStyles.infoText}>
            Run: cd medibot-backend && npm run start:dev
          </Text>
          <Text style={themedStyles.infoText}>
            ⚠️  Full test suite may take 1-2 minutes
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = (colors: any, responsive: any) => {
  const isLandscape = responsive.isLandscape;
  const isTablet = responsive.isTablet;
  const contentPadding = isTablet ? 24 : 16;
  
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bannerHeader: {
    backgroundColor: '#5856D6', // Purple to match button scheme
    paddingBottom: isLandscape && !isTablet ? 12 : 16,
    paddingHorizontal: contentPadding,
    // paddingTop is set inline using insets.top
    flexDirection: 'row',
    alignItems: 'flex-start', // Changed from 'center' to allow subtitle to show
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
    marginTop: 4, // Added to align with back button
  },
  headerTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18, // Added for better readability
  },
  backButton: {
    padding: 4,
    marginTop: 4, // Added for better alignment
  },
  scrollContent: {
    flex: 1,
    padding: contentPadding,
  },
  title: {
    fontSize: isTablet ? 28 : 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: colors.text,
  },
  buttonContainer: {
    marginBottom: isTablet ? 24 : 20,
    flexDirection: isLandscape && isTablet ? 'row' : 'column',
    gap: 12,
  },
  button: {
    flex: isLandscape && isTablet ? 1 : undefined,
    padding: isTablet ? 18 : 16,
    borderRadius: 8,
    marginBottom: isLandscape && isTablet ? 0 : 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: '#5856D6',
  },
  successButton: {
    backgroundColor: '#34C759',
  },
  clearButton: {
    backgroundColor: colors.surface,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDark: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  resultText: {
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
    color: colors.text,
  },
  infoContainer: {
    backgroundColor: colors.warning || '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
});
};

// Wrapped version with ErrorBoundary
const ApiTestScreenWithErrorBoundary: React.FC<ApiTestScreenProps> = (props) => (
  <ErrorBoundary>
    <ApiTestScreen {...props} />
  </ErrorBoundary>
);

export default ApiTestScreenWithErrorBoundary;
