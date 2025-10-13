/**
 * Benefits Handler for CMS Beneficiary Self-Service
 * 
 * This module handles benefit inquiries with:
 * - Benefit type validation
 * - Firestore query for benefit information
 * - Detailed, human-readable responses
 * - Coverage details and cost-sharing information
 */

const admin = require('firebase-admin');

/**
 * Format benefit information for user-friendly display
 */
function formatBenefitResponse(benefit) {
  let response = `**${benefit.displayName}**\n\n`;
  response += `${benefit.description}\n\n`;
  
  // Coverage details
  if (benefit.coverage) {
    response += `**Coverage Details:**\n\n`;
    
    for (const [key, value] of Object.entries(benefit.coverage)) {
      if (typeof value === 'object' && value.description) {
        response += `• **${formatKey(key)}:** ${value.description}\n`;
        
        // Cost sharing information
        if (value.costSharing) {
          formatCostSharing(value.costSharing, response);
        }
        
        response += '\n';
      }
    }
  }
  
  // Eligibility
  if (benefit.eligibility) {
    response += `**Eligibility:** ${benefit.eligibility}\n\n`;
  }
  
  // Premium information
  if (benefit.premium) {
    response += `**Premium:** ${benefit.premium}\n\n`;
  }
  
  // Late enrollment penalty
  if (benefit.lateEnrollmentPenalty) {
    response += `**Important:** ${benefit.lateEnrollmentPenalty}\n\n`;
  }
  
  // Enrollment information
  if (benefit.enrollment) {
    response += `**Enrollment:** ${benefit.enrollment}\n\n`;
  }
  
  // Recommendation
  if (benefit.recommendation) {
    response += `**💡 Recommendation:** ${benefit.recommendation}\n`;
  }
  
  return response;
}

/**
 * Format cost sharing information
 */
function formatCostSharing(costSharing, response) {
  if (costSharing.deductible) {
    response += `  - Deductible: ${costSharing.deductible}\n`;
  }
  if (costSharing.coinsurance) {
    if (Array.isArray(costSharing.coinsurance)) {
      costSharing.coinsurance.forEach(item => {
        response += `  - ${item}\n`;
      });
    } else {
      response += `  - Coinsurance: ${costSharing.coinsurance}\n`;
    }
  }
  if (costSharing.copayment) {
    response += `  - Copayment: ${costSharing.copayment}\n`;
  }
  if (costSharing.cost) {
    response += `  - Cost: ${costSharing.cost}\n`;
  }
}

/**
 * Format object key to human-readable string
 */
function formatKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Normalize benefit type input
 */
function normalizeBenefitType(benefitType) {
  if (!benefitType || typeof benefitType !== 'string') {
    return null;
  }
  
  const normalized = benefitType.toLowerCase().trim();
  
  // Map common variations to standard benefit types
  const benefitMap = {
    'part a': 'Part A',
    'parta': 'Part A',
    'part-a': 'Part A',
    'hospital': 'Part A',
    'hospital insurance': 'Part A',
    
    'part b': 'Part B',
    'partb': 'Part B',
    'part-b': 'Part B',
    'medical': 'Part B',
    'medical insurance': 'Part B',
    
    'part c': 'Part C',
    'partc': 'Part C',
    'part-c': 'Part C',
    'advantage': 'Part C',
    'medicare advantage': 'Part C',
    'ma': 'Part C',
    
    'part d': 'Part D',
    'partd': 'Part D',
    'part-d': 'Part D',
    'drug': 'Part D',
    'prescription': 'Part D',
    'prescription drug': 'Part D',
    
    'dental': 'dental',
    'teeth': 'dental',
    'dentist': 'dental',
    
    'vision': 'vision',
    'eye': 'vision',
    'eyes': 'vision',
    'glasses': 'vision',
    'eyeglasses': 'vision',
    
    'hearing': 'hearing',
    'hearing aid': 'hearing',
    'hearing aids': 'hearing'
  };
  
  return benefitMap[normalized] || benefitType;
}

/**
 * Handle benefit inquiry request
 * 
 * @param {string} benefitType - Type of benefit to look up
 * @param {Object} sessionInfo - Session information (optional)
 * @returns {Promise<Object>} Benefit information response
 */
async function handleAskAboutBenefits(benefitType, sessionInfo = {}) {
  try {
    // Validate input
    if (!benefitType) {
      return {
        success: false,
        message: 'Please specify which benefit you would like to learn about. For example: Part A, Part B, Part D, dental, or vision.'
      };
    }
    
    // Normalize benefit type
    const normalizedType = normalizeBenefitType(benefitType);
    
    if (!normalizedType) {
      return {
        success: false,
        message: 'I didn\'t understand that benefit type. Please try: Part A, Part B, Part C, Part D, dental, vision, or hearing.'
      };
    }
    
    // Query Firestore for benefit information
    const db = admin.firestore();
    const benefitsRef = db.collection('benefits');
    const snapshot = await benefitsRef
      .where('benefitType', '==', normalizedType)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return {
        success: false,
        message: `I couldn't find information about "${benefitType}". Please try: Part A, Part B, Part C, Part D, dental, vision, or hearing.`
      };
    }
    
    const benefitDoc = snapshot.docs[0];
    const benefit = benefitDoc.data();
    
    // If user is authenticated, personalize response based on their coverage
    let personalNote = '';
    if (sessionInfo.coverageType && Array.isArray(sessionInfo.coverageType)) {
      if (sessionInfo.coverageType.includes(normalizedType)) {
        personalNote = `\n**✓ You have ${normalizedType} coverage.**\n\n`;
      } else {
        personalNote = `\n**Note:** You don't currently have ${normalizedType} coverage. `;
        if (normalizedType === 'Part C' || normalizedType === 'Part D') {
          personalNote += 'You may be able to enroll during the Annual Enrollment Period.\n\n';
        } else {
          personalNote += 'Contact us to learn about adding this coverage.\n\n';
        }
      }
    }
    
    // Format and return benefit information
    const formattedResponse = personalNote + formatBenefitResponse(benefit);
    
    return {
      success: true,
      message: formattedResponse,
      benefitType: normalizedType
    };
    
  } catch (error) {
    console.error('Error retrieving benefit information:', error.message);
    return {
      success: false,
      message: 'An error occurred while retrieving benefit information. Please try again or contact our support team.'
    };
  }
}

/**
 * Get coverage summary for a beneficiary
 * 
 * @param {Array} coverageTypes - Array of coverage types
 * @returns {Promise<Object>} Coverage summary response
 */
async function getCoverageSummary(coverageTypes) {
  try {
    if (!coverageTypes || !Array.isArray(coverageTypes) || coverageTypes.length === 0) {
      return {
        success: false,
        message: 'No coverage information available.'
      };
    }
    
    let response = '**Your Coverage Summary:**\n\n';
    
    coverageTypes.forEach(type => {
      response += `✓ ${type}\n`;
    });
    
    response += '\nTo learn more about any specific coverage type, just ask! For example: "Tell me about Part A" or "What does my dental coverage include?"';
    
    return {
      success: true,
      message: response,
      coverageTypes: coverageTypes
    };
    
  } catch (error) {
    console.error('Error generating coverage summary:', error.message);
    return {
      success: false,
      message: 'An error occurred while retrieving your coverage summary.'
    };
  }
}

module.exports = {
  handleAskAboutBenefits,
  getCoverageSummary,
  normalizeBenefitType,
  formatBenefitResponse
};
