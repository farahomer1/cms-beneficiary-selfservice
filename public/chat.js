/**
 * CMS Beneficiary Self-Service - Chat Interface
 * Handles chat UI interactions and mock conversations
 */

// Application state
const state = {
  messages: [],
  isTyping: false,
  sessionData: {}
};

// DOM elements
const welcomeSection = document.getElementById('welcomeSection');
const chatSection = document.getElementById('chatSection');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const startChatBtn = document.getElementById('startChatBtn');
const typingIndicator = document.getElementById('typingIndicator');
const quickReplies = document.getElementById('quickReplies');

// Initialize app
function init() {
  startChatBtn.addEventListener('click', startChat);
  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', handleKeyPress);
}

// Start chat conversation
function startChat() {
  welcomeSection.classList.add('hidden');
  chatSection.classList.remove('hidden');
  chatInput.focus();
  
  // Send initial greeting
  setTimeout(() => {
    addBotMessage(getGreetingMessage());
    showQuickReplies([
      'Check claim status',
      'Learn about benefits',
      'Find a provider'
    ]);
  }, 500);
}

// Handle key press in input
function handleKeyPress(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

// Send user message
function sendMessage() {
  const message = chatInput.value.trim();
  
  if (!message) return;
  
  // Add user message to chat
  addUserMessage(message);
  
  // Clear input
  chatInput.value = '';
  
  // Process message and generate response
  processMessage(message);
}

// Add user message to chat
function addUserMessage(message) {
  const messageEl = createMessageElement(message, 'user');
  chatMessages.appendChild(messageEl);
  scrollToBottom();
  
  state.messages.push({
    role: 'user',
    content: message,
    timestamp: new Date()
  });
}

// Add bot message to chat
function addBotMessage(message) {
  showTypingIndicator();
  
  setTimeout(() => {
    hideTypingIndicator();
    const messageEl = createMessageElement(message, 'bot');
    chatMessages.appendChild(messageEl);
    scrollToBottom();
    
    state.messages.push({
      role: 'bot',
      content: message,
      timestamp: new Date()
    });
  }, 1000 + Math.random() * 500);
}

// Create message element
function createMessageElement(content, role) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = role === 'user' ? '👤' : '🤖';
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  
  // Convert markdown-style formatting to HTML
  const formattedContent = formatMessage(content);
  contentDiv.innerHTML = formattedContent;
  
  const timeDiv = document.createElement('div');
  timeDiv.className = 'message-time';
  timeDiv.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  contentDiv.appendChild(timeDiv);
  
  messageDiv.appendChild(avatar);
  messageDiv.appendChild(contentDiv);
  
  return messageDiv;
}

// Format message with markdown-like syntax
function formatMessage(content) {
  let formatted = content;
  
  // Bold text (**text**)
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Bullet points
  formatted = formatted.replace(/^• (.+)$/gm, '<li>$1</li>');
  formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Line breaks
  formatted = formatted.replace(/\n/g, '<br>');
  
  return formatted;
}

// Process user message and generate response
function processMessage(message) {
  const lowerMessage = message.toLowerCase();
  
  // Pattern matching for different intents
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    addBotMessage(getGreetingMessage());
    showQuickReplies(['Check claim status', 'Learn about benefits', 'Find a provider']);
  }
  else if (lowerMessage.includes('claim')) {
    addBotMessage(getClaimResponse());
  }
  else if (lowerMessage.includes('benefit') || lowerMessage.includes('coverage') || lowerMessage.includes('part')) {
    addBotMessage(getBenefitResponse(message));
  }
  else if (lowerMessage.includes('provider') || lowerMessage.includes('doctor') || lowerMessage.includes('find')) {
    addBotMessage(getProviderResponse());
  }
  else if (lowerMessage.includes('agent') || lowerMessage.includes('help') || lowerMessage.includes('support')) {
    addBotMessage(getEscalationMessage());
  }
  else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('thanks')) {
    addBotMessage(getGoodbyeMessage());
  }
  else {
    addBotMessage(getDefaultResponse());
    showQuickReplies(['Check claim status', 'Learn about benefits', 'Find a provider', 'Speak to agent']);
  }
}

// Response generators
function getGreetingMessage() {
  return `Hello! Welcome to the CMS Beneficiary Self-Service portal. I'm here to help you with:

• Checking claim status
• Learning about your benefits
• Finding healthcare providers
• Getting connected to a support agent

How can I assist you today?`;
}

