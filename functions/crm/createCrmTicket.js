/**
 * CRM Ticket Creation Function
 * Automatically creates support tickets in Firestore
 * Simulates integration with a CRM system
 */

const admin = require('firebase-admin');

/**
 * Create a new support ticket in the CRM system (Firestore)
 * @param {string} npiNumber - Provider's National Provider Identifier
 * @param {string} issueSummary - Brief description of the issue
 * @param {string} status - Ticket status (default: 'Open')
 * @param {Object} additionalData - Optional additional ticket data
 * @returns {Object} Created ticket details or error
 */
async function createCrmTicket(npiNumber, issueSummary, status = 'Open', additionalData = {}) {
  const startTime = Date.now();
  
  try {
    // Input validation
    if (!npiNumber || typeof npiNumber !== 'string') {
      return createErrorResponse('NPI number is required', 400);
    }

    if (!issueSummary || typeof issueSummary !== 'string' || issueSummary.trim().length === 0) {
      return createErrorResponse('Issue summary is required', 400);
    }

    // Clean and validate NPI
    const cleanNpi = npiNumber.replace(/\D/g, '');
    if (cleanNpi.length !== 10) {
      return createErrorResponse('Invalid NPI format. Must be 10 digits.', 400);
    }

    // Validate status
    const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return createErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }

    // Verify provider exists
    const providerInfo = await getProviderInfo(cleanNpi);
    if (!providerInfo) {
      return createErrorResponse('Provider not found', 404);
    }

    console.log(`Creating CRM ticket for provider ${cleanNpi}`);

    // Generate unique ticket ID
    const ticketId = generateTicketId();

    // Determine category and priority from issue summary
    const category = categorizeIssue(issueSummary);
    const priority = determinePriority(issueSummary);

    // Build ticket object
    const ticketData = {
      ticketId,
      npiNumber: cleanNpi,
      clinicName: providerInfo.clinicName,
      title: issueSummary.substring(0, 100), // Limit title length
      description: additionalData.description || issueSummary,
      category,
      priority,
      status,
      createdDate: admin.firestore.FieldValue.serverTimestamp(),
      resolvedDate: null,
      assignedAgent: null,
      resolution: null,
      source: additionalData.source || 'Phone Call',
      metadata: {
        createdBy: 'system',
        providerSpecialty: providerInfo.specialty,
        providerContact: providerInfo.phone,
        ...additionalData.metadata
      }
    };

    // Save to Firestore
    const db = admin.firestore();
    const ticketRef = db.collection('tickets').doc(ticketId);
    await ticketRef.set(ticketData);

    // Auto-assign agent based on category
    const assignedAgent = await autoAssignAgent(category);
    if (assignedAgent) {
      await ticketRef.update({ assignedAgent });
      ticketData.assignedAgent = assignedAgent;
    }

    // Log ticket creation for audit trail
    await logTicketCreation(ticketId, cleanNpi);

    // Send notifications (simulated)
    await sendTicketNotifications(ticketData);

    const responseTime = Date.now() - startTime;
    
    const result = {
      success: true,
      message: 'Ticket created successfully',
      ticket: {
        ticketId: ticketData.ticketId,
        npiNumber: ticketData.npiNumber,
        clinicName: ticketData.clinicName,
        title: ticketData.title,
        category: ticketData.category,
        priority: ticketData.priority,
        status: ticketData.status,
        assignedAgent: ticketData.assignedAgent,
        createdDate: new Date().toISOString()
      },
      metadata: {
        processingTimeMs: responseTime
      }
    };

    console.log(`Ticket ${ticketId} created successfully in ${responseTime}ms`);
    return result;

  } catch (error) {
    console.error('Error creating CRM ticket:', error);
    return createErrorResponse('Failed to create ticket', 500);
  }
}

/**
 * Get provider information from Firestore
 */
async function getProviderInfo(npiNumber) {
  const db = admin.firestore();
  
  try {
    const snapshot = await db.collection('providers')
      .where('npiNumber', '==', npiNumber)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    return snapshot.docs[0].data();
  } catch (error) {
    console.error('Error fetching provider info:', error);
    return null;
  }
}

/**
 * Generate unique ticket ID
 */
function generateTicketId() {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 9000) + 1000; // 4-digit random number
  return `TKT-${year}-${randomNum}`;
}

