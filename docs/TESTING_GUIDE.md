# Testing Guide for Use Case 2: Provider Agent Assist

## Quick Start

Once Firebase Functions are deployed, you can test the Provider Agent Assist APIs in three ways:

### Method 1: Using the Test Script (Easiest)

```bash
# Make the script executable
chmod +x test-provider-apis.sh

# Run all tests
./test-provider-apis.sh
```

### Method 2: Using cURL Commands

```bash
# Test 1: Authenticate Provider
curl -X POST https://us-central1-faomeroct10.cloudfunctions.net/authenticateProviderApi \
  -H "Content-Type: application/json" \
  -d '{"npiNumber": "1234567890"}'

# Test 2: Generate Agent Assist Data
curl -X POST https://us-central1-faomeroct10.cloudfunctions.net/generateAgentAssistDataApi \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "I have a claim denial for CLM-2024-001 with code CO-16",
    "providerId": "1234567890"
  }'

# Test 3: Create CRM Ticket
curl -X POST https://us-central1-faomeroct10.cloudfunctions.net/createCrmTicketApi \
  -H "Content-Type: application/json" \
  -d '{
    "npiNumber": "1234567890",
    "issueSummary": "Question about billing policies"
  }'
```

### Method 3: Using Postman or Similar Tools

Import these as requests:

1. **POST** `https://us-central1-faomeroct10.cloudfunctions.net/authenticateProviderApi`
2. **POST** `https://us-central1-faomeroct10.cloudfunctions.net/generateAgentAssistDataApi`
3. **POST** `https://us-central1-faomeroct10.cloudfunctions.net/createCrmTicketApi`

---

## Test Scenarios

### Scenario 1: Successful Provider Authentication

**Request:**
```json
{
  "npiNumber": "1234567890"
}
```

**Expected Response:**
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
    "authenticated": true,
    "sessionToken": "..."
  }
}
```

### Scenario 2: Failed Authentication (Invalid NPI)

**Request:**
```json
{
  "npiNumber": "9999999999"
}
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Provider not found. Please verify your NPI number."
}
```

### Scenario 3: Agent Assist with Claim Denial

**Request:**
```json
{
  "transcript": "Hello, I'm Dr. Johnson from Springfield Medical Center. My NPI is 1234567890. I'm calling about claim CLM-2024-001 that was denied with code CO-16. The claim was for a Medicare Part B service, and I need to understand what documentation is missing so I can resubmit it correctly. This is urgent.",
  "providerId": "1234567890"
}
```

**Expected Response:**
```json
{
  "success": true,
  "providerId": "1234567890",
  "providerName": "Springfield Medical Center",
  "summary": "Springfield Medical Center (Primary Care) is calling regarding claim denial. Specific claims mentioned: CLM-2024-001. **URGENT** - Provider indicates time-sensitive issue requiring immediate attention.",
  "suggestedArticles": [
    {
      "id": "KB001",
      "title": "Understanding Medicare Claim Denial Codes",
      "topic": "Billing",
      "category": "Claims Processing"
    }
  ],
  "pastTickets": [
    {
      "ticketId": "TKT-2024-002",
      "title": "Claim denial - CO-16 missing information",
      "status": "Resolved"
    }
  ]
}
```

### Scenario 4: Create Support Ticket

**Request:**
```json
{
  "npiNumber": "1234567890",
  "issueSummary": "Provider needs clarification on incident-to billing rules for nurse practitioner services",
  "status": "Open"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Ticket created successfully",
  "ticket": {
    "ticketId": "TKT-2024-xxxx",
    "npiNumber": "1234567890",
    "clinicName": "Springfield Medical Center",
    "title": "Provider needs clarification on incident-to billing...",
    "category": "Billing",
    "priority": "Medium",
    "assignedAgent": "Agent Michael Chen"
  }
}
```

---

## Available Test Data

### Test Provider NPIs

| NPI | Clinic Name | Specialty | Use Case |
|-----|-------------|-----------|----------|
| 1234567890 | Springfield Medical Center | Primary Care | General testing |
| 2345678901 | Riverside Cardiology Associates | Cardiology | Specialty testing |
| 3456789012 | Metro Orthopedic Group | Orthopedic Surgery | Surgery-related |
| 4567890123 | Sunset Pediatric Clinic | Pediatrics | Pediatric cases |
| 5678901234 | Coastal Dermatology Center | Dermatology | Dermatology cases |

### Sample Transcripts

**Claim Denial:**
```
Hello, I'm calling about a claim denial. My claim CLM-2024-001 was rejected with code CO-16. I need help understanding what documentation is missing.
```

**Billing Policy:**
```
Hi, I have a question about incident-to billing. When our nurse practitioner sees an established patient, can we bill under my NPI at 100%?
```

**Urgent Issue:**
```
This is urgent! My patient needs prior authorization for a monoclonal antibody treatment today. How do I expedite this?
```

**Telehealth:**
```
I need clarification on telehealth billing. What modifier do I use for virtual visits and what documentation is required?
```

---

## Testing Without Functions Deployed

If Firebase Functions aren't deployed yet, you can still:

1. **Review the code** in `/functions` directory
2. **Check mock data** in `/firestore` directory
3. **Review Dialogflow configs** in `/dialogflow` directory
4. **Read API documentation** in `/docs/PROVIDER_API_DOCUMENTATION.md`

---

## Troubleshooting

### Issue: "Cannot connect to Functions"

**Solution:** Verify Functions are deployed:
```bash
firebase functions:list --project faomeroct10
```

### Issue: "Provider not found"

**Solution:** Use one of the test NPIs listed above (1234567890 - 5678901234)

### Issue: "No suggested articles returned"

**Solution:** Use keywords in your transcript like: "claim", "billing", "coding", "denial", "telehealth"

### Issue: "No past tickets found"

**Solution:** Use NPI 1234567890, 2345678901, or 3456789012 which have ticket history

---

## Advanced Testing

### Test Rate Limiting

Try authenticating 6 times in a row with the same NPI:

```bash
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST https://us-central1-faomeroct10.cloudfunctions.net/authenticateProviderApi \
    -H "Content-Type: application/json" \
    -d '{"npiNumber": "1234567890"}'
  echo ""
