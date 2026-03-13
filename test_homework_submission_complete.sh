#!/bin/bash

# Complete Homework Submission Test
# This script tests the entire homework submission and grading workflow

echo "=================================================="
echo "🧪 COMPLETE HOMEWORK SUBMISSION TEST"
echo "=================================================="

# Configuration
API_BASE="https://superplacestudy.pages.dev"
WORKER_URL="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
WORKER_API_KEY="gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u"

# Test user
USER_ID=1771491306
USER_NAME="테스트학생1771491306"

# Create a sample homework image (simple base64 image with text)
TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

echo ""
echo "Step 1: Test Worker Health"
echo "----------------------------"
WORKER_HEALTH=$(curl -s "$WORKER_URL/")
echo "$WORKER_HEALTH" | jq '.'

echo ""
echo "Step 2: Submit Homework"
echo "----------------------------"
SUBMIT_RESPONSE=$(curl -s -X POST "$API_BASE/api/homework/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d "{
    \"userId\": $USER_ID,
    \"images\": [\"data:image/png;base64,$TEST_IMAGE\"]
  }")

echo "$SUBMIT_RESPONSE" | jq '.'

SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id')

if [ "$SUBMISSION_ID" != "null" ] && [ -n "$SUBMISSION_ID" ]; then
  echo ""
  echo "✅ Submission ID: $SUBMISSION_ID"
  echo ""
  echo "Step 3: Wait for Grading (10 seconds)"
  echo "----------------------------"
  for i in {10..1}; do
    echo -n "$i... "
    sleep 1
  done
  echo ""
  
  echo ""
  echo "Step 4: Check Results"
  echo "----------------------------"
  # Query database to check if we have duplicate submissions
  # This would need D1 access, so we'll check via the results page
  
  echo ""
  echo "Step 5: Verify No Duplicates"
  echo "----------------------------"
  echo "Please check the dashboard at:"
  echo "$API_BASE/dashboard/homework/results"
  echo ""
  echo "Expected:"
  echo "  - Only ONE submission should appear"
  echo "  - Submission ID: $SUBMISSION_ID"
  echo "  - Status should be 'graded' (not 'pending')"
  echo "  - Score should NOT be 0"
  echo "  - Feedback should be visible"
else
  echo ""
  echo "❌ Failed to submit homework"
fi

echo ""
echo "=================================================="
echo "Test Complete"
echo "=================================================="
