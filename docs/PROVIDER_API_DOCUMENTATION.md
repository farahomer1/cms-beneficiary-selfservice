# Provider Agent Assist API Documentation

## Overview

This documentation covers the Provider Agent Assist APIs implemented for Use Case 2. These APIs enable real-time agent assistance for healthcare providers calling CMS support.

## Base URL

**Production:** `https://us-central1-faomeroct10.cloudfunctions.net`

**Local Development:** `http://localhost:5001/faomeroct10/us-central1`

---

## Authentication

### Provider Authentication API

Authenticates healthcare providers using their National Provider Identifier (NPI).

**Endpoint:** `POST /authenticateProviderApi`

**Request Body:**
```json
{
  "npiNumber": "1234567890"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Authentication successful",
  "data": {
    "npiNumber": "1234567890",
    "clinicName": "Springfield Medical Center",
    "contactPerson": "Dr. Sarah Johnson",
    "specialty": "Primary Care",
    "address": {
      "city": "Springfield",
      "state": "IL"
    },
    "enrollmentDate": "2020-01-15",
    "authenticated": true,
    "sessionToken": "a1b2c3d4e5f6..."
  },
  "statusCode": 200,
  "timestamp": "2024-10-13T19:30:00.000Z"
}
```

**Error Responses:**

- **400 Bad Request** - Invalid NPI format
```json
{
  "success": false,
  "message": "NPI must be exactly 10 digits",
  "data": null,
  "statusCode": 400,
  "timestamp": "2024-10-13T19:30:00.000Z"
}
```

- **404 Not Found** - Provider not in system
```json
{
  "success": false,
  "message": "Provider not found. Please verify your NPI number.",
  "data": null,
  "statusCode": 404,
  "timestamp": "2024-10-13T19:30:00.000Z"
}
```

- **429 Too Many Requests** - Rate limit exceeded
```json
{
  "success": false,
  "message": "Too many authentication attempts. Please try again in 15 minutes",
  "data": null,
  "statusCode": 429,
  "timestamp": "2024-10-13T19:30:00.000Z"
}
```

**Security Features:**
- Rate limiting: 5 attempts per 15-minute window
- Audit logging for HIPAA compliance
- Failed attempt tracking
- Secure session token generation

---

## Agent Assist

### Generate Agent Assist Data API

Generates real-time assistance data for call center agents, including conversation summary, knowledge base articles, and past ticket history.

**Endpoint:** `POST /generateAgentAssistDataApi`

**Request Body:**
```json
{
  "transcript": "Hello, I'm calling about a claim denial. My claim CLM-2024-001 was rejected with code CO-16. I need help understanding what documentation is missing.",
  "providerId": "1234567890"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "providerId": "1234567890",
  "providerName": "Springfield Medical Center",
  "summary": "Springfield Medical Center (Primary Care) is calling regarding claim denial. Specific claims mentioned: CLM-2024-001. Provider is seeking guidance on proper procedures and documentation requirements.",
  "suggestedArticles": [
    {
      "id": "KB001",
      "title": "Understanding Medicare Claim Denial Codes",
      "topic": "Billing",
      "category": "Claims Processing",
      "summary": "Medicare claim denials are categorized by specific codes that indicate the reason for rejection. Common denial codes include CO-16 (Claim lacks information)...",
      "score": 15
    },
    {
      "id": "KB002",
      "title": "ICD-10 Coding Best Practices for Medicare Claims",
      "topic": "Coding",
      "category": "Medical Coding",
      "summary": "Accurate ICD-10 coding is essential for Medicare claim approval and appropriate reimbursement...",
      "score": 8
    }
  ],
  "pastTickets": [
    {
      "ticketId": "TKT-2024-002",
      "title": "Claim denial - CO-16 missing information",
      "category": "Claims Processing",
      "status": "Resolved",
      "createdDate": "2024-08-22T09:15:00Z",
      "resolvedDate": "2024-08-25T16:20:00Z",
      "priority": "High"
    },
    {
      "ticketId": "TKT-2024-001",
      "title": "Question about Medicare Part B billing for telehealth services",
      "category": "Billing",
      "status": "Resolved",
      "createdDate": "2024-09-15T10:30:00Z",
      "resolvedDate": "2024-09-20T14:45:00Z",
      "priority": "Medium"
    }
  ],
  "metadata": {
    "generatedAt": "2024-10-13T19:30:00.000Z",
    "processingTimeMs": 245,
    "transcriptLength": 156
  }
}
```

**Error Responses:**

- **400 Bad Request** - Missing required parameters
```json
{
  "success": false,
  "error": "Transcript is required and must not be empty",
  "statusCode": 400,
  "timestamp": "2024-10-13T19:30:00.000Z"
}
```

- **404 Not Found** - Provider not found
```json
{
  "success": false,
  "error": "Provider not found",
  "statusCode": 404,
  "timestamp": "2024-10-13T19:30:00.000Z"
}
```

**AI Features:**
- Gemini AI-powered conversation summarization
- Intelligent keyword extraction
- Relevance-based knowledge base search
- Historical context from past tickets

---

## CRM Integration

### Create CRM Ticket API

Automatically creates support tickets in the CRM system (Firestore).

**Endpoint:** `POST /createCrmTicketApi`

