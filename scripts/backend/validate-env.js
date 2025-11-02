#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * =======================================
 * Validates that all required environment variables are set
 * Run before starting the application in production
 * 
 * Usage: node scripts/validate-env.js
 */

const fs = require('fs');
const path = require('path');

// Define required environment variables by environment
const requiredVars = {
  common: [
    'NODE_ENV',
    'PORT',
    'DB_HOST',
    'DB_PORT',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_DATABASE',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ],
  production: [
    'CORS_ORIGIN',
    'REDIS_HOST',
    'REDIS_PASSWORD',
    'MAIL_HOST',
    'MAIL_PORT',
    'MAIL_USER',
    'MAIL_PASSWORD',
    'AWS_REGION',
  ],
  development: [
    'LOCAL_IP',
  ],
};

// Security checks
const securityChecks = {
  JWT_SECRET: (val) => val.length >= 32,
  JWT_REFRESH_SECRET: (val) => val.length >= 32,
  DB_PASSWORD: (val) => val.length >= 16,
};

// Default/insecure values that should be changed in production
const insecureDefaults = [
  'change-me',
  'CHANGE_ME',
  'your-secret',
  'medibot_dev_password',
  'test-secret',
];

function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');

  const env = process.env.NODE_ENV || 'development';
  console.log(`Environment: ${env}\n`);

  const errors = [];
  const warnings = [];

  // Check common variables
  const varsToCheck = [
    ...requiredVars.common,
    ...(requiredVars[env] || []),
  ];

  // 1. Check if variables are set
  for (const varName of varsToCheck) {
    if (!process.env[varName]) {
      errors.push(`❌ Missing required variable: ${varName}`);
    }
  }

  // 2. Security checks
  for (const [varName, checkFn] of Object.entries(securityChecks)) {
    const value = process.env[varName];
    if (value && !checkFn(value)) {
      if (env === 'production') {
        errors.push(`❌ ${varName} does not meet security requirements`);
      } else {
        warnings.push(`⚠️  ${varName} does not meet security requirements (OK for ${env})`);
      }
    }
  }

  // 3. Check for insecure defaults in production
  if (env === 'production') {
    for (const varName of varsToCheck) {
      const value = process.env[varName];
      if (value && insecureDefaults.some(def => value.includes(def))) {
        errors.push(`❌ ${varName} contains insecure default value`);
      }
    }

    // Check DB_SYNCHRONIZE is false in production
    if (process.env.DB_SYNCHRONIZE === 'true') {
      errors.push('❌ DB_SYNCHRONIZE must be false in production!');
    }

    // Check LOAD_SAMPLE_DATA is false in production
    if (process.env.LOAD_SAMPLE_DATA === 'true') {
      errors.push('❌ LOAD_SAMPLE_DATA must be false in production!');
    }
  }

  // 4. Check for .env file in production (should use secret manager)
  if (env === 'production') {
    const envFilePath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envFilePath)) {
      warnings.push('⚠️  .env file detected in production. Consider using a secret manager (AWS Secrets Manager, etc.)');
    }
  }

  // Print results
  console.log('═══════════════════════════════════════\n');

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:\n');
    warnings.forEach(warning => console.log(warning));
    console.log();
  }

  if (errors.length > 0) {
    console.log('❌ ERRORS:\n');
    errors.forEach(error => console.log(error));
    console.log();
    console.log('═══════════════════════════════════════');
    console.log('❌ Environment validation FAILED\n');
    process.exit(1);
  }

  console.log('✅ Environment validation PASSED\n');
  console.log('All required environment variables are set and secure.');
  console.log('═══════════════════════════════════════\n');
}

// Run validation
try {
  // Load .env file if exists (for local testing)
  const dotenvPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(dotenvPath)) {
    require('dotenv').config({ path: dotenvPath });
  }

  validateEnvironment();
} catch (error) {
  console.error('❌ Validation error:', error.message);
  process.exit(1);
}
