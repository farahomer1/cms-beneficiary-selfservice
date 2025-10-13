/**
 * Agent Assist Data Generation Function
 * Uses Gemini AI to provide real-time assistance to call center agents
 * Includes: conversation summarization, knowledge base search, ticket history
 */

const admin = require('firebase-admin');

/**
 * Generate comprehensive agent assist data for a provider call
 * @param {string} transcript - Conversation transcript text
 * @param {string} providerId - NPI number of the calling provider
 * @returns {Object} Agent assist data including summary, articles, and past tickets
 */
async function generateAgentAssistData(transcript, providerId) {
  const startTime = Date.now();
  
  try {
    // Input validation
    if (!transcript || typeof transcript !== 'string' || transcript.trim().length === 0) {
      return createErrorResponse('Transcript is required and must not be empty', 400);
    }

    if (!providerId || typeof providerId !== 'string') {
      return createErrorResponse('Provider ID (NPI) is required', 400);
    }

    // Clean provider ID
    const cleanNpi = providerId.replace(/\D/g, '');
    if (cleanNpi.length !== 10) {
      return createErrorResponse('Invalid NPI format', 400);
    }

    // Verify provider exists
    const providerInfo = await verifyProvider(cleanNpi);
    if (!providerInfo) {
      return createErrorResponse('Provider not found', 404);
    }

    console.log(`Generating agent assist data for provider ${cleanNpi}`);

    // Execute all three tasks in parallel for performance
    const [summary, suggestedArticles, pastTickets] = await Promise.all([
      generateSummaryWithGemini(transcript, providerInfo),
      searchKnowledgeBase(transcript),
      fetchPastTickets(cleanNpi)
    ]);

    const responseTime = Date.now() - startTime;
    
    const result = {
      success: true,
      providerId: cleanNpi,
      providerName: providerInfo.clinicName,
      summary,
      suggestedArticles,
      pastTickets,
      metadata: {
        generatedAt: new Date().toISOString(),
        processingTimeMs: responseTime,
        transcriptLength: transcript.length
      }
    };

    console.log(`Agent assist data generated in ${responseTime}ms`);
    return result;

  } catch (error) {
    console.error('Error generating agent assist data:', error);
    return createErrorResponse('Failed to generate agent assist data', 500);
  }
}

/**
 * Verify provider exists in Firestore
 */
async function verifyProvider(npiNumber) {
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
    console.error('Error verifying provider:', error);
    return null;
  }
}

/**
 * Generate conversation summary using Gemini AI
 * Note: In production, this would make an actual API call to Gemini
 * For this prototype, we'll use intelligent parsing of the transcript
 */
