/**
 * Mobile App JavaScript - Use Case 3: Proactive Beneficiary Engagement
 * Complete implementation of personalized mobile Medicare experience
 */

// ============================================
// STATE MANAGEMENT
// ============================================
const AppState = {
    currentUser: null,
    currentView: 'dashboard',
    beneficiaries: [],
    notifications: [],
    conversations: [],
    documents: [],
    smartReplies: []
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    // Show loading screen briefly
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('fade-out');
        setTimeout(() => {
            document.getElementById('loadingScreen').style.display = 'none';
        }, 300);
    }, 1000);

    // Load all mock data
    await loadMockData();

    // Setup event listeners
    setupEventListeners();
}

// ============================================
// DATA LOADING
// ============================================
async function loadMockData() {
    try {
        // Load beneficiaries data
        const beneficiariesResponse = await fetch('/firestore/beneficiaries.json');
        const beneficiariesData = await beneficiariesResponse.json();
        AppState.beneficiaries = beneficiariesData.beneficiaries;

        // Load notifications data
        const notificationsResponse = await fetch('/firestore/notifications.json');
        const notificationsData = await notificationsResponse.json();
        AppState.notifications = notificationsData.notifications;

        // Load conversations data
        const conversationsResponse = await fetch('/firestore/conversations.json');
        const conversationsData = await conversationsResponse.json();
        AppState.conversations = conversationsData.conversations;

        // Load documents data
        const documentsResponse = await fetch('/firestore/documents.json');
        const documentsData = await documentsResponse.json();
        AppState.documents = documentsData.documents;

        // Load smart replies data
        const smartRepliesResponse = await fetch('/firestore/smartReplies.json');
        const smartRepliesData = await smartRepliesResponse.json();
        AppState.smartReplies = smartRepliesData.smartReplies;

    } catch (error) {
        console.error('Error loading mock data:', error);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Demo user buttons
    const demoBtns = document.querySelectorAll('.demo-btn');
    demoBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const medicareId = e.target.dataset.medicare;
            const lastName = e.target.dataset.lastname;
            document.getElementById('medicareId').value = medicareId;
            document.getElementById('lastName').value = lastName;
            handleLogin(e);
        });
    });

    // Bottom navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);
        });
    });

    // Notification bell
    document.getElementById('notificationBtn')?.addEventListener('click', () => {
        switchView('notifications');
    });
}

// ============================================
// AUTHENTICATION
// ============================================
function handleLogin(e) {
    e.preventDefault();
    
    const medicareId = document.getElementById('medicareId').value;
    const lastName = document.getElementById('lastName').value;

    // Find user in mock data
    const user = AppState.beneficiaries.find(b => 
        b.medicareId === medicareId && 
        b.lastName.toLowerCase() === lastName.toLowerCase()
    );

    if (user) {
        AppState.currentUser = user;
        showApp();
        loadDashboard();
        updateNotificationBadge();
    } else {
        alert('Invalid credentials. Please try again or use one of the demo accounts.');
    }
}

function showApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';
}

// ============================================
// NAVIGATION
// ============================================
function switchView(viewName) {
    AppState.currentView = viewName;
    
    // Update nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.view === viewName) {
            item.classList.add('active');
        }
    });

    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        notifications: 'Notifications',
        chat: 'Chat Support',
        documents: 'My Documents'
    };
    document.getElementById('pageTitle').textContent = titles[viewName] || 'Dashboard';

    // Load view content
    const mainContent = document.getElementById('mainContent');
    switch(viewName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'notifications':
            loadNotifications();
            break;
        case 'chat':
            loadChat();
            break;
        case 'documents':
            loadDocuments();
            break;
    }
}

