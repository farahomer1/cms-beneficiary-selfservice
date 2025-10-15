# CMS Beneficiary Self-Service Virtual Agent

An AI-powered customer engagement solution for Centers for Medicare and Medicaid Services (CMS) beneficiaries to access self-service options through a conversational interface.

## 🚀 Live Demos

### Use Case 1: Beneficiary Self-Service Chat
**URL:** https://faomeroct10.web.app

A conversational AI chatbot that helps Medicare beneficiaries with:
- Claim status inquiries
- Benefits information
- Provider searches
- Secure authentication

### Use Case 3: Proactive Mobile App
**URL:** https://faomeroct10.web.app/mobile

A personalized mobile experience featuring:
- Dashboard with health overview
- Proactive notifications
- AI chat with live agent handoff
- Document management

---

## 🎯 Quick Start: Try the Demos

### 🗨️ Use Case 1 Demo Actions (Chat Interface)

**Step-by-Step Test:**

1. **Open the Chat** → https://faomeroct10.web.app
2. **Start with a greeting**
   - Type: `Hello` or `Hi`
   - Expected: Welcome message with options

3. **Check a Claim Status**
   - Type: `Check my claim status`
   - Use Claim ID: `CLM-2024-001`
   - Expected: Claim details (Approved, $2,850)

4. **Ask About Benefits**
   - Type: `What does Part A cover?`
   - Expected: Hospital coverage details
   - Try also: `Tell me about dental benefits`

5. **Find a Provider**
   - Type: `Find a cardiologist`
   - Expected: List of cardiology providers
   - Try also: `Find a dentist near me`

6. **Alternative Queries to Try:**
   ```
   - "What's covered under my plan?"
   - "How do I file a claim?"
   - "Find an ophthalmologist"
   - "Check claim CLM-2024-003"
   - "What's the status of my pending claim?"
   ```

---

### 📱 Use Case 3 Demo Actions (Mobile App)

**Complete Feature Tour:**

1. **Login to the App** → https://faomeroct10.web.app/mobile

2. **Quick Login Options** (Click any button):
   - **Mary Johnson** → Has medication refill due, wellness visit needed
   - **Robert Smith** → Unfinished application (65% complete)
   - **James Brown** → Multiple urgent alerts, critical medication

3. **Explore the Dashboard** (Home tab):
   - View upcoming appointments
   - Check action items (wellness visits, refills)
   - See current medications
   - Review health programs
   - Check plan coverage

4. **Check Notifications** (Alerts tab):
   - See 2 unread notifications for Mary
   - Priority badges: urgent (red), high (orange), medium (yellow)
   - Click "Take Action" buttons
   - Mark notifications as read

5. **Use the Chat Feature** (Chat tab):
   - Click the **💊 Medications** quick reply
   - Type: `I need help with my medications`
   - Type: `Schedule an appointment`
   - Type: `Check my benefits`

6. **Try Live Agent Handoff**:
   - In Chat, click **"Connect to Live Agent"** button
   - Watch the secure context transfer animation
   - See agent receive your information with PII redacted
   - Notice the green agent message appears after 3 seconds

7. **View Documents** (Documents tab):
   - See uploaded medical records
   - Check document status (approved, pending, processing)
   - Click the upload area to see upload dialog
   - View document metadata (size, date)

**Specific Actions to Test:**

```
Dashboard Actions:
→ Click "View Details" on upcoming appointment
→ Click "Refill" button on medications
→ Click "View Benefits" on coverage card
→ Use quick action buttons (Chat Support, Upload Document)

Notification Actions:
→ Click "Schedule Visit" on wellness reminder
→ Click "Request Refill" on medication alert
→ Click "Continue Application" on application reminder

Chat Actions:
→ Try smart reply buttons
→ Send "I'm having trouble breathing" (urgent response)
→ Ask "How do I upload documents?"
→ Initiate agent handoff

Document Actions:
→ Click upload area
→ View existing documents
→ Check document status badges
```

