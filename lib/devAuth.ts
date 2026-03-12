/**
 * Development-only authentication bypass
 * This file provides mock authentication for local development when USE_REAL_DB=false
 * Production environments (USE_REAL_DB=true) use real NextAuth
 */

import { auth as realAuth, signOut as realSignOut } from "./auth";

const USE_REAL_DB = process.env.USE_REAL_DB === "true";

// Mock session for development
const mockSession = {
  user: {
    id: "dev-user-stewart",
    name: "Stewart",
    email: "stewart@example.com",
  },
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
};

/**
 * Authentication function that works in both development and production
 * - Development (USE_REAL_DB=false): Returns mock session for testing
 * - Production (USE_REAL_DB=true): Uses real NextAuth authentication
 */
export async function getAuth() {
  if (!USE_REAL_DB) {
    // In development mode with in-memory DB, return mock session
    return mockSession;
  }

  // In production mode with real MongoDB, use real auth
  return await realAuth();
}

/**
 * Sign out function that works in both development and production
 * - Development (USE_REAL_DB=false): Returns void (no-op)
 * - Production (USE_REAL_DB=true): Uses real NextAuth signOut
 */
export const devSignOut = USE_REAL_DB ? realSignOut : async () => {
  // No-op in development mode - just a mock
  console.log("[DEV MODE] Sign out called (no-op in development)");
};
