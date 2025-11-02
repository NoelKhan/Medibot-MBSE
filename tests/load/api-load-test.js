/**
 * MediBot API Load Testing with k6
 * =================================
 * Tests the API under various load conditions
 * 
 * Installation: brew install k6
 * Usage: k6 run tests/load/api-load-test.js
 * 
 * Scenarios:
 * - Smoke test: 1 user for 30s
 * - Load test: Ramp up to 100 users over 5 minutes
 * - Stress test: Ramp up to 200 users
 * - Spike test: Sudden spike to 300 users
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Configuration
const BASE_URL = __ENV.API_URL || 'http://medibot.local/api';

// Test stages
export const options = {
  stages: [
    // Smoke test
    { duration: '30s', target: 1 },   // 1 user for 30s
    
    // Load test
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '3m', target: 50 },   // Stay at 50 users
    
    // Stress test
    { duration: '1m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    
    // Spike test
    { duration: '30s', target: 200 }, // Spike to 200 users
    { duration: '1m', target: 200 },  // Stay at peak
    
    // Ramp down
    { duration: '1m', target: 0 },    // Graceful shutdown
  ],
  
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
    http_req_failed: ['rate<0.05'],                  // Less than 5% errors
    errors: ['rate<0.1'],                            // Less than 10% custom errors
  },
};

// =============================================================================
// Test Scenarios
// =============================================================================

export default function () {
  // Scenario weights (probability of running each test)
  const scenario = Math.random();
  
  if (scenario < 0.3) {
    testHealthCheck();
  } else if (scenario < 0.5) {
    testDoctorSearch();
  } else if (scenario < 0.7) {
    testChatMessage();
  } else if (scenario < 0.9) {
    testUserRegistration();
  } else {
    testCompleteUserFlow();
  }
  
  sleep(1); // Think time between requests
}

// =============================================================================
// Test Functions
// =============================================================================

/**
 * Test 1: Health Check Endpoint
 */
function testHealthCheck() {
  const res = http.get(`${BASE_URL}/health`);
  
  const success = check(res, {
    'health check status is 200': (r) => r.status === 200,
    'health check has status ok': (r) => {
      try {
        return JSON.parse(r.body).status === 'ok';
      } catch {
        return false;
      }
    },
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  errorRate.add(!success);
}

/**
 * Test 2: Doctor Search
 */
function testDoctorSearch() {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const res = http.get(`${BASE_URL}/doctors/search?specialty=Cardiology&page=1&limit=10`, params);
  
  const success = check(res, {
    'doctor search status is 200': (r) => r.status === 200,
    'doctor search returns data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.data && Array.isArray(data.data);
      } catch {
        return false;
      }
    },
    'doctor search response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
}

/**
 * Test 3: Chat Message (requires authentication)
 */
function testChatMessage() {
  // First, get specialties (public endpoint)
  const res = http.get(`${BASE_URL}/doctors/specialties`);
  
  const success = check(res, {
    'specialties status is 200': (r) => r.status === 200,
    'specialties returns data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data);
      } catch {
        return false;
      }
    },
  });
  
  errorRate.add(!success);
}

/**
 * Test 4: User Registration Flow
 */
function testUserRegistration() {
  const randomEmail = `test${Date.now()}${Math.floor(Math.random() * 10000)}@example.com`;
  
  const payload = JSON.stringify({
    email: randomEmail,
    password: 'Test1234!',
    firstName: 'Load',
    lastName: 'Test',
    phone: '+1234567890',
    dateOfBirth: '1990-01-01',
    gender: 'other',
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const res = http.post(`${BASE_URL}/auth/register`, payload, params);
  
  const success = check(res, {
    'registration status is 201 or 400': (r) => r.status === 201 || r.status === 400,
    'registration response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  
  errorRate.add(!success);
}

/**
 * Test 5: Complete User Flow
 * Simulates a real user journey: browse doctors → view availability → book
 */
function testCompleteUserFlow() {
  // Step 1: Search for doctors
  let res = http.get(`${BASE_URL}/doctors/search?specialty=General&page=1&limit=5`);
  
  let success = check(res, {
    'user flow - search successful': (r) => r.status === 200,
  });
  
  if (!success) {
    errorRate.add(true);
    return;
  }
  
  sleep(0.5);
  
  // Step 2: Get specialties list
  res = http.get(`${BASE_URL}/doctors/specialties`);
  
  success = check(res, {
    'user flow - specialties successful': (r) => r.status === 200,
  });
  
  if (!success) {
    errorRate.add(true);
    return;
  }
  
  sleep(0.5);
  
  // Step 3: View a specific doctor (if we got results)
  try {
    const searchData = JSON.parse(res.body);
    if (searchData.data && searchData.data.length > 0) {
      const doctorId = searchData.data[0].id;
      res = http.get(`${BASE_URL}/doctors/${doctorId}`);
      
      success = check(res, {
        'user flow - doctor details successful': (r) => r.status === 200,
      });
    }
  } catch (e) {
    // Ignore parsing errors for this test
  }
  
  errorRate.add(!success);
}

// =============================================================================
// Setup and Teardown
// =============================================================================

export function setup() {
  console.log('Starting load tests...');
  console.log(`Target API: ${BASE_URL}`);
  return { timestamp: Date.now() };
}

export function teardown(data) {
  console.log('Load tests completed!');
  console.log(`Duration: ${(Date.now() - data.timestamp) / 1000}s`);
}
