#!/bin/bash

echo "=========================================="
echo "🔍 Quick 503 Error Verification"
echo "Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "=========================================="

API_URL="https://suplacestudy.com/api/ai-chat"
STUDENT_BOT_ID="bot-1773803533575-qrn2pluec"

SUCCESS=0
FAIL=0
ERROR_503=0

echo ""
echo "Testing 10 rapid requests..."
for i in {1..10}; do
  printf "Request $i: "
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d '{
      "message": "테스트 '${i}'",
      "botId": "'"$STUDENT_BOT_ID"'",
      "conversationHistory": [],
      "userId": "quick-test",
      "sessionId": "quick-'$i'"
    }')
  
  HTTP=$(echo "$RESP" | tail -n1)
  BODY=$(echo "$RESP" | head -n-1)
  
  if [ "$HTTP" = "200" ]; then
    IS_SUCCESS=$(echo "$BODY" | jq -r '.success // false')
    if [ "$IS_SUCCESS" = "true" ]; then
      SUCCESS=$((SUCCESS + 1))
      echo "✅ SUCCESS"
    else
      FAIL=$((FAIL + 1))
      ERROR_MSG=$(echo "$BODY" | jq -r '.error // "unknown"')
      echo "❌ FAIL - $ERROR_MSG"
    fi
  elif [ "$HTTP" = "503" ]; then
    ERROR_503=$((ERROR_503 + 1))
    FAIL=$((FAIL + 1))
    echo "❌ 503 ERROR"
  else
    FAIL=$((FAIL + 1))
    echo "❌ HTTP $HTTP"
  fi
  
  sleep 0.5
done

echo ""
echo "=========================================="
echo "RESULTS:"
echo "  ✅ Success: $SUCCESS/10"
echo "  ❌ Failed: $FAIL/10"
echo "  ⚠️  503 Errors: $ERROR_503/10"
echo "=========================================="

if [ $ERROR_503 -eq 0 ] && [ $SUCCESS -ge 9 ]; then
  echo "🎉 SUCCESS - 503 error resolved!"
  exit 0
else
  echo "⚠️  NEEDS IMPROVEMENT"
  if [ $ERROR_503 -gt 0 ]; then
    echo "  - 503 errors still occurring"
  fi
  if [ $SUCCESS -lt 9 ]; then
    echo "  - Success rate below 90%"
  fi
  exit 1
fi