---

## Overview

This prototype demonstrates how AI can transform government contact centers by enabling beneficiaries to:
- Securely authenticate their identity
- Check claim status in real-time
- Learn about benefits and coverage
- Find healthcare providers
- Escalate to human agents when needed

## Technology Stack

- **Conversational AI**: Google Cloud Dialogflow CX
- **Backend**: Firebase Functions (Node.js)
- **Database**: Cloud Firestore
- **Frontend**: HTML5, Modern CSS, Vanilla JavaScript
- **AI Models**: 
  - Google Gemini (complex reasoning, multi-turn logic)
  - Anthropic Claude (content generation, knowledge bases)
  - Cline AI (security, compliance, authentication)

## Project Structure

```
/cms-beneficiary-selfservice/
├── /functions/                  # Firebase Cloud Functions
│   ├── index.js                # Main function exports
│   ├── package.json            # Node.js dependencies
│   ├── /auth/
│   │   └── authenticateUser.js # Secure authentication logic
│   ├── /webhooks/
│   │   └── dialogflowWebhook.js # Dialogflow CX webhook handler
│   └── /handlers/
│       ├── claimStatus.js      # Claim lookup logic
│       ├── benefits.js         # Benefit information retrieval
│       └── providers.js        # Provider search functionality
├── /firestore/                 # Mock data for Firestore
│   ├── beneficiaries.json      # User profiles
│   ├── claims.json             # Claim records
│   ├── benefits.json           # Benefit definitions
│   └── providers.json          # Provider directory
├── /public/                    # Frontend web interface
│   ├── index.html              # Main chat interface
│   ├── chat.js                 # Chat functionality
│   └── styles.css              # UI styling
├── /dialogflow/                # Dialogflow CX configurations
│   ├── intents.json            # Intent definitions
│   ├── entities.json           # Entity definitions
│   └── flows.json              # Conversational flows
├── firestore.rules             # Firestore security rules
└── README.md                   # This file
```

## Setup Instructions

### Prerequisites

1. Node.js (v18 or higher)
2. Firebase CLI (`npm install -g firebase-tools`)
3. Google Cloud Project with Dialogflow CX API enabled
4. Firebase project initialized

### Installation Steps

1. **Clone or create the project**
   ```bash
   mkdir cms-beneficiary-selfservice
   cd cms-beneficiary-selfservice
   ```

2. **Initialize Firebase**
   ```bash
   firebase login
   firebase init
   ```
   Select:
   - Functions (JavaScript)
   - Firestore
   - Hosting

3. **Install dependencies**
   ```bash
   cd functions
   npm install
   cd ..
   ```

4. **Import mock data to Firestore**
   ```bash
   # Use Firebase Console or Admin SDK to import JSON files from /firestore/
   ```

5. **Configure Dialogflow CX**
   - Create a new Dialogflow CX agent
   - Import intents from `/dialogflow/intents.json`
   - Import entities from `/dialogflow/entities.json`
   - Configure webhook to point to your deployed Firebase Function URL

6. **Deploy Functions**
   ```bash
   firebase deploy --only functions
   ```

7. **Deploy Hosting**
   ```bash
   firebase deploy --only hosting
   ```

## Conversational Flow

### User Journey

1. **Greeting** → System welcomes user and offers assistance
2. **Authentication** → User provides Medicare ID and last name
3. **Main Menu** → User selects from available options:
   - Check claim status
   - Ask about benefits
   - Find a provider
   - Speak to an agent
4. **Service Delivery** → System processes request and provides information
5. **Follow-up** → System asks if user needs additional help
6. **Goodbye** → System thanks user and ends session

### Supported Intents

