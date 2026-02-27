#!/bin/bash

# Simple test to check what tables exist in production D1

echo "================================"
echo "Testing D1 Table Schema"
echo "================================"
echo ""

# Try to select from landing_pages (lowercase)
echo "1. Testing 'landing_pages' (lowercase)..."
RESULT=$(curl -s -X POST "https://superplacestudy.pages.dev/api/admin/landing-pages" \
  -H "Authorization: Bearer test" \
  -H "Content-Type: application/json" \
  -d '{"slug":"test_schema_check","title":"Test","studentId":"test"}')

echo "Response: $RESULT"
echo ""

HTTP_CODE=$(echo "$RESULT" | jq -r '.error // "no_error"')
if [ "$HTTP_CODE" != "no_error" ]; then
    echo "❌ Error occurred:"
    echo "$RESULT" | jq -r '.error'
    echo ""
    echo "Error details:"
    echo "$RESULT" | jq -r '.details // "No details"'
else
    echo "✅ No error - checking if it worked..."
    
    # Try to access the page
    PAGE_RESULT=$(curl -s "https://superplacestudy.pages.dev/lp/test_schema_check" | grep "<title>" | head -1)
    echo "Page result: $PAGE_RESULT"
fi

echo ""
echo "================================"
echo "Test Complete"
echo "================================"