**Request Body:**
```json
{
  "npiNumber": "1234567890",
  "issueSummary": "Provider needs clarification on incident-to billing rules for nurse practitioner services",
  "status": "Open",
  "additionalData": {
    "description": "Detailed description of the issue...",
    "source": "Phone Call",
    "metadata": {
      "urgency": "Medium",
      "preferredContactMethod": "Email"
    }
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Ticket created successfully",
  "ticket": {
    "ticketId": "TKT-2024-5234",
    "npiNumber": "1234567890",
    "clinicName": "Springfield Medical Center",
    "title": "Provider needs clarification on incident-to billing rules for nurse practitioner services",
    "category": "Billing",
    "priority": "Medium",
    "status": "Open",
    "assignedAgent": "Agent Michael Chen",
    "createdDate": "2024-10-13T19:30:00.000Z"
  },
  "metadata": {
    "processingTimeMs": 187
  }
}
```

**Error Responses:**

- **400 Bad Request** - Invalid parameters
```json
{
  "success": false,
  "error": "NPI number and issue summary are required",
  "statusCode": 400,
  "timestamp": "2024-10-13T19:30:00.000Z"
}
```

**Features:**
- Automatic categorization based on issue keywords
- Smart priority assignment
- Auto-assignment to specialized agents
- Audit trail logging
- Notification system (simulated)

---

## Testing

### Test Provider NPIs

Use these NPIs for testing:

| NPI | Clinic Name | Specialty |
|-----|-------------|-----------|
| 1234567890 | Springfield Medical Center | Primary Care |
| 2345678901 | Riverside Cardiology Associates | Cardiology |
| 3456789012 | Metro Orthopedic Group | Orthopedic Surgery |
| 4567890123 | Sunset Pediatric Clinic | Pediatrics |
| 5678901234 | Coastal Dermatology Center | Dermatology |

### Sample Test Transcripts

**Claim Denial Issue:**
```
Hello, I'm Dr. Johnson calling from Springfield Medical Center. My NPI is 1234567890. 
I'm calling about claim CLM-2024-001 that was denied with code CO-16. The claim was for 
a Medicare Part B service, and I need to understand what documentation is missing so I 
can resubmit it correctly.
```

**Billing Policy Question:**
```
Hi, this is Dr. Chen from Riverside Cardiology, NPI 2345678901. I have a question 
about incident-to billing. When one of our nurse practitioners sees an established 
patient, can we bill under my NPI at 100% or do we need to bill under the NP's NPI at 85%? 
What are the supervision requirements?
```

### Example cURL Commands

**Authenticate Provider:**
```bash
curl -X POST https://us-central1-faomeroct10.cloudfunctions.net/authenticateProviderApi \
  -H "Content-Type: application/json" \
  -d '{"npiNumber": "1234567890"}'
```

**Generate Agent Assist Data:**
```bash
curl -X POST https://us-central1-faomeroct10.cloudfunctions.net/generateAgentAssistDataApi \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "I have a claim denial for CLM-2024-001 with code CO-16",
    "providerId": "1234567890"
  }'
```

**Create CRM Ticket:**
```bash
curl -X POST https://us-central1-faomeroct10.cloudfunctions.net/createCrmTicketApi \
  -H "Content-Type: application/json" \
  -d '{
    "npiNumber": "1234567890",
    "issueSummary": "Question about billing policies",
    "status": "Open"
  }'
```

---

## Integration with Dialogflow CX

### Webhook Configuration

Configure Dialogflow CX webhooks to call these functions:

1. **ProviderAuthentication Intent** → Call `authenticateProviderApi`
2. **CheckClaimStatusCode Intent** → Use existing claim lookup + generate agent assist
3. **PolicyQuestion Intent** → Search knowledge base via agent assist
4. **RequestLiveAgent Intent** → Call `createCrmTicketApi` + `generateAgentAssistDataApi`

### Session Parameters

Store these in Dialogflow CX session:

```javascript
{
  "providerId": "1234567890",
  "providerName": "Springfield Medical Center",
  "authenticationSuccess": true,
  "sessionToken": "...",
  "agentAssistData": { /* cached assist data */ }
}
```

---

## Error Handling

All APIs follow consistent error response format:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "statusCode": 400,
  "timestamp": "2024-10-13T19:30:00.000Z"
}
```

### Common Error Codes

- `MISSING_NPI` - NPI number not provided
- `MISSING_PARAMETERS` - Required parameters missing
- `INVALID_NPI_FORMAT` - NPI is not 10 digits
- `PROVIDER_NOT_FOUND` - Provider not in system
- `RATE_LIMIT_EXCEEDED` - Too many authentication attempts
- `INTERNAL_ERROR` - Server error

---

## Rate Limits

- **Authentication API:** 5 requests per 15 minutes per NPI
- **Agent Assist API:** 60 requests per minute per provider
- **CRM Ticket API:** 10 tickets per hour per provider

---

## Security & Compliance

### HIPAA Compliance

- All API calls are logged for audit purposes
- No PHI/PII in logs (redacted)
- Encrypted data in transit (HTTPS)
- Encrypted data at rest (Firestore)
- Session tokens expire after 24 hours

### Authentication Flow

1. Provider calls with NPI
2. System validates NPI format
3. Check rate limits
4. Query Firestore for provider
5. Validate status (must be "Active")
6. Generate secure session token
7. Log authentication attempt
8. Return provider info + token

---

## Support

For API issues or questions:
- Email: api-support@cms.gov
- Documentation: https://docs.cms.gov/provider-api
- Status Page: https://status.cms.gov

---

## Changelog

### Version 2.0.0 (2024-10-13)
- Added Provider Authentication API
- Added Agent Assist Data Generation API
- Added CRM Ticket Creation API
- Integrated Gemini AI for summarization
- Implemented rate limiting and audit logging

### Version 1.0.0 (2024-09-15)
- Initial release with Beneficiary Self-Service APIs
