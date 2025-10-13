/**
 * Provider Search Handler for CMS Beneficiary Self-Service
 * 
 * This module handles provider searches with:
 * - Specialty validation and normalization
 * - Firestore query for provider data
 * - Formatted provider listings
 * - Filtering by availability and location
 */

const admin = require('firebase-admin');

/**
 * Format provider information for display
 */
function formatProviderListing(provider) {
  let listing = `**${provider.name}** ${provider.acceptingNewPatients ? '✓' : '✗'}\n`;
  listing += `${provider.practiceName}\n`;
  listing += `${provider.specialty.charAt(0).toUpperCase() + provider.specialty.slice(1)}\n`;
  listing += `${provider.address.street}, ${provider.address.city}, ${provider.address.state} ${provider.address.zipCode}\n`;
  listing += `📞 ${provider.phone}\n`;
  
  if (provider.rating) {
    listing += `⭐ ${provider.rating}/5.0 (${provider.reviews} reviews)\n`;
  }
  
  if (provider.languagesSpoken && provider.languagesSpoken.length > 0) {
    listing += `🗣️ Languages: ${provider.languagesSpoken.join(', ')}\n`;
  }
  
  if (provider.acceptingNewPatients) {
    listing += `✅ Accepting new patients\n`;
  } else {
    listing += `❌ Not accepting new patients\n`;
  }
  
  return listing;
}

/**
 * Normalize specialty input
 */
function normalizeSpecialty(specialty) {
  if (!specialty || typeof specialty !== 'string') {
    return null;
  }
  
  const normalized = specialty.toLowerCase().trim();
  
  // Map common variations to standard specialties
  const specialtyMap = {
    'primary care': 'primary care',
    'pcp': 'primary care',
    'general practitioner': 'primary care',
    'family doctor': 'primary care',
    'family medicine': 'primary care',
    'family physician': 'primary care',
    
    'cardiologist': 'cardiologist',
    'heart doctor': 'cardiologist',
    'cardiac': 'cardiologist',
    'cardiology': 'cardiologist',
    
    'dentist': 'dentist',
    'dental': 'dentist',
    'orthodontist': 'dentist',
    'oral surgeon': 'dentist',
    
    'dermatologist': 'dermatologist',
    'skin doctor': 'dermatologist',
    'dermatology': 'dermatologist',
    
    'endocrinologist': 'endocrinologist',
    'diabetes doctor': 'endocrinologist',
    'hormone specialist': 'endocrinologist',
    'endocrinology': 'endocrinologist',
    
    'gastroenterologist': 'gastroenterologist',
    'gi doctor': 'gastroenterologist',
    'digestive specialist': 'gastroenterologist',
    'gastroenterology': 'gastroenterologist',
    
    'neurologist': 'neurologist',
    'brain doctor': 'neurologist',
    'neurology': 'neurologist',
    
    'oncologist': 'oncologist',
    'cancer doctor': 'oncologist',
    'oncology': 'oncologist',
    
    'ophthalmologist': 'ophthalmologist',
    'eye doctor': 'ophthalmologist',
    'vision specialist': 'ophthalmologist',
    'ophthalmology': 'ophthalmologist',
    
    'orthopedist': 'orthopedist',
    'orthopedic surgeon': 'orthopedist',
    'bone doctor': 'orthopedist',
    'orthopedics': 'orthopedist',
    
    'psychiatrist': 'psychiatrist',
    'mental health doctor': 'psychiatrist',
    'psychiatry': 'psychiatrist',
    
    'pulmonologist': 'pulmonologist',
    'lung doctor': 'pulmonologist',
    'respiratory specialist': 'pulmonologist',
    'pulmonology': 'pulmonologist'
  };
  
  return specialtyMap[normalized] || specialty;
}

