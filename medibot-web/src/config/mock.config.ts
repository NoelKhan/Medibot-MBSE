/**
 * Mock Mode Configuration
 * ========================
 * Enable this for frontend-only development without backend
 */

// Toggle between real backend and mock mode
export const USE_MOCK_MODE = false; // Set to true for frontend-only mode

// Mock configuration
export const MOCK_CONFIG = {
  // Simulate network delay (ms)
  NETWORK_DELAY: 500,
  
  // Enable console logging
  DEBUG: true,
  
  // Mock user data
  MOCK_USER: {
    id: 'mock-user-123',
    email: 'demo@medibot.com',
    firstName: 'Demo',
    lastName: 'User',
    phone: '+61 400 000 000',
    dateOfBirth: '1990-01-01',
    role: 'patient' as const,
  },
};

// Helper to simulate API delay
export const mockDelay = () => 
  new Promise(resolve => setTimeout(resolve, MOCK_CONFIG.NETWORK_DELAY));

// Mock data generators
export const mockData = {
  appointments: [
    {
      id: 'apt-1',
      doctorName: 'Dr. Sarah Johnson',
      specialty: 'General Practitioner',
      date: '2025-11-05',
      time: '10:00 AM',
      type: 'video' as const,
      status: 'scheduled' as const,
    },
    {
      id: 'apt-2',
      doctorName: 'Dr. Michael Chen',
      specialty: 'Cardiologist',
      date: '2025-11-08',
      time: '2:30 PM',
      type: 'in-person' as const,
      status: 'scheduled' as const,
    },
  ],
  
  cases: [
    {
      id: 'case-1',
      title: 'Persistent Headache',
      status: 'open' as const,
      createdAt: '2025-10-28',
      lastUpdate: '2025-10-30',
      severity: 'moderate' as const,
    },
    {
      id: 'case-2',
      title: 'Annual Checkup',
      status: 'closed' as const,
      createdAt: '2025-10-15',
      lastUpdate: '2025-10-20',
      severity: 'low' as const,
    },
  ],
  
  conversations: [
    {
      id: 'conv-1',
      title: 'Headache consultation',
      lastMessage: 'I recommend taking Paracetamol...',
      lastMessageAt: '2025-10-31T10:30:00Z',
      status: 'active' as const,
    },
  ],
};

console.log('🎭 Mock mode:', USE_MOCK_MODE ? 'ENABLED' : 'DISABLED');
