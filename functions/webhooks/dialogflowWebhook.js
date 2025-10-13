/**
 * Dialogflow CX Webhook Handler for CMS Beneficiary Self-Service
 * 
 * This module handles webhook requests from Dialogflow CX and routes them
 * to the appropriate handler functions.
 */

const { authenticateUser } = require('../auth/authenticateUser');
const { handleCheckClaimStatus, getRecentClaims } = require('../handlers/claimStatus');
const { handleAskAboutBenefits, getCoverageSummary } = require('../handlers/benefits');
const { handleFindProvider } = require('../handlers/providers');

/**
 * Create Dialogflow CX response
 */
function createDialogflowResponse(fulfillmentText, sessionParameters = {}) {
  return {
    fulfillmentResponse: {
      messages: [
        {
          text: {
            text: [fulfillmentText]
          }
        }
      ]
    },
    sessionInfo: {
      parameters: sessionParameters
    }
  };
}

/**
 * Handle Greeting intent
 */
async function handleGreeting(request) {
  const greeting = `Hello! Welcome to the CMS Beneficiary Self-Service portal. I'm here to help you with:

• Checking claim status
• Learning about your benefits
• Finding healthcare providers
• Getting connected to a support agent

How can I assist you today?`;

  return createDialogflowResponse(greeting);
}

/**
 * Handle Authenticate User intent
 */
async function handleAuthenticate(request) {
  const parameters = request.sessionInfo?.parameters || {};
  const medicareId = parameters.medicareID;
  const lastName = parameters.lastName;
  
  const result = await authenticateUser(medicareId, lastName);
  
  if (result.success) {
    const greeting = `Welcome back, ${result.beneficiary.firstName}! You've been successfully authenticated. How can I help you today?`;
    
    return createDialogflowResponse(greeting, {
      authenticated: true,
      medicareId: result.beneficiary.medicareId,
      firstName: result.beneficiary.firstName,
      lastName: result.beneficiary.lastName,
      coverageType: result.beneficiary.coverageType,
      sessionToken: result.sessionToken
    });
  } else {
    return createDialogflowResponse(result.message);
  }
}

/**
 * Handle Check Claim Status intent
 */
async function handleClaimStatus(request) {
  const parameters = request.sessionInfo?.parameters || {};
  const claimNumber = parameters.claimNumber;
  const sessionInfo = {
    medicareId: parameters.medicareId
  };
  
  const result = await handleCheckClaimStatus(claimNumber, sessionInfo);
  return createDialogflowResponse(result.message);
}

/**
 * Handle Ask About Benefits intent
 */
async function handleBenefits(request) {
  const parameters = request.sessionInfo?.parameters || {};
  const benefitType = parameters.benefitType;
  const sessionInfo = {
    coverageType: parameters.coverageType
  };
  
  const result = await handleAskAboutBenefits(benefitType, sessionInfo);
  return createDialogflowResponse(result.message);
}

/**
 * Handle Find Provider intent
 */
async function handleProvider(request) {
  const parameters = request.sessionInfo?.parameters || {};
  const providerSpecialty = parameters.providerSpecialty;
  
  const result = await handleFindProvider(providerSpecialty);
  return createDialogflowResponse(result.message);
}

/**
 * Handle Agent Escalation intent
 */
async function handleEscalation(request) {
  const message = `I understand you'd like to speak with a support agent. Let me connect you now.

**CMS Support:**
📞 Phone: 1-800-MEDICARE (1-800-633-4227)
⏰ Available 24/7
🗣️ TTY: 1-877-486-2048

An agent will be with you shortly to assist with your inquiry. Is there anything else I can help you with while you wait?`;

  return createDialogflowResponse(message);
}

/**
 * Handle Goodbye intent
 */
async function handleGoodbye(request) {
  const message = `Thank you for using the CMS Beneficiary Self-Service portal. Have a great day!

If you need assistance in the future, feel free to return anytime. Stay healthy! 👋`;

  return createDialogflowResponse(message);
}

/**
 * Main webhook handler
 */
async function handleWebhook(request) {
  try {
    // Get the intent tag from the request
    const tag = request.fulfillmentInfo?.tag;
    
    console.log('Received webhook request with tag:', tag);
    
    // Route to appropriate handler based on tag
    switch (tag) {
      case 'greeting':
        return await handleGreeting(request);
      
      case 'authenticate':
        return await handleAuthenticate(request);
      
      case 'check_claim_status':
        return await handleClaimStatus(request);
      
      case 'ask_about_benefits':
        return await handleBenefits(request);
      
      case 'find_provider':
        return await handleProvider(request);
      
      case 'escalate_to_agent':
        return await handleEscalation(request);
      
      case 'goodbye':
        return await handleGoodbye(request);
      
      default:
        console.warn('Unknown intent tag:', tag);
        return createDialogflowResponse(
          'I\'m not sure how to help with that. Could you please rephrase your question?'
        );
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return createDialogflowResponse(
      'I encountered an error processing your request. Please try again or contact our support team.'
    );
  }
}

module.exports = {
  handleWebhook,
  createDialogflowResponse
};
