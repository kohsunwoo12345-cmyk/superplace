#!/bin/bash

echo "🔍 최근 채점 데이터 확인..."
echo ""

# API 호출로 결과 조회
TOKEN="test-token"
RESULT=$(curl -s "https://suplacestudy.com/api/homework/debug-submission?submissionId=homework-1773863519285-5eu8z0gsw" \
  -H "Authorization: Bearer $TOKEN")

echo "📊 디버그 응답:"
echo "$RESULT" | python3 -m json.tool

echo ""
echo "✅ 테스트 완료"
