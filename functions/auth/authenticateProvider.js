/**
 * Secure Provider Authentication Function
 * Validates National Provider Identifier (NPI) with rate limiting
 * and audit logging for compliance
 */

const admin = require('firebase-admin');

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS_PER_WINDOW = 5;

/**
 * Authenticate a healthcare provider using NPI number
 * @param {string} npiNumber - 10-digit National Provider Identifier
 * @returns {Object} Authentication result with provider details or error
 */
async function authenticateProvider(npiNumber) {
  const startTime = Date.now();
  
  try {
    // Input validation
    if (!npiNumber || typeof npiNumber !== 'string') {
      return createResponse(false, 'Invalid NPI format', null, 400);
    }

    // Clean and validate NPI format (10 digits)
    const cleanNpi = npiNumber.replace(/\D/g, '');
    if (cleanNpi.length !== 10 || !/^\d{10}$/.test(cleanNpi)) {
      await logAuthAttempt(cleanNpi, false, 'Invalid NPI format');
      return createResponse(false, 'NPI must be exactly 10 digits', null, 400);
    }

    // Check rate limiting
    const rateLimitCheck = await checkRateLimit(cleanNpi);
    if (!rateLimitCheck.allowed) {
      await logAuthAttempt(cleanNpi, false, 'Rate limit exceeded');
      return createResponse(
        false,
        `Too many authentication attempts. Please try again in ${Math.ceil(rateLimitCheck.waitTime / 60000)} minutes`,
        null,
        429
      );
    }

    // Query Firestore for provider
    const db = admin.firestore();
    const providersRef = db.collection('providers');
    const snapshot = await providersRef.where('npiNumber', '==', cleanNpi).get();

    if (snapshot.empty) {
      await incrementFailedAttempts(cleanNpi);
      await logAuthAttempt(cleanNpi, false, 'NPI not found');
      return createResponse(false, 'Provider not found. Please verify your NPI number.', null, 404);
    }

    // Provider found - validate status
    const providerDoc = snapshot.docs[0];
    const providerData = providerDoc.data();

    if (providerData.status !== 'Active') {
      await logAuthAttempt(cleanNpi, false, `Provider status: ${providerData.status}`);
      return createResponse(
        false,
        'Provider account is not active. Please contact CMS support.',
        null,
        403
      );
    }

    // Successful authentication
    await resetFailedAttempts(cleanNpi);
    await logAuthAttempt(cleanNpi, true, 'Authentication successful');

    // Return sanitized provider information (no sensitive data)
    const authResponse = {
      npiNumber: providerData.npiNumber,
      clinicName: providerData.clinicName,
      contactPerson: providerData.contactPerson,
      specialty: providerData.specialty,
      address: {
        city: providerData.address.city,
        state: providerData.address.state
      },
      enrollmentDate: providerData.enrollmentDate,
      authenticated: true,
      sessionToken: generateSessionToken(cleanNpi)
    };

    const responseTime = Date.now() - startTime;
    console.log(`Provider authentication successful for NPI ${cleanNpi} in ${responseTime}ms`);

    return createResponse(true, 'Authentication successful', authResponse, 200);

  } catch (error) {
    console.error('Error in authenticateProvider:', error);
    await logAuthAttempt(npiNumber, false, `System error: ${error.message}`);
    return createResponse(false, 'Authentication service temporarily unavailable', null, 500);
  }
}

/**
 * Check if authentication attempts are within rate limits
 */
async function checkRateLimit(npiNumber) {
  const db = admin.firestore();
  const rateLimitRef = db.collection('authRateLimits').doc(npiNumber);
  
  try {
    const doc = await rateLimitRef.get();
    const now = Date.now();

    if (!doc.exists) {
      // First attempt
      await rateLimitRef.set({
        attempts: 1,
        windowStart: now,
        lastAttempt: now
      });
      return { allowed: true, waitTime: 0 };
    }

    const data = doc.data();
    const windowElapsed = now - data.windowStart;

    // Reset window if expired
    if (windowElapsed > RATE_LIMIT_WINDOW) {
      await rateLimitRef.set({
        attempts: 1,
        windowStart: now,
        lastAttempt: now
      });
      return { allowed: true, waitTime: 0 };
    }

    // Check if limit exceeded
    if (data.attempts >= MAX_ATTEMPTS_PER_WINDOW) {
      const waitTime = RATE_LIMIT_WINDOW - windowElapsed;
      return { allowed: false, waitTime };
    }

    // Increment attempts
    await rateLimitRef.update({
      attempts: admin.firestore.FieldValue.increment(1),
      lastAttempt: now
    });

    return { allowed: true, waitTime: 0 };

  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open to prevent blocking legitimate users
    return { allowed: true, waitTime: 0 };
  }
}

/**
 * Track failed authentication attempts
 */
async function incrementFailedAttempts(npiNumber) {
  const db = admin.firestore();
  const attemptsRef = db.collection('authFailedAttempts').doc(npiNumber);
  
  try {
    await attemptsRef.set({
      count: admin.firestore.FieldValue.increment(1),
      lastAttempt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('Error tracking failed attempts:', error);
  }
}

/**
 * Reset failed attempts counter after successful authentication
 */
async function resetFailedAttempts(npiNumber) {
  const db = admin.firestore();
  const attemptsRef = db.collection('authFailedAttempts').doc(npiNumber);
  
  try {
    await attemptsRef.delete();
  } catch (error) {
    console.error('Error resetting failed attempts:', error);
  }
}

/**
 * Log authentication attempt for audit trail (HIPAA compliance)
 */
async function logAuthAttempt(npiNumber, success, details) {
  const db = admin.firestore();
  const auditRef = db.collection('authAuditLog');
  
  try {
    await auditRef.add({
      npiNumber: npiNumber.substring(0, 10), // Sanitize
      success,
      details,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      ipAddress: 'redacted', // Would be populated from request context
      userAgent: 'system'
    });
  } catch (error) {
    console.error('Error logging auth attempt:', error);
  }
}

/**
 * Generate secure session token
 */
function generateSessionToken(npiNumber) {
  const crypto = require('crypto');
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const payload = `${npiNumber}-${timestamp}-${randomBytes}`;
  
  return crypto
    .createHash('sha256')
    .update(payload)
    .digest('hex');
}

/**
 * Create standardized response object
 */
function createResponse(success, message, data, statusCode) {
  return {
    success,
    message,
    data,
    statusCode,
    timestamp: new Date().toISOString()
  };
}

module.exports = { authenticateProvider };
