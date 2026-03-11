// Jest setup file
// This file runs before each test suite

// Set environment variables for testing
process.env.USE_REAL_DB = 'false';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-jest';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