// ============================================
// DASHBOARD VIEW
// ============================================
function loadDashboard() {
    const user = AppState.currentUser;
    if (!user) return;

    const userNotifications = AppState.notifications.filter(n => 
        n.beneficiaryId === user.medicareId && !n.readAt
    );

    let html = `
        <div class="welcome-section" style="margin-bottom: 24px;">
            <h2 style="font-size: 28px; margin-bottom: 8px;">Hello, ${user.firstName}! 👋</h2>
            <p style="color: var(--text-secondary);">Here's your personalized health overview</p>
        </div>
    `;

    // Upcoming Appointment Card
    if (user.upcomingAppointment) {
        html += `
            <div class="card" style="border-left: 4px solid var(--info-color);">
                <div class="card-header">
                    <h3 class="card-title">📅 Upcoming Appointment</h3>
                </div>
                <div class="card-content">
                    <p><strong>${user.upcomingAppointment.type}</strong></p>
                    <p style="color: var(--text-secondary); margin: 8px 0;">
                        ${new Date(user.upcomingAppointment.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })} at ${user.upcomingAppointment.time}
                    </p>
                    <p style="color: var(--text-secondary);">
                        ${user.upcomingAppointment.provider}<br>
                        ${user.upcomingAppointment.location}
                    </p>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary">View Details</button>
                    <button class="btn btn-secondary">Get Directions</button>
                </div>
            </div>
        `;
    }

    // Action Items Card
    const actionItems = [];
    if (user.preventiveServiceDue) actionItems.push('Annual Wellness Visit Due');
    if (user.medicationRefillDue) actionItems.push('Medication Refill Needed');
    if (user.hasUnfinishedApplication) actionItems.push('Complete Application');

    if (actionItems.length > 0) {
        html += `
            <div class="card" style="border-left: 4px solid var(--warning-color);">
                <div class="card-header">
                    <h3 class="card-title">⚠️ Action Required</h3>
                    <span class="status-badge badge-medium">${actionItems.length} items</span>
                </div>
                <div class="card-content">
                    ${actionItems.map(item => `
                        <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 8px;">
                            ${item}
                        </div>
                    `).join('')}
                </div>
                <div class="card-footer">
                    <button class="btn btn-warning">Take Action</button>
                </div>
            </div>
        `;
    }

    // Medications Card
    if (user.medications && user.medications.length > 0) {
        html += `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">💊 Your Medications</h3>
                </div>
                <div class="card-content">
                    ${user.medications.map(med => `
                        <div style="padding: 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${med.name}</strong> ${med.dosage}<br>
                                <small style="color: var(--text-secondary);">
                                    Refills remaining: ${med.refillsRemaining}
                                </small>
                            </div>
                            <button class="btn btn-sm btn-primary">Refill</button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Health Programs Card
    if (user.enrolledPrograms && user.enrolledPrograms.length > 0) {
        html += `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">🏥 Your Health Programs</h3>
                </div>
                <div class="card-content">
                    ${user.enrolledPrograms.map(program => `
                        <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; margin-bottom: 8px;">
                            <strong>${program}</strong>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Plan Info Card
    html += `
        <div class="card" style="background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white;">
            <div class="card-header">
                <h3 class="card-title" style="color: white;">📋 Your Coverage</h3>
            </div>
            <div class="card-content">
                <p><strong style="font-size: 18px;">${user.planType}</strong></p>
                <p style="margin: 12px 0; opacity: 0.9;">
                    Coverage: ${user.coverageType.join(', ')}
                </p>
                <p style="opacity: 0.9;">Member since: ${new Date(user.enrollmentDate).getFullYear()}</p>
            </div>
            <div class="card-footer" style="border-top-color: rgba(255,255,255,0.2);">
                <button class="btn" style="background: rgba(255,255,255,0.2); color: white;">View Benefits</button>
            </div>
        </div>
    `;

    // Quick Actions
    html += `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">⚡ Quick Actions</h3>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px;">
                <button class="btn btn-secondary" onclick="switchView('chat')">💬 Chat Support</button>
                <button class="btn btn-secondary" onclick="switchView('documents')">📄 Upload Document</button>
                <button class="btn btn-secondary">📞 Call Nurse Line</button>
                <button class="btn btn-secondary">🔍 Find Provider</button>
            </div>
        </div>
    `;

    document.getElementById('mainContent').innerHTML = html;
}

// ============================================
// NOTIFICATIONS VIEW
// ============================================
function loadNotifications() {
    const user = AppState.currentUser;
    if (!user) return;

    const userNotifications = AppState.notifications
        .filter(n => n.beneficiaryId === user.medicareId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    let html = '<h2 style="margin-bottom: 24px; font-size: 24px;">Your Notifications</h2>';

    if (userNotifications.length === 0) {
        html += `
            <div class="card text-center">
                <p style="padding: 40px; color: var(--text-secondary);">
                    No notifications at this time. We'll notify you about important updates!
                </p>
            </div>
        `;
    } else {
        userNotifications.forEach(notif => {
            const priorityClass = `badge-${notif.priority}`;
            const isUnread = !notif.readAt;
            
            html += `
                <div class="card" style="${isUnread ? 'border-left: 4px solid var(--primary-color);' : ''}">
                    <div class="card-header">
                        <h3 class="card-title">${notif.title}</h3>
                        <span class="status-badge ${priorityClass}">${notif.priority}</span>
                    </div>
                    <div class="card-content">
                        <p>${notif.message}</p>
                        <p style="color: var(--text-secondary); font-size: 14px; margin-top: 12px;">
                            ${formatTimestamp(notif.createdAt)}
                        </p>
                    </div>
                    ${notif.actionLink ? `
                        <div class="card-footer">
                            <button class="btn btn-primary">${notif.actionText || 'Take Action'}</button>
                            ${isUnread ? '<button class="btn btn-secondary">Mark as Read</button>' : ''}
                        </div>
                    ` : ''}
                </div>
            `;
        });
    }

    document.getElementById('mainContent').innerHTML = html;
}

// ============================================
// CHAT VIEW WITH AGENT HANDOFF
// ============================================
function loadChat() {
    const user = AppState.currentUser;
    if (!user) return;

    const html = `
        <div class="chat-container" style="display: flex; flex-direction: column; height: calc(100vh - 200px);">
            <div class="chat-messages" id="chatMessages" style="flex: 1; overflow-y: auto; padding: 16px; background: white; border-radius: 12px; margin-bottom: 16px;">
                <div class="chat-message assistant">
                    <div class="message-bubble" style="background: var(--bg-secondary); padding: 12px; border-radius: 12px; margin-bottom: 12px; max-width: 80%;">
                        <p>Hi ${user.firstName}! I'm here to help you with your Medicare questions. What can I assist you with today?</p>
                        <span style="font-size: 12px; color: var(--text-secondary);">Just now</span>
                    </div>
                </div>
            </div>
            
            <div class="chat-input-area" style="background: white; padding: 16px; border-radius: 12px; box-shadow: var(--shadow-md);">
                <div class="smart-replies" id="smartReplies" style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                    <button class="btn btn-sm btn-secondary" onclick="sendChatMessage('I need help with my medications')">💊 Medications</button>
                    <button class="btn btn-sm btn-secondary" onclick="sendChatMessage('Schedule an appointment')">📅 Appointments</button>
                    <button class="btn btn-sm btn-secondary" onclick="sendChatMessage('Check my benefits')">📋 Benefits</button>
                </div>
                <div style="display: flex; gap: 8px;">
                    <input type="text" id="chatInput" placeholder="Type your message..." 
                        style="flex: 1; padding: 12px; border: 2px solid var(--border-color); border-radius: 8px; font-size: 16px;">
                    <button onclick="sendChatMessage()" class="btn btn-primary" style="padding: 12px 24px;">Send</button>
                </div>
                <button onclick="initiateAgentHandoff()" class="btn btn-secondary" style="width: 100%; margin-top: 12px;">
                    👤 Connect to Live Agent
                </button>
            </div>
        </div>
    `;

    document.getElementById('mainContent').innerHTML = html;
    
    // Add enter key listener
    document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
}

function sendChatMessage(message) {
    const chatInput = document.getElementById('chatInput');
    const msg = message || chatInput?.value;
    
    if (!msg || !msg.trim()) return;

    const chatMessages = document.getElementById('chatMessages');
    const user = AppState.currentUser;

    // Add user message
    const userMsgHtml = `
        <div class="chat-message user" style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
            <div class="message-bubble" style="background: var(--primary-color); color: white; padding: 12px; border-radius: 12px; max-width: 80%;">
                <p>${msg}</p>
                <span style="font-size: 12px; opacity: 0.8;">Just now</span>
            </div>
        </div>
    `;
    chatMessages.innerHTML += userMsgHtml;

    // Clear input
    if (chatInput) chatInput.value = '';

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Simulate AI response
    setTimeout(() => {
        const response = generateSmartReply(msg);
        const assistantMsgHtml = `
            <div class="chat-message assistant" style="margin-bottom: 12px;">
                <div class="message-bubble" style="background: var(--bg-secondary); padding: 12px; border-radius: 12px; max-width: 80%;">
                    <p>${response}</p>
                    <span style="font-size: 12px; color: var(--text-secondary);">Just now</span>
                </div>
            </div>
        `;
        chatMessages.innerHTML += assistantMsgHtml;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 1000);
}

function generateSmartReply(userMessage) {
    const user = AppState.currentUser;
    const msg = userMessage.toLowerCase();

    // Find matching smart reply template
    const reply = AppState.smartReplies.find(r => 
        r.trigger_keywords.some(keyword => msg.includes(keyword))
    );

    if (reply) {
        // Customize reply with user data
        let response = reply.template;
        response = response.replace('{firstName}', user.firstName);
        response = response.replace('{planType}', user.planType);
        return response;
    }

    return "I understand you need assistance. Would you like me to connect you with a live agent who can help you with this specific question?";
}

function initiateAgentHandoff() {
    const user = AppState.currentUser;
    const chatMessages = document.getElementById('chatMessages');

    // Show handoff animation
    const handoffHtml = `
        <div class="handoff-notification" style="text-align: center; padding: 24px; background: var(--info-color); color: white; border-radius: 12px; margin: 16px 0;">
            <div class="loader" style="margin: 0 auto 16px; width: 40px; height: 40px; border-color: rgba(255,255,255,0.3); border-top-color: white;"></div>
            <h3>Connecting you to a live agent...</h3>
            <p style="margin-top: 8px; opacity: 0.9;">Packaging your conversation context securely</p>
            <div style="margin-top: 16px; padding: 16px; background: rgba(255,255,255,0.2); border-radius: 8px; text-align: left;">
                <strong style="display: block; margin-bottom: 8px;">Context Package:</strong>
                <small>✓ Beneficiary ID: ${user.medicareId.replace(/\d/g, '•')}</small><br>
                <small>✓ Name: ${user.firstName} ${user.lastName[0]}***</small><br>
                <small>✓ Plan: ${user.planType}</small><br>
                <small>✓ Conversation History: Last 5 messages</small><br>
                <small>✓ PII Redacted for logging</small>
            </div>
        </div>
    `;

    chatMessages.innerHTML += handoffHtml;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Simulate connection
    setTimeout(() => {
        const agentMsgHtml = `
            <div class="chat-message agent" style="margin-bottom: 12px;">
                <div class="message-bubble" style="background: var(--success-color); color: white; padding: 12px; border-radius: 12px; max-width: 80%;">
                    <strong style="display: block; margin-bottom: 4px;">Agent Sarah Williams</strong>
                    <p>Hi ${user.firstName}! I've received your conversation history and I'm here to help. What specific question can I assist you with today?</p>
                    <span style="font-size: 12px; opacity: 0.8;">Just now</span>
                </div>
            </div>
        `;
        chatMessages.innerHTML += agentMsgHtml;
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 3000);
}

// ============================================
// DOCUMENTS VIEW
// ============================================
function loadDocuments() {
    const user = AppState.currentUser;
    if (!user) return;

    const userDocs = AppState.documents.filter(d => d.beneficiaryId === user.medicareId);

    let html = `
        <h2 style="margin-bottom: 24px; font-size: 24px;">My Documents</h2>
        
        <div class="card" style="border: 2px dashed var(--border-color); text-align: center; cursor: pointer;" onclick="showUploadDialog()">
            <div style="padding: 40px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" style="margin-bottom: 16px;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <h3 style="margin-bottom: 8px;">Upload New Document</h3>
                <p style="color: var(--text-secondary); font-size: 14px;">Click to upload or drag and drop<br>PDF, JPG, PNG up to 5MB</p>
            </div>
        </div>
    `;

    if (userDocs.length > 0) {
        html += '<h3 style="margin: 24px 0 16px;">Recent Documents</h3>';
        
        userDocs.forEach(doc => {
            const statusColors = {
                approved: 'var(--success-color)',
                pending: 'var(--warning-color)',
                pending_review: 'var(--info-color)',
                processing: 'var(--secondary-color)',
                draft: 'var(--text-secondary)'
            };
            
            html += `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <h3 class="card-title">${doc.name}</h3>
                            <p style="font-size: 14px; color: var(--text-secondary); margin-top: 4px;">${doc.type}</p>
                        </div>
                        <span class="status-badge" style="background: ${statusColors[doc.status]}20; color: ${statusColors[doc.status]};">
                            ${doc.status.replace('_', ' ')}
                        </span>
                    </div>
                    <div class="card-content">
                        <p style="font-size: 14px; color: var(--text-secondary);">${doc.description}</p>
                        <div style="display: flex; gap: 16px; margin-top: 12px; font-size: 14px;">
                            <span>📄 ${doc.fileSize}</span>
                            <span>📅 ${formatTimestamp(doc.uploadedAt)}</span>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-secondary btn-sm">View</button>
                        <button class="btn btn-secondary btn-sm">Download</button>
                    </div>
                </div>
            `;
        });
    }

    document.getElementById('mainContent').innerHTML = html;
}

function showUploadDialog() {
    alert('Document Upload Feature\n\nIn a production app, this would:\n1. Open file picker\n2. Validate file type and size\n3. Upload to secure storage\n4. Update document list\n\nThis is a prototype demonstration.');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function updateNotificationBadge() {
    const user = AppState.currentUser;
    if (!user) return;

    const unreadCount = AppState.notifications.filter(n => 
        n.beneficiaryId === user.medicareId && !n.readAt
    ).length;

    const badge = document.getElementById('notificationBadge');
    if (unreadCount > 0) {
        badge.textContent = unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Make functions globally accessible
window.switchView = switchView;
window.sendChatMessage = sendChatMessage;
window.initiateAgentHandoff = initiateAgentHandoff;
window.showUploadDialog = showUploadDialog;
