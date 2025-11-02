-- Update test user email to noel5khan@gmail.com
-- Run this after creating the test user

UPDATE users 
SET email = 'noel5khan@gmail.com'
WHERE email = 'test@medibot.com';

-- Verify the update
SELECT id, email, name, role 
FROM users 
WHERE email = 'noel5khan@gmail.com';
