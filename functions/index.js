/**
 * Firebase Cloud Functions for CMS Beneficiary Self-Service Virtual Agent
 * 
 * Main entry point for all cloud functions
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });
const { handleWebhook } = require('./webhooks/dialogflowWebhook');
const { authenticateUser } = require('./auth/authenticateUser');

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * Dialogflow CX Webhook
 * Handles all webhook requests from Dialogflow CX
 */
exports.dialogflowWebhook = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  cors(req, res, async () => {
    try {
      // Only accept POST requests
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }
      
      // Log incoming request (without sensitive data)
      console.log('Webhook request received');
      
      // Handle the webhook
      const response = await handleWebhook(req.body);
      
      // Send response
      res.status(200).json(response);
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).json({
        fulfillmentResponse: {
          messages: [
            {
              text: {
                text: ['An error occurred processing your request. Please try again.']
              }
            }
          ]
        }
      });
    }
  });
});

/**
 * Authentication Function
 * Standalone function for authenticating beneficiaries
 * Can be called directly from the frontend
 */
exports.authenticateBeneficiary = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      // Only accept POST requests
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
      }
      
      const { medicareId, lastName } = req.body;
      
      if (!medicareId || !lastName) {
        res.status(400).json({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'Medicare ID and last name are required'
        });
        return;
      }
      
      const result = await authenticateUser(medicareId, lastName);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(401).json(result);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An error occurred during authentication'
      });
    }
  });
});

/**
 * Health Check Function
 * Simple endpoint to verify the functions are running
 */
exports.healthCheck = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'CMS Beneficiary Self-Service',
      version: '1.0.0'
    });
  });
});
