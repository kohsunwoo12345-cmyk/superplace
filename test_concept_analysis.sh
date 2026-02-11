#!/bin/bash
echo "=== 🧪 부족한 개념 분석 POST 테스트 ==="
echo ""
echo "학생 157로 새로운 분석 실행..."
echo ""
curl -X POST "https://superplacestudy.pages.dev/api/students/weak-concepts" \
  -H "Content-Type: application/json" \
  -d '{"studentId": 157}' \
  -s | jq '{success, weakConceptsCount: (.weakConcepts | length), recommendationsCount: (.recommendations | length), summaryLength: (.summary | length), chatCount, homeworkCount}'
