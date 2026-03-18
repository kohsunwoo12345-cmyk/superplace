#!/bin/bash

echo "============================================="
echo "출석부터 채점까지 RAG 작동 종합 테스트"
echo "============================================="
echo ""
echo "⏳ Cloudflare Pages 배포 대기 중 (3분)..."
sleep 180

echo ""
echo "=== 1단계: 출석 API 테스트 ==="
echo "📝 출석 코드 조회 엔드포인트 확인"
curl -X GET "https://suplacestudy.com/api/attendance/code?userId=test-user-123" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' || echo "출석 코드 API 응답"

echo ""
echo "=== 2단계: AI 챗봇 API 테스트 (RAG 확인) ==="
echo "📝 AI 챗봇 메시지 전송 (RAG 활성화 확인)"
curl -X POST "https://suplacestudy.com/api/ai-chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕하세요! 출석은 어떻게 하나요?",
    "botId": "bot-1773803533575-qrn2pluec",
    "userId": "test-user-123",
    "conversationHistory": []
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq -r '.reply // .error // .message // "응답 없음"' | head -5

echo ""
echo "=== 3단계: 숙제 채점 API 테스트 ==="
echo "📝 숙제 채점 엔드포인트 확인"
curl -X POST "https://suplacestudy.com/api/homework/grade" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrls": ["https://via.placeholder.com/800x600.png?text=Test+Homework"],
    "userId": "test-user-123",
    "subject": "수학",
    "grade": "중1"
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq -r '.success // false'

echo ""
echo "=== 4단계: RAG Worker 직접 테스트 ==="
echo "📝 RAG Worker 엔드포인트 직접 호출"
curl -X POST "https://physonsuperplacestudy.kohsunwoo12345.workers.dev/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "출석 시스템에 대해 설명해주세요",
    "systemPrompt": "당신은 학습 도우미입니다.",
    "useRAG": true
  }' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq -r '.response // .error // "응답 없음"' | head -5

echo ""
echo "============================================="
echo "✅ 종합 테스트 완료"
echo "============================================="
