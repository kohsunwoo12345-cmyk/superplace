#!/bin/bash

echo "=== 모든 학생 출석 코드 재생성 ==="
echo ""

echo "🔄 일괄 생성 API 실행..."
RESPONSE=$(curl -s -X POST "https://suplacestudy.com/api/admin/generate-all-attendance-codes")
echo "$RESPONSE" | jq '.'
echo ""

# Extract stats
CREATED=$(echo "$RESPONSE" | jq -r '.stats.created // 0')
echo "✅ 새로 생성된 코드: $CREATED개"
echo ""

if [ "$CREATED" -gt 0 ]; then
  echo "📋 생성된 학생 목록:"
  echo "$RESPONSE" | jq -r '.createdStudents[]? | "  - ID: \(.userId), 코드: \(.code)"'
fi
