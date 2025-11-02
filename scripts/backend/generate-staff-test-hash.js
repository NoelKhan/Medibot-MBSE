#!/usr/bin/env node
/**
 * Generate bcrypt hash for staff test accounts
 * This script generates the password hash for 'Test123!' and updates the SQL seed file
 */

const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const PASSWORD = 'Test123!';
const SALT_ROUNDS = 10;
const SQL_FILE = path.join(__dirname, '../src/database/seeds/staff-test-accounts.sql');

async function generateHash() {
  try {
    console.log('🔐 Generating bcrypt hash for password:', PASSWORD);
    const hash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
    console.log('✅ Generated hash:', hash);
    
    // Read the SQL file
    let sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
    
    // Replace the placeholder hash with the actual hash
    const placeholderHash = '$2b$10$rQ8K3qN.2p1X4wLx5qYqcO8FZ5JVN7QZB8eP.vGqZYx9YqZYx9YqZ';
    sqlContent = sqlContent.replace(new RegExp(placeholderHash, 'g'), hash);
    
    // Write back to the file
    fs.writeFileSync(SQL_FILE, sqlContent, 'utf8');
    
    console.log('✅ Updated SQL file:', SQL_FILE);
    console.log('\n📝 Next steps:');
    console.log('1. Connect to your database');
    console.log('2. Run the SQL file: psql -U postgres -d medibot < src/database/seeds/staff-test-accounts.sql');
    console.log('3. Verify the accounts were created');
    console.log('\nTest accounts created:');
    console.log('  - test@medical.com / Test123! (Badge: API-001)');
    console.log('  - test@emergency.com / Test123! (Badge: API-911)');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateHash();
