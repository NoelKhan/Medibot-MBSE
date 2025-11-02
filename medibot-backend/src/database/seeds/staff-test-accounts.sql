-- Staff Test Accounts Seed Data
-- Password: Test123! (bcrypt hash: $2b$10$YourHashHere)
-- Run this to create test staff accounts for API testing

-- Note: You need to generate the bcrypt hash for 'Test123!' 
-- You can do this by running:
-- node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Test123!', 10).then(hash => console.log(hash));"

-- Test Medical Staff Account
INSERT INTO staff_users (
  id,
  email,
  password_hash,
  name,
  role,
  badge_number,
  department,
  shift,
  status,
  specializations,
  certifications,
  created_at,
  updated_at
) VALUES (
  'test_medical_001',
  'test@medical.com',
  -- Replace this with actual bcrypt hash of 'Test123!'
  '$2b$10$rQ8K3qN.2p1X4wLx5qYqcO8FZ5JVN7QZB8eP.vGqZYx9YqZYx9YqZ',
  'Test Medical Staff',
  'doctor',
  'API-001',
  'Medical Services',
  'day',
  'offline',
  'General Medicine,Internal Medicine',
  '[{"name":"MBBS","issuedDate":"2020-01-01"},{"name":"MD","issuedDate":"2022-01-01"}]',
  '2024-01-01 00:00:00',
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  badge_number = EXCLUDED.badge_number,
  password_hash = EXCLUDED.password_hash;

-- Test Emergency Staff Account
INSERT INTO staff_users (
  id,
  email,
  password_hash,
  name,
  role,
  badge_number,
  department,
  shift,
  status,
  specializations,
  certifications,
  created_at,
  updated_at
) VALUES (
  'test_emergency_001',
  'test@emergency.com',
  -- Replace this with actual bcrypt hash of 'Test123!'
  '$2b$10$rQ8K3qN.2p1X4wLx5qYqcO8FZ5JVN7QZB8eP.vGqZYx9YqZYx9YqZ',
  'Test Emergency Staff',
  'emergency_operator',
  'API-911',
  'Emergency Services',
  'day',
  'offline',
  'Emergency Response,Critical Care',
  '[{"name":"Advanced First Aid","issuedDate":"2020-01-01"},{"name":"Emergency Medical Dispatcher","issuedDate":"2021-01-01"}]',
  '2024-01-01 00:00:00',
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  badge_number = EXCLUDED.badge_number,
  password_hash = EXCLUDED.password_hash;

-- Verify the insertions
SELECT id, email, name, role, badge_number, department 
FROM staff_users 
WHERE email IN ('test@medical.com', 'test@emergency.com');