/**
 * Categorize issue based on keywords in summary
 */
function categorizeIssue(issueSummary) {
  const lowerSummary = issueSummary.toLowerCase();
  
  if (lowerSummary.includes('claim') || lowerSummary.includes('denial') || lowerSummary.includes('rejection')) {
    return 'Claims Processing';
  }
  if (lowerSummary.includes('billing') || lowerSummary.includes('payment') || lowerSummary.includes('reimbursement')) {
    return 'Billing';
  }
  if (lowerSummary.includes('coding') || lowerSummary.includes('icd') || lowerSummary.includes('cpt') || lowerSummary.includes('modifier')) {
    return 'Medical Coding';
  }
  if (lowerSummary.includes('coverage') || lowerSummary.includes('benefit') || lowerSummary.includes('authorization')) {
    return 'Coverage';
  }
  if (lowerSummary.includes('enroll') || lowerSummary.includes('registration') || lowerSummary.includes('credential')) {
    return 'Enrollment';
  }
  
  return 'General Inquiry';
}

/**
 * Determine priority based on urgency keywords
 */
function determinePriority(issueSummary) {
  const lowerSummary = issueSummary.toLowerCase();
  
  if (lowerSummary.includes('urgent') || 
      lowerSummary.includes('emergency') || 
      lowerSummary.includes('asap') ||
      lowerSummary.includes('critical')) {
    return 'High';
  }
  
  if (lowerSummary.includes('soon') || 
      lowerSummary.includes('important') ||
      lowerSummary.includes('need help')) {
    return 'Medium';
  }
  
  return 'Low';
}

/**
 * Auto-assign agent based on ticket category
 */
async function autoAssignAgent(category) {
  // Simulated agent assignment logic
  // In production, this would check agent availability and workload
  const agentPool = {
    'Claims Processing': ['Agent Sarah Williams', 'Agent Michael Chen'],
    'Billing': ['Agent Michael Chen', 'Agent Jennifer Lopez'],
    'Medical Coding': ['Agent Jennifer Lopez', 'Agent David Kim'],
    'Coverage': ['Agent David Kim', 'Agent Sarah Williams'],
    'Enrollment': ['Agent Michael Chen', 'Agent Jennifer Lopez'],
    'General Inquiry': ['Agent Sarah Williams', 'Agent David Kim']
  };

  const agents = agentPool[category] || agentPool['General Inquiry'];
  const selectedAgent = agents[Math.floor(Math.random() * agents.length)];
  
  return selectedAgent;
}

/**
 * Log ticket creation for audit trail
 */
async function logTicketCreation(ticketId, npiNumber) {
  const db = admin.firestore();
  
  try {
    await db.collection('ticketAuditLog').add({
      ticketId,
      npiNumber,
      action: 'created',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      performedBy: 'system'
    });
  } catch (error) {
    console.error('Error logging ticket creation:', error);
  }
}

/**
 * Send notifications about new ticket (simulated)
 */
async function sendTicketNotifications(ticketData) {
  // In production, this would send emails/SMS to agents and providers
  console.log(`[NOTIFICATION] New ticket ${ticketData.ticketId} created`);
  console.log(`[NOTIFICATION] Assigned to: ${ticketData.assignedAgent}`);
  console.log(`[NOTIFICATION] Priority: ${ticketData.priority}`);
  
  // Could integrate with:
  // - SendGrid for emails
  // - Twilio for SMS
  // - Slack for team notifications
  
  return Promise.resolve();
}

/**
 * Create error response object
 */
function createErrorResponse(message, statusCode) {
  return {
    success: false,
    error: message,
    statusCode,
    timestamp: new Date().toISOString()
  };
}

/**
 * Update existing ticket (bonus functionality)
 */
async function updateTicket(ticketId, updates) {
  const db = admin.firestore();
  
  try {
    const ticketRef = db.collection('tickets').doc(ticketId);
    const doc = await ticketRef.get();
    
    if (!doc.exists) {
      return createErrorResponse('Ticket not found', 404);
    }

    await ticketRef.update({
      ...updates,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      message: 'Ticket updated successfully',
      ticketId
    };

  } catch (error) {
    console.error('Error updating ticket:', error);
    return createErrorResponse('Failed to update ticket', 500);
  }
}

module.exports = { 
  createCrmTicket,
  updateTicket
};
