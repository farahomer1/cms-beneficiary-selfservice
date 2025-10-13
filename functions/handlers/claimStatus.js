/**
 * Claim Status Handler for CMS Beneficiary Self-Service
 * 
 * This module handles claim status lookups with:
 * - Claim number validation
 * - Firestore query for claim data
 * - Human-readable response formatting
 * - Error handling
 */

const admin = require('firebase-admin');

/**
 * Format a claim status response for the user
 */
function formatClaimResponse(claim) {
  const statusMessages = {
    'Approved': '✓ Approved',
    'Pending': '⏳ Pending',
    'Denied': '✗ Denied'
  };
  
  const statusDisplay = statusMessages[claim.status] || claim.status;
  
  let response = `**Claim ${claim.claimId}**\n\n`;
  response += `Status: ${statusDisplay}\n`;
  response += `Service Date: ${formatDate(claim.serviceDate)}\n`;
  response += `Provider: ${claim.provider.name}\n`;
  response += `Service: ${claim.description}\n\n`;
  
  if (claim.status === 'Approved') {
    response += `**Financial Details:**\n`;
    response += `• Billed Amount: $${claim.billedAmount.toFixed(2)}\n`;
    response += `• Approved Amount: $${claim.approvedAmount.toFixed(2)}\n`;
    response += `• Your Responsibility: $${claim.patientResponsibility.toFixed(2)}\n`;
    
    if (claim.paymentDate) {
      response += `• Payment Date: ${formatDate(claim.paymentDate)}\n`;
      response += `• Payment Amount: $${claim.paymentAmount.toFixed(2)}\n`;
    }
  } else if (claim.status === 'Pending') {
    response += `**Processing Information:**\n`;
    response += `• Submitted: ${formatDate(claim.submissionDate)}\n`;
    if (claim.notes) {
      response += `• Notes: ${claim.notes}\n`;
    }
  } else if (claim.status === 'Denied') {
    response += `**Denial Information:**\n`;
    if (claim.denialReason) {
      response += `• Reason: ${claim.denialReason}\n`;
    }
    if (claim.appealDeadline) {
      response += `• Appeal Deadline: ${formatDate(claim.appealDeadline)}\n`;
      response += `\nYou have the right to appeal this decision. Please contact us for assistance with the appeal process.\n`;
    }
  }
  
  return response;
}

/**
 * Format date string to readable format
 */
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Validate claim number format
 */
function validateClaimNumber(claimNumber) {
  if (!claimNumber || typeof claimNumber !== 'string') {
    return false;
  }
  
  // Expected format: CLM-YYYY-NNN
  const claimPattern = /^CLM-\d{4}-\d{3}$/;
  return claimPattern.test(claimNumber.trim());
}

/**
 * Handle claim status check request
 * 
 * @param {string} claimNumber - Claim number to look up
 * @param {Object} sessionInfo - Session information (optional)
 * @returns {Promise<Object>} Claim status response
 */
async function handleCheckClaimStatus(claimNumber, sessionInfo = {}) {
  try {
    // Validate claim number
    if (!claimNumber) {
      return {
        success: false,
        message: 'Please provide a claim number to check its status.'
      };
    }
    
    claimNumber = claimNumber.trim().toUpperCase();
    
    if (!validateClaimNumber(claimNumber)) {
      return {
        success: false,
        message: 'Invalid claim number format. Please use format: CLM-YYYY-NNN (e.g., CLM-2024-001)'
      };
    }
    
    // Query Firestore for claim
    const db = admin.firestore();
    const claimsRef = db.collection('claims');
    const snapshot = await claimsRef
      .where('claimId', '==', claimNumber)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return {
        success: false,
        message: `I couldn't find a claim with number ${claimNumber}. Please verify the claim number and try again. If you continue to have issues, please contact our support team.`
      };
    }
    
    const claimDoc = snapshot.docs[0];
    const claim = claimDoc.data();
    
    // If user is authenticated, verify the claim belongs to them
    if (sessionInfo.medicareId && claim.medicareId !== sessionInfo.medicareId) {
      return {
        success: false,
        message: 'This claim does not belong to your account. Please verify the claim number.'
      };
    }
    
    // Format and return claim information
    const formattedResponse = formatClaimResponse(claim);
    
    return {
      success: true,
      message: formattedResponse,
      claim: {
        claimId: claim.claimId,
        status: claim.status,
        serviceDate: claim.serviceDate,
        provider: claim.provider.name
      }
    };
    
  } catch (error) {
    console.error('Error checking claim status:', error.message);
    return {
      success: false,
      message: 'An error occurred while checking the claim status. Please try again or contact our support team for assistance.'
    };
  }
}

/**
 * Get recent claims for a beneficiary
 * 
 * @param {string} medicareId - Medicare ID
 * @param {number} limit - Number of claims to retrieve
 * @returns {Promise<Object>} Recent claims response
 */
async function getRecentClaims(medicareId, limit = 5) {
  try {
    if (!medicareId) {
      return {
        success: false,
        message: 'Medicare ID is required to retrieve claims.'
      };
    }
    
    const db = admin.firestore();
    const claimsRef = db.collection('claims');
    const snapshot = await claimsRef
      .where('medicareId', '==', medicareId)
      .orderBy('serviceDate', 'desc')
      .limit(limit)
      .get();
    
    if (snapshot.empty) {
      return {
        success: true,
        message: 'You have no claims on file.',
        claims: []
      };
    }
    
    const claims = [];
    snapshot.forEach(doc => {
      claims.push(doc.data());
    });
    
    let response = `Here are your ${claims.length} most recent claim(s):\n\n`;
    
    claims.forEach((claim, index) => {
      response += `${index + 1}. **${claim.claimId}** - ${claim.status}\n`;
      response += `   Service: ${claim.description}\n`;
      response += `   Date: ${formatDate(claim.serviceDate)}\n`;
      response += `   Provider: ${claim.provider.name}\n\n`;
    });
    
    response += 'To get detailed information about a specific claim, please provide the claim number.';
    
    return {
      success: true,
      message: response,
      claims: claims.map(c => ({
        claimId: c.claimId,
        status: c.status,
        serviceDate: c.serviceDate
      }))
    };
    
  } catch (error) {
    console.error('Error retrieving recent claims:', error.message);
    return {
      success: false,
      message: 'An error occurred while retrieving your claims. Please try again.'
    };
  }
}

module.exports = {
  handleCheckClaimStatus,
  getRecentClaims,
  validateClaimNumber,
  formatClaimResponse
};