async function generateSummaryWithGemini(transcript, providerInfo) {
  try {
    // Simulate Gemini AI processing
    // In production, you would call the Gemini API here:
    // const { GoogleGenerativeAI } = require('@google/generative-ai');
    // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `You are an AI assistant for CMS call center agents. Analyze the following conversation transcript and provide a concise, professional summary (2-3 sentences) focusing on:
1. The provider's main issue or concern
2. Key details mentioned (claim numbers, dates, specific problems)
3. Urgency level and any action items

Provider: ${providerInfo.clinicName} (${providerInfo.specialty})
Transcript:
${transcript}

Summary:`;

    // For this prototype, generate intelligent summary based on keywords
    const summary = generateIntelligentSummary(transcript, providerInfo);
    
    return summary;

  } catch (error) {
    console.error('Error generating summary:', error);
    return 'Unable to generate summary. Please review the full transcript.';
  }
}

/**
 * Intelligent summary generation based on transcript analysis
 */
function generateIntelligentSummary(transcript, providerInfo) {
  const lowerTranscript = transcript.toLowerCase();
  const issues = [];
  
  // Detect main topics
  if (lowerTranscript.includes('claim') && (lowerTranscript.includes('denied') || lowerTranscript.includes('rejection'))) {
    issues.push('claim denial');
  }
  if (lowerTranscript.includes('billing') || lowerTranscript.includes('reimbursement')) {
    issues.push('billing issue');
  }
  if (lowerTranscript.includes('coding') || lowerTranscript.includes('icd') || lowerTranscript.includes('cpt')) {
    issues.push('coding question');
  }
  if (lowerTranscript.includes('prior authorization') || lowerTranscript.includes('pre-authorization')) {
    issues.push('prior authorization');
  }
  if (lowerTranscript.includes('telehealth') || lowerTranscript.includes('remote')) {
    issues.push('telehealth services');
  }

  // Extract claim numbers
  const claimMatches = transcript.match(/CLM-\d{4}-\d{3}/g) || [];
  
  // Determine urgency
  const isUrgent = lowerTranscript.includes('urgent') || 
                   lowerTranscript.includes('emergency') ||
                   lowerTranscript.includes('asap');

  // Build summary
  let summary = `${providerInfo.clinicName} (${providerInfo.specialty}) is calling regarding `;
  
  if (issues.length > 0) {
    summary += issues.join(' and ') + '.';
  } else {
    summary += 'a general Medicare policy inquiry.';
  }
  
  if (claimMatches.length > 0) {
    summary += ` Specific claims mentioned: ${claimMatches.slice(0, 2).join(', ')}.`;
  }
  
  if (isUrgent) {
    summary += ' **URGENT** - Provider indicates time-sensitive issue requiring immediate attention.';
  } else {
    summary += ' Provider is seeking guidance on proper procedures and documentation requirements.';
  }

  return summary;
}

/**
 * Search knowledge base for relevant articles based on transcript keywords
 */
async function searchKnowledgeBase(transcript) {
  const db = admin.firestore();
  
  try {
    // Get all knowledge base articles
    const snapshot = await db.collection('knowledgeBase').get();
    
    if (snapshot.empty) {
      return [];
    }

    // Extract keywords from transcript
    const keywords = extractKeywords(transcript);
    
    // Score each article based on keyword matches
    const scoredArticles = snapshot.docs.map(doc => {
      const article = doc.data();
      let score = 0;
      
      // Check keywords
      keywords.forEach(keyword => {
        if (article.keywords && article.keywords.some(kw => 
          kw.toLowerCase().includes(keyword) || keyword.includes(kw.toLowerCase())
        )) {
          score += 3;
        }
        
        // Check title and content
        const searchText = `${article.title} ${article.content}`.toLowerCase();
        if (searchText.includes(keyword)) {
          score += 1;
        }
      });
      
      return {
        id: article.id,
        title: article.title,
        topic: article.topic,
        category: article.category,
        summary: article.content.substring(0, 200) + '...',
        score
      };
    });

    // Return top 2 articles
    return scoredArticles
      .filter(article => article.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

  } catch (error) {
    console.error('Error searching knowledge base:', error);
    return [];
  }
}

/**
 * Extract relevant keywords from transcript
 */
function extractKeywords(transcript) {
  const lowerTranscript = transcript.toLowerCase();
  const keywords = new Set();
  
  // Common CMS-related keywords
  const keywordList = [
    'denial', 'claim', 'billing', 'coding', 'icd-10', 'cpt',
    'modifier', 'telehealth', 'prior authorization', 'part b',
    'part a', 'part d', 'medicare advantage', 'incident-to',
    'abn', 'global surgery', 'msp', 'npi', 'enrollment',
    'appeal', 'documentation', 'reimbursement', 'coverage'
  ];
  
  keywordList.forEach(keyword => {
    if (lowerTranscript.includes(keyword)) {
      keywords.add(keyword);
    }
  });
  
  return Array.from(keywords);
}

/**
 * Fetch past tickets for the provider
 */
async function fetchPastTickets(npiNumber) {
  const db = admin.firestore();
  
  try {
    const snapshot = await db.collection('tickets')
      .where('npiNumber', '==', npiNumber)
      .orderBy('createdDate', 'desc')
      .limit(3)
      .get();
    
    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map(doc => {
      const ticket = doc.data();
      return {
        ticketId: ticket.ticketId,
        title: ticket.title,
        category: ticket.category,
        status: ticket.status,
        createdDate: ticket.createdDate,
        resolvedDate: ticket.resolvedDate,
        priority: ticket.priority
      };
    });

  } catch (error) {
    console.error('Error fetching past tickets:', error);
    return [];
  }
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

module.exports = { generateAgentAssistData };
