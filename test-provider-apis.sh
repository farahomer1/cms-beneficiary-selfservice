#!/bin/bash

# Test script for Provider Agent Assist APIs (Use Case 2)
# Make this script executable: chmod +x test-provider-apis.sh

echo "=========================================="
echo "Testing CMS Provider Agent Assist APIs"
echo "=========================================="
echo ""

# Base URL - update this after functions deploy
BASE_URL="https://us-central1-faomeroct10.cloudfunctions.net"

# Test data
NPI="1234567890"
TRANSCRIPT="Hello, I'm calling about a claim denial. My claim CLM-2024-001 was rejected with code CO-16. I need help understanding what documentation is missing so I can resubmit correctly. This is urgent."

echo "Test 1: Provider Authentication"
echo "================================"
echo "Testing NPI: $NPI"
echo ""

curl -X POST "$BASE_URL/authenticateProviderApi" \
  -H "Content-Type: application/json" \
  -d "{\"npiNumber\": \"$NPI\"}" \
  | jq '.'

echo ""
echo ""
echo "Test 2: Generate Agent Assist Data"
echo "==================================="
echo "Testing with sample transcript"
echo ""

curl -X POST "$BASE_URL/generateAgentAssistDataApi" \
  -H "Content-Type: application/json" \
  -d "{\"transcript\": \"$TRANSCRIPT\", \"providerId\": \"$NPI\"}" \
  | jq '.'

echo ""
echo ""
echo "Test 3: Create CRM Ticket"
echo "========================="
echo "Creating test ticket"
echo ""

curl -X POST "$BASE_URL/createCrmTicketApi" \
  -H "Content-Type: application/json" \
  -d "{\"npiNumber\": \"$NPI\", \"issueSummary\": \"Question about claim denial CO-16 documentation requirements\", \"status\": \"Open\"}" \
  | jq '.'

echo ""
echo ""
echo "=========================================="
echo "All tests complete!"
echo "=========================================="
echo ""
echo "Test NPIs available:"
echo "  1234567890 - Springfield Medical Center (Primary Care)"
echo "  2345678901 - Riverside Cardiology (Cardiology)"
echo "  3456789012 - Metro Orthopedic (Orthopedic Surgery)"
echo "  4567890123 - Sunset Pediatric (Pediatrics)"
echo "  5678901234 - Coastal Dermatology (Dermatology)"