/**
 * Handle provider search request
 * 
 * @param {string} providerSpecialty - Specialty to search for
 * @param {Object} sessionInfo - Session information (optional)
 * @param {Object} filters - Search filters (acceptingNewPatients, location, etc.)
 * @returns {Promise<Object>} Provider search response
 */
async function handleFindProvider(providerSpecialty, sessionInfo = {}, filters = {}) {
  try {
    // Validate input
    if (!providerSpecialty) {
      return {
        success: false,
        message: 'Please specify what type of provider you\'re looking for. For example: primary care, cardiologist, dentist, or dermatologist.'
      };
    }
    
    // Normalize specialty
    const normalizedSpecialty = normalizeSpecialty(providerSpecialty);
    
    if (!normalizedSpecialty) {
      return {
        success: false,
        message: 'I didn\'t understand that specialty. Please try: primary care, cardiologist, dentist, dermatologist, or another medical specialty.'
      };
    }
    
    // Query Firestore for providers
    const db = admin.firestore();
    let providersRef = db.collection('providers')
      .where('specialty', '==', normalizedSpecialty);
    
    // Apply filters
    if (filters.acceptingNewPatients === true) {
      providersRef = providersRef.where('acceptingNewPatients', '==', true);
    }
    
    const snapshot = await providersRef.get();
    
    if (snapshot.empty) {
      return {
        success: false,
        message: `I couldn't find any ${normalizedSpecialty} providers in our directory. Please try a different specialty or contact our support team for assistance.`
      };
    }
    
    const providers = [];
    snapshot.forEach(doc => {
      providers.push(doc.data());
    });
    
    // Sort by rating (highest first), then by accepting new patients
    providers.sort((a, b) => {
      if (a.acceptingNewPatients !== b.acceptingNewPatients) {
        return a.acceptingNewPatients ? -1 : 1;
      }
      return (b.rating || 0) - (a.rating || 0);
    });
    
    // Format response
    let response = `I found ${providers.length} ${normalizedSpecialty} provider(s):\n\n`;
    
    providers.forEach((provider, index) => {
      response += `**${index + 1}. ${formatProviderListing(provider)}**\n\n`;
    });
    
    response += 'To schedule an appointment, please call the provider directly or contact our support team for assistance.';
    
    return {
      success: true,
      message: response,
      providers: providers.map(p => ({
        name: p.name,
        specialty: p.specialty,
        phone: p.phone,
        acceptingNewPatients: p.acceptingNewPatients
      }))
    };
    
  } catch (error) {
    console.error('Error searching for providers:', error.message);
    return {
      success: false,
      message: 'An error occurred while searching for providers. Please try again or contact our support team.'
    };
  }
}

/**
 * Get provider details by ID
 * 
 * @param {string} providerId - Provider ID
 * @returns {Promise<Object>} Provider details response
 */
async function getProviderDetails(providerId) {
  try {
    if (!providerId) {
      return {
        success: false,
        message: 'Provider ID is required.'
      };
    }
    
    const db = admin.firestore();
    const providersRef = db.collection('providers');
    const snapshot = await providersRef
      .where('providerId', '==', providerId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return {
        success: false,
        message: 'Provider not found.'
      };
    }
    
    const providerDoc = snapshot.docs[0];
    const provider = providerDoc.data();
    
    let response = formatProviderListing(provider);
    
    // Add office hours
    if (provider.officeHours) {
      response += '\n**Office Hours:**\n';
      for (const [day, hours] of Object.entries(provider.officeHours)) {
        response += `• ${day.charAt(0).toUpperCase() + day.slice(1)}: ${hours}\n`;
      }
    }
    
    return {
      success: true,
      message: response,
      provider: provider
    };
    
  } catch (error) {
    console.error('Error retrieving provider details:', error.message);
    return {
      success: false,
      message: 'An error occurred while retrieving provider details.'
    };
  }
}

module.exports = {
  handleFindProvider,
  getProviderDetails,
  normalizeSpecialty,
  formatProviderListing
};