done
```

Expected: First 5 succeed, 6th returns 429 (Rate Limit Exceeded)

### Test Knowledge Base Relevance

Try different topics:

```bash
# Billing topic
curl -X POST .../generateAgentAssistDataApi -d '{
  "transcript": "I have questions about billing and reimbursement",
  "providerId": "1234567890"
}'

# Coding topic  
curl -X POST .../generateAgentAssistDataApi -d '{
  "transcript": "I need help with ICD-10 coding",
  "providerId": "1234567890"
}'
```

Check that different knowledge base articles are returned.

### Test Ticket Categorization

Create tickets with different keywords:

```bash
# Should be categorized as "Claims Processing"
curl -X POST .../createCrmTicketApi -d '{
  "npiNumber": "1234567890",
  "issueSummary": "Claim was denied and I need help"
}'

# Should be categorized as "Medical Coding"
curl -X POST .../createCrmTicketApi -d '{
  "npiNumber": "1234567890", 
  "issueSummary": "Question about ICD-10 codes"
}'
```

---

## Performance Benchmarks

Expected response times:

- **authenticateProvider:** < 500ms
- **generateAgentAssistData:** < 1000ms
- **createCrmTicket:** < 500ms

Test with:
```bash
time curl -X POST .../authenticateProviderApi -d '{"npiNumber": "1234567890"}'
```

---

## Next Steps After Testing

Once you've verified the APIs work:

1. **Import mock data to Firestore** for persistence
2. **Configure Dialogflow CX agent** with the provided configurations
3. **Set up webhook** pointing to your deployed functions
4. **Test end-to-end flow** with voice or text conversations

---

## Support

If you encounter issues:

1. Check Firebase Functions logs:
   ```bash
   firebase functions:log --project faomeroct10
   ```

2. Verify Functions are deployed:
   ```bash
   firebase functions:list --project faomeroct10
   ```

3. Review the full API documentation:
   `/docs/PROVIDER_API_DOCUMENTATION.md`
