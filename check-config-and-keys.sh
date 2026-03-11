#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     환경 변수 및 설정 확인                                   ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

CONFIG_URL="https://superplacestudy.pages.dev/api/admin/homework-grading-config"

echo "1️⃣  현재 homework_grading_config 설정"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CONFIG=$(curl -s "$CONFIG_URL")
echo "$CONFIG" | jq '.config | {model, temperature, enableRAG, systemPrompt: (.systemPrompt | .[0:100] + "...")}'

CURRENT_MODEL=$(echo "$CONFIG" | jq -r '.config.model')

echo ""
echo "현재 선택된 모델: $CURRENT_MODEL"
echo ""

if [[ "$CURRENT_MODEL" == deepseek* ]]; then
  echo "⚠️  DeepSeek 모델이 선택되어 있습니다."
  echo "   필요한 환경 변수: DEEPSEEK_API_KEY"
  echo ""
  echo "옵션 1: DeepSeek API 키 설정"
  echo "   - Cloudflare Pages → Settings → Environment Variables"
  echo "   - 변수 이름: DEEPSEEK_API_KEY"
  echo "   - 값: sk-xxxxxxxxxx"
  echo ""
  echo "옵션 2: Gemini 모델로 변경 (GOOGLE_GEMINI_API_KEY 사용)"
  echo "   - 모델을 gemini-2.5-flash로 변경"
  echo ""
  
  echo "2️⃣  Gemini 모델로 임시 변경 테스트"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  UPDATE_RESPONSE=$(curl -s -X POST "$CONFIG_URL" \
    -H "Content-Type: application/json" \
    -d '{
      "model": "gemini-2.5-flash",
      "systemPrompt": "당신은 전문 교사입니다. 제공된 숙제 이미지를 정확하게 분석하여 채점하세요.",
      "temperature": 0.3,
      "maxTokens": 4000,
      "enableRAG": 0
    }')
  
  echo "$UPDATE_RESPONSE" | jq '.'
  
  echo ""
  echo "3️⃣  변경된 설정 확인"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  VERIFY_CONFIG=$(curl -s "$CONFIG_URL")
  UPDATED_MODEL=$(echo "$VERIFY_CONFIG" | jq -r '.config.model')
  
  echo "변경된 모델: $UPDATED_MODEL"
  echo ""
  
  if [ "$UPDATED_MODEL" = "gemini-2.5-flash" ]; then
    echo "✅ Gemini 모델로 변경되었습니다."
    echo "   GOOGLE_GEMINI_API_KEY 환경 변수를 사용합니다."
    echo ""
    
    echo "4️⃣  Gemini 모델로 채점 테스트"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    SUBMIT_URL="https://superplacestudy.pages.dev/api/homework/submit"
    TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    SUBMIT_RESPONSE=$(curl -s -X POST "$SUBMIT_URL" \
      -H "Content-Type: application/json" \
      -d "{\"userId\": 1, \"images\": [\"$TEST_IMAGE\"]}")
    
    echo "$SUBMIT_RESPONSE" | jq '.'
    SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id')
    
    if [ -n "$SUBMISSION_ID" ]; then
      echo ""
      echo "제출 ID: $SUBMISSION_ID"
      echo "15초 대기 후 결과 확인..."
      sleep 15
      
      STATUS_URL="https://superplacestudy.pages.dev/api/homework/status/$SUBMISSION_ID"
      STATUS_RESPONSE=$(curl -s "$STATUS_URL")
      
      echo "$STATUS_RESPONSE" | jq '.status, .grading.score, .grading.subject'
      
      GRADING_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
      
      if [ "$GRADING_STATUS" = "graded" ]; then
        SCORE=$(echo "$STATUS_RESPONSE" | jq -r '.grading.score')
        echo ""
        echo "🎉 Gemini 자동 채점 성공!"
        echo "📊 점수: $SCORE점"
      else
        echo ""
        echo "⏳ 아직 채점 중... (20초 추가 대기)"
        sleep 20
        
        STATUS_RESPONSE2=$(curl -s "$STATUS_URL")
        GRADING_STATUS2=$(echo "$STATUS_RESPONSE2" | jq -r '.status')
        
        if [ "$GRADING_STATUS2" = "graded" ]; then
          SCORE=$(echo "$STATUS_RESPONSE2" | jq -r '.grading.score')
          echo "🎉 Gemini 자동 채점 성공! (지연)"
          echo "📊 점수: $SCORE점"
        else
          echo "❌ 채점 실패"
          
          echo ""
          echo "수동 트리거 테스트..."
          MANUAL=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/process-grading" \
            -H "Content-Type: application/json" \
            -d "{\"submissionId\": \"$SUBMISSION_ID\"}")
          
          echo "$MANUAL" | jq '.'
        fi
      fi
    fi
  fi
  
elif [[ "$CURRENT_MODEL" == gemini* ]]; then
  echo "✅ Gemini 모델이 선택되어 있습니다."
  echo "   사용 환경 변수: GOOGLE_GEMINI_API_KEY"
  echo ""
  
  echo "2️⃣  Gemini 모델 채점 테스트"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  SUBMIT_URL="https://superplacestudy.pages.dev/api/homework/submit"
  TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  
  SUBMIT_RESPONSE=$(curl -s -X POST "$SUBMIT_URL" \
    -H "Content-Type: application/json" \
    -d "{\"userId\": 1, \"images\": [\"$TEST_IMAGE\"]}")
  
  echo "$SUBMIT_RESPONSE" | jq '.'
  SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id')
  
  echo ""
  echo "15초 대기..."
  sleep 15
  
  STATUS_URL="https://superplacestudy.pages.dev/api/homework/status/$SUBMISSION_ID"
  STATUS_RESPONSE=$(curl -s "$STATUS_URL")
  
  GRADING_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status')
  
  if [ "$GRADING_STATUS" = "graded" ]; then
    SCORE=$(echo "$STATUS_RESPONSE" | jq -r '.grading.score')
    echo "🎉 자동 채점 성공!"
    echo "📊 점수: $SCORE점"
  else
    echo "⏳ 아직 채점 중..."
  fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "=== 확인 완료 ==="

