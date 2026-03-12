#!/bin/bash

echo "=========================================="
echo "숙제 채점 모델을 Novita AI (deepseek/deepseek-ocr-2)로 변경"
echo "=========================================="
echo ""

# 1. 현재 설정 확인
echo "1. 현재 설정 확인"
echo "------------------------------------------"
CURRENT_CONFIG=$(curl -s "https://superplacestudy.pages.dev/api/admin/homework-grading-config")
echo "$CURRENT_CONFIG" | jq '.config | {model, temperature, systemPrompt: (.systemPrompt | length)}'
echo ""

# 2. deepseek/deepseek-ocr-2로 변경
echo "2. 모델을 'deepseek/deepseek-ocr-2'로 변경"
echo "------------------------------------------"

SYSTEM_PROMPT=$(echo "$CURRENT_CONFIG" | jq -r '.config.systemPrompt')
TEMPERATURE=$(echo "$CURRENT_CONFIG" | jq -r '.config.temperature')
MAX_TOKENS=$(echo "$CURRENT_CONFIG" | jq -r '.config.maxTokens')
ENABLE_RAG=$(echo "$CURRENT_CONFIG" | jq -r '.config.enableRAG')

UPDATE_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/admin/homework-grading-config" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"deepseek/deepseek-ocr-2\",
    \"systemPrompt\": $(echo "$CURRENT_CONFIG" | jq '.config.systemPrompt'),
    \"temperature\": $TEMPERATURE,
    \"maxTokens\": $MAX_TOKENS,
    \"enableRAG\": $ENABLE_RAG,
    \"topK\": 40,
    \"topP\": 0.95
  }")

echo "$UPDATE_RESPONSE" | jq '.'
echo ""

# 3. 변경 확인
echo "3. 변경 후 설정 확인"
echo "------------------------------------------"
UPDATED_CONFIG=$(curl -s "https://superplacestudy.pages.dev/api/admin/homework-grading-config")
NEW_MODEL=$(echo "$UPDATED_CONFIG" | jq -r '.config.model')
echo "현재 모델: $NEW_MODEL"
echo "$UPDATED_CONFIG" | jq '.config | {model, temperature, enableRAG}'
echo ""

if [[ "$NEW_MODEL" == "deepseek/deepseek-ocr-2" ]]; then
    echo "✅ 성공: 모델이 'deepseek/deepseek-ocr-2'로 변경되었습니다."
else
    echo "❌ 실패: 모델이 여전히 '$NEW_MODEL'입니다."
fi
echo ""

echo "=========================================="
echo "완료"
echo "=========================================="

