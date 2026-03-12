#!/bin/bash

echo "=========================================="
echo "숙제 채점 모델명 수정"
echo "=========================================="
echo ""

# 1. 현재 설정 확인
echo "1. 현재 설정 확인"
echo "------------------------------------------"
CURRENT_CONFIG=$(curl -s "https://superplacestudy.pages.dev/api/admin/homework-grading-config")
echo "$CURRENT_CONFIG" | jq '.config | {model, temperature, systemPrompt: (.systemPrompt | length)}' 2>/dev/null
echo ""

# 2. 올바른 모델명으로 변경 (deepseek-chat)
echo "2. 모델명을 'deepseek-chat'으로 변경"
echo "------------------------------------------"

SYSTEM_PROMPT=$(echo "$CURRENT_CONFIG" | jq -r '.config.systemPrompt')
TEMPERATURE=$(echo "$CURRENT_CONFIG" | jq -r '.config.temperature')
MAX_TOKENS=$(echo "$CURRENT_CONFIG" | jq -r '.config.maxTokens')
ENABLE_RAG=$(echo "$CURRENT_CONFIG" | jq -r '.config.enableRAG')

UPDATE_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/admin/homework-grading-config" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"deepseek-chat\",
    \"systemPrompt\": $(echo "$CURRENT_CONFIG" | jq '.config.systemPrompt'),
    \"temperature\": $TEMPERATURE,
    \"maxTokens\": $MAX_TOKENS,
    \"enableRAG\": $ENABLE_RAG,
    \"topK\": 40,
    \"topP\": 0.95
  }")

echo "$UPDATE_RESPONSE" | jq '.' 2>/dev/null
echo ""

# 3. 변경 확인
echo "3. 변경 후 설정 확인"
echo "------------------------------------------"
UPDATED_CONFIG=$(curl -s "https://superplacestudy.pages.dev/api/admin/homework-grading-config")
echo "$UPDATED_CONFIG" | jq '.config | {model, temperature, enableRAG}' 2>/dev/null
echo ""

NEW_MODEL=$(echo "$UPDATED_CONFIG" | jq -r '.config.model')
if [[ "$NEW_MODEL" == "deepseek-chat" ]]; then
    echo "✅ 성공: 모델명이 'deepseek-chat'으로 변경되었습니다."
else
    echo "❌ 실패: 모델명이 여전히 '$NEW_MODEL'입니다."
fi
echo ""

# 4. 환경 변수 확인
echo "4. DeepSeek API 키 확인"
echo "------------------------------------------"
DEBUG_INFO=$(curl -s "https://superplacestudy.pages.dev/api/homework/debug")
HAS_KEY=$(echo "$DEBUG_INFO" | jq -r '.env.hasDeepSeekApiKey' 2>/dev/null)

if [[ "$HAS_KEY" == "true" ]]; then
    echo "✅ DEEPSEEK_API_KEY 설정됨"
else
    echo "❌ DEEPSEEK_API_KEY 미설정"
    echo "   Cloudflare Pages 환경 변수에 DEEPSEEK_API_KEY를 추가하세요."
fi
echo ""

echo "=========================================="
echo "완료"
echo "=========================================="

