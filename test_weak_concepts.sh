#!/bin/bash
echo "🧪 부족한 개념 분석 테스트"
echo "================================"

# 토큰 필요 (임시로 빈 값 사용)
curl -X POST "https://superplacestudy.pages.dev/api/students/weak-concepts" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{"studentId":"3"}' \
  2>&1 | head -100
