// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Expo modules
jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  deviceName: 'Test Device',
}));


// Mock React Native modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  // Mock NativeModules
  RN.NativeModules = RN.NativeModules || {};
  RN.NativeModules.DevMenu = {
    show: jest.fn(),
    reload: jest.fn(),
    debugRemotely: jest.fn(),
    setProfilingEnabled: jest.fn(),
    setHotLoadingEnabled: jest.fn(),
  };
  RN.NativeModules.SettingsManager = {
    settings: {},
    setValues: jest.fn(),
    deleteValues: jest.fn(),
    getConstants: jest.fn(() => ({ settings: {} })),
  };
  RN.NativeModules.PlatformConstants = {
    ...RN.NativeModules.PlatformConstants,
    isTesting: true,
    reactNativeVersion: { major: 0, minor: 81, patch: 5 },
  };
  
  return Object.setPrototypeOf(
    {
      ...RN,
      AppState: {
        ...RN.AppState,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        currentState: 'active',
      },
      Alert: {
        alert: jest.fn(),
      },
      Platform: {
        OS: 'ios',
        select: jest.fn((obj) => obj.ios),
      },
    },
    RN
  );
});

jest.mock('expo-av', () => ({
  Audio: {
    setAudioModeAsync: jest.fn(),
    Recording: jest.fn(() => ({
      prepareToRecordAsync: jest.fn(),
      startAsync: jest.fn(),
      stopAndUnloadAsync: jest.fn(),
      getURI: jest.fn(() => 'mock-uri'),
      getStatusAsync: jest.fn(() => ({ isRecording: false, durationMillis: 0 })),
    })),
  },
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-mail-composer', () => ({
  composeAsync: jest.fn(),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
}));

// Global test timeout
jest.setTimeout(10000);

// Silence console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};