- **Greeting**: Welcome new users
- **AuthenticateUser**: Verify beneficiary identity
- **CheckClaimStatus**: Look up claim information
- **AskAboutBenefits**: Explain coverage and benefits
- **FindProvider**: Search for healthcare providers
- **AgentEscalation**: Transfer to human agent
- **Goodbye**: End conversation

### Entity Types

- `@medicareID`: Format: XXX-XX-XXXX (Medicare ID)
- `@claimNumber`: Numeric claim identifier
- `@benefitType`: Part A, Part B, Part D, dental, vision, etc.
- `@providerSpecialty`: Medical specialties

## Security Features

- Secure authentication with rate limiting
- Data encryption in transit and at rest
- HIPAA-compliant data handling
- Session management with timeouts
- Input validation and sanitization
- No PII/PHI in logs

## Testing

### Mock Data Available

- **5 Beneficiaries** with various profiles
- **10 Claims** with different statuses (Approved, Pending, Denied)
- **Multiple Benefit Types** with detailed explanations
- **Provider Directory** with specialties and locations

### Test Scenarios

1. **Successful Authentication**
   - Medicare ID: 123-45-6789
   - Last Name: Johnson

2. **Claim Status Check**
   - Claim #: CLM-2024-001
   - Expected: "Approved" status with payment details

3. **Benefit Inquiry**
   - Ask: "What does Part A cover?"
   - Expected: Detailed explanation of hospital coverage

4. **Provider Search**
   - Specialty: Cardiologist
   - Expected: List of available providers

## Development Notes

### Firebase Functions

All functions are deployed to Google Cloud and triggered via HTTP requests from Dialogflow CX webhook.

**Key Functions:**
- `authenticateUser`: Validates beneficiary credentials
- `dialogflowWebhook`: Routes intents to appropriate handlers
- `handleCheckClaimStatus`: Retrieves claim information
- `handleAskAboutBenefits`: Returns benefit details
- `handleFindProvider`: Searches provider database

### Frontend Interface

The web chat interface is built with:
- Semantic HTML5
- Modern CSS (Grid, Flexbox, Custom Properties)
- Vanilla JavaScript (ES6+)
- Responsive design for mobile and desktop
- WCAG 2.1 AA accessibility compliance

## API Integration

### Dialogflow CX Webhook

POST endpoint: `https://YOUR-REGION-YOUR-PROJECT.cloudfunctions.net/dialogflowWebhook`

Request format:
```json
{
  "sessionInfo": {
    "session": "projects/.../sessions/...",
    "parameters": {}
  },
  "fulfillmentInfo": {
    "tag": "intentName"
  },
  "pageInfo": {
    "currentPage": "projects/.../pages/..."
  }
}
```

Response format:
```json
{
  "fulfillmentResponse": {
    "messages": [
      {
        "text": {
          "text": ["Response message here"]
        }
      }
    ]
  },
  "sessionInfo": {
    "parameters": {}
  }
}
```

## Deployment Checklist

- [ ] Firebase project created
- [ ] Dialogflow CX agent configured
- [ ] Firestore database initialized
- [ ] Mock data imported
- [ ] Functions deployed
- [ ] Webhook URL configured in Dialogflow
- [ ] Frontend deployed to Firebase Hosting
- [ ] Security rules applied
- [ ] Testing completed

## Future Enhancements

1. **Integration with Real CMS Systems**
   - Connect to actual claim databases
   - Real-time benefit verification
   - Live provider directory

2. **Advanced AI Features**
   - Sentiment analysis
   - Predictive issue resolution
   - Personalized recommendations

3. **Multi-channel Support**
   - SMS/text messaging
   - Voice (phone integration)
   - Mobile app

4. **Analytics & Reporting**
   - Conversation analytics
   - User satisfaction metrics
   - Performance dashboards

## Support & Documentation

For questions or issues:
- Review Dialogflow CX documentation
- Check Firebase Functions logs
- Consult Firestore security rules

## License

This is a prototype for demonstration purposes.

## Contact

CMS AI Customer Experience Team