function getClaimResponse() {
  return `**Claim Status Information**

To check your claim status, I'll need your claim number. Claim numbers are in the format CLM-YYYY-NNN (e.g., CLM-2024-001).

**Sample Claim Status:**
Claim CLM-2024-001
Status: ✓ Approved
Service Date: September 15, 2024
Provider: Springfield General Hospital
Service: Primary care visit for annual checkup

**Financial Details:**
• Billed Amount: $250.00
• Approved Amount: $200.00
• Your Responsibility: $40.00
• Payment Date: September 30, 2024
• Payment Amount: $160.00

Would you like to check another claim or learn about something else?`;
}

function getBenefitResponse(message) {
  const lowerMessage = message.toLowerCase();
  let benefitType = 'general';
  
  if (lowerMessage.includes('part a')) benefitType = 'Part A';
  else if (lowerMessage.includes('part b')) benefitType = 'Part B';
  else if (lowerMessage.includes('part d')) benefitType = 'Part D';
  else if (lowerMessage.includes('dental')) benefitType = 'dental';
  else if (lowerMessage.includes('vision')) benefitType = 'vision';
  
  if (benefitType === 'Part A') {
    return `**Medicare Part A - Hospital Insurance**

Part A covers inpatient hospital stays, care in a skilled nursing facility, hospice care, and some home health care.

**Coverage Details:**

• **Inpatient Hospital:** Semi-private room, meals, general nursing, and other hospital services and supplies
  - Deductible: $1,632 per benefit period (2024)
  - Days 1-60: $0 coinsurance
  - Days 61-90: $408 coinsurance per day

• **Skilled Nursing Facility:** Semi-private room, meals, skilled nursing and rehabilitative services
  - Days 1-20: $0 coinsurance
  - Days 21-100: $204 coinsurance per day

**Premium:** Most people don't pay a Part A premium if they or their spouse paid Medicare taxes while working.

What else would you like to know?`;
  }
  
  return `**Your Medicare Benefits**

Medicare offers several coverage options:

• **Part A:** Hospital Insurance (inpatient care, skilled nursing)
• **Part B:** Medical Insurance (doctor visits, outpatient care)
• **Part C:** Medicare Advantage (alternative to Original Medicare)
• **Part D:** Prescription Drug Coverage

You can also add supplemental coverage for:
• Dental services
• Vision care
• Hearing aids

Which specific benefit would you like to learn more about?`;
}

function getProviderResponse() {
  return `**Find Healthcare Providers**

I can help you search for providers by specialty. Here are some examples:

**Available Specialties:**
• Primary Care
• Cardiologist
• Dentist
• Dermatologist
• Ophthalmologist
• Orthopedist

**Sample Provider:**
**Dr. Sarah Mitchell** ✓
Springfield Family Medicine
Primary Care
100 Medical Plaza, Springfield, IL 62701
📞 (555) 111-2222
⭐ 4.8/5.0 (156 reviews)
🗣️ Languages: English, Spanish
✅ Accepting new patients

What type of provider are you looking for?`;
}

function getEscalationMessage() {
  return `I understand you'd like to speak with a support agent. Let me connect you now.

**CMS Support:**
📞 Phone: 1-800-MEDICARE (1-800-633-4227)
⏰ Available 24/7
🗣️ TTY: 1-877-486-2048

An agent will be with you shortly to assist with your inquiry. Is there anything else I can help you with while you wait?`;
}

function getGoodbyeMessage() {
  return `Thank you for using the CMS Beneficiary Self-Service portal. Have a great day!

If you need assistance in the future, feel free to return anytime. Stay healthy! 👋`;
}

function getDefaultResponse() {
  return `I'm here to help! I can assist you with:

• **Claim Status** - Check the status of your medical claims
• **Benefits** - Learn about Medicare Parts A, B, C, D, and supplemental coverage
• **Providers** - Find doctors and healthcare facilities in your area
• **Support** - Connect with a live agent for personalized assistance

What would you like to know more about?`;
}

// Show typing indicator
function showTypingIndicator() {
  typingIndicator.classList.remove('hidden');
  scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
  typingIndicator.classList.add('hidden');
}

// Show quick reply buttons
function showQuickReplies(replies) {
  quickReplies.innerHTML = '';
  
  replies.forEach(reply => {
    const btn = document.createElement('button');
    btn.className = 'quick-reply-btn';
    btn.textContent = reply;
    btn.onclick = () => {
      chatInput.value = reply;
      sendMessage();
      quickReplies.classList.add('hidden');
    };
    quickReplies.appendChild(btn);
  });
  
  quickReplies.classList.remove('hidden');
}

// Scroll chat to bottom
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
