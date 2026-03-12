#!/bin/bash

echo "🔍 Novita AI API 직접 테스트"
echo "================================"

# 환경변수에서 API 키 가져오기
API_KEY=$(curl -s "https://superplacestudy.pages.dev/api/homework/debug" | jq -r '.environment.novitaKeyPrefix')

if [ "$API_KEY" = "NOT_SET" ]; then
    echo "❌ Novita API 키가 설정되지 않았습니다"
    exit 1
fi

echo "✅ API 키 발견: $API_KEY"
echo ""

# 모델 목록 확인
echo "1️⃣ 사용 가능한 모델 목록 조회..."
curl -s "https://api.novita.ai/v3/openai/models" \
  -H "Authorization: Bearer $(echo $API_KEY | cut -d'.' -f1)" \
  | jq '.data[] | select(.id | contains("deepseek")) | {id, created}' | head -20

echo ""
echo "2️⃣ deepseek/deepseek-ocr-2 모델로 테스트 요청..."

# 실제 이미지 테스트
if [ -f "homework_test.jpg" ]; then
    IMAGE_BASE64=$(base64 -w 0 homework_test.jpg | head -c 1000)
    echo "   이미지 준비 완료 (1000자 샘플)"
else
    echo "   ❌ homework_test.jpg 없음"
    exit 1
fi

echo ""
echo "================================"
