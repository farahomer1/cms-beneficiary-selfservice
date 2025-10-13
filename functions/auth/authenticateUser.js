/**
 * Authentication Module for CMS Beneficiary Self-Service
 * 
 * This module provides secure authentication functionality with:
 * - Medicare ID and last name verification
 * - Rate limiting to prevent brute force attacks
 * - Input validation and sanitization
 * - HIPAA-compliant logging (no PII in logs)
 * - Session token generation
 */

const admin = require('firebase-admin');

// Rate limiting map: medicareId -> { attempts, lastAttempt }
const rateLimitMap = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Clean up old rate limit entries
 */
function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now - value.lastAttempt > LOCKOUT_DURATION) {
      rateLimitMap.delete(key);
    }
  }
}

/**
 * Check if user is rate limited
 */
function isRateLimited(medicareId) {
  cleanupRateLimits();
  
  const limitData = rateLimitMap.get(medicareId);
  if (!limitData) return false;
  
  const now = Date.now();
  if (now - limitData.lastAttempt > LOCKOUT_DURATION) {
    rateLimitMap.delete(medicareId);
    return false;
  }
  
  return limitData.attempts >= MAX_ATTEMPTS;
}

/**
 * Record authentication attempt
 */
function recordAttempt(medicareId, success) {
  const now = Date.now();
  const limitData = rateLimitMap.get(medicareId) || { attempts: 0, lastAttempt: now };
  
  if (success) {
    rateLimitMap.delete(medicareId);
  } else {
    limitData.attempts += 1;
    limitData.lastAttempt = now;
    rateLimitMap.set(medicareId, limitData);
  }
}

/**
 * Validate Medicare ID format
 * Format: XXX-XX-XXXX
 */
function validateMedicareId(medicareId) {
  if (!medicareId || typeof medicareId !== 'string') {
    return false;
  }
  
  const medicareIdPattern = /^\d{3}-\d{2}-\d{4}$/;
  return medicareIdPattern.test(medicareId.trim());
}

/**
 * Sanitize input to prevent injection attacks
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove any characters that could be used for injection
  return input.trim().replace(/[<>'"`;()]/g, '');
}

/**
 * Generate a secure session token
 */
function generateSessionToken(beneficiary) {
  // In production, use JWT or similar secure token mechanism
  const tokenData = {
    medicareId: beneficiary.medicareId,
    firstName: beneficiary.firstName,
    timestamp: Date.now(),
    expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
  };
  
  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

/**
 * Authenticate a beneficiary
 * 
 * @param {string} medicareId - Medicare ID (format: XXX-XX-XXXX)
 * @param {string} lastName - Beneficiary's last name
 * @returns {Promise<Object>} Authentication result
 */
async function authenticateUser(medicareId, lastName) {
  try {
    // Input validation
    if (!medicareId || !lastName) {
      return {
        success: false,
        error: 'MISSING_CREDENTIALS',
        message: 'Medicare ID and last name are required'
      };
    }
    
    // Sanitize inputs
    medicareId = sanitizeInput(medicareId);
    lastName = sanitizeInput(lastName);
    
    // Validate Medicare ID format
    if (!validateMedicareId(medicareId)) {
      console.warn('Authentication failed: Invalid Medicare ID format');
      return {
        success: false,
        error: 'INVALID_FORMAT',
        message: 'Invalid Medicare ID format. Expected format: XXX-XX-XXXX'
      };
    }
    
    // Check rate limiting
    if (isRateLimited(medicareId)) {
      console.warn('Authentication failed: Rate limit exceeded');
      return {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many failed attempts. Please try again in 15 minutes.'
      };
    }
    
    // Query Firestore for beneficiary
    const db = admin.firestore();
    const beneficiariesRef = db.collection('beneficiaries');
    const snapshot = await beneficiariesRef
      .where('medicareId', '==', medicareId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      recordAttempt(medicareId, false);
      console.warn('Authentication failed: Beneficiary not found');
      return {
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid Medicare ID or last name'
      };
    }
    
    const beneficiaryDoc = snapshot.docs[0];
    const beneficiary = beneficiaryDoc.data();
    
    // Verify last name (case-insensitive)
    if (beneficiary.lastName.toLowerCase() !== lastName.toLowerCase()) {
      recordAttempt(medicareId, false);
      console.warn('Authentication failed: Last name mismatch');
      return {
        success: false,
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid Medicare ID or last name'
      };
    }
    
    // Authentication successful
    recordAttempt(medicareId, true);
    
    // Update authentication status
    await beneficiaryDoc.ref.update({
      isAuthenticated: true,
      lastLoginDate: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Generate session token
    const sessionToken = generateSessionToken(beneficiary);
    
    console.info('Authentication successful');
    
    return {
      success: true,
      sessionToken: sessionToken,
      beneficiary: {
        medicareId: beneficiary.medicareId,
        firstName: beneficiary.firstName,
        lastName: beneficiary.lastName,
        coverageType: beneficiary.coverageType
      }
    };
    
  } catch (error) {
    console.error('Authentication error:', error.message);
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'An error occurred during authentication. Please try again.'
    };
  }
}

module.exports = {
  authenticateUser,
  validateMedicareId,
  sanitizeInput
};
