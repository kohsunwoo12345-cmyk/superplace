#!/bin/bash

echo "🧪 직접 테스트 시작"
echo "======================================"

# 1. API 테스트
echo ""
echo "1️⃣ API 상태 확인..."
ADMIN_TOKEN="1|admin@superplace.co.kr|ADMIN|$(date +%s)000"
API_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

SUCCESS=$(echo "$API_RESPONSE" | jq -r '.success')
ERROR=$(echo "$API_RESPONSE" | jq -r '.error // "none"')
MESSAGE=$(echo "$API_RESPONSE" | jq -r '.message // "none"')

echo "API 성공: $SUCCESS"
echo "오류: $ERROR"
if [ "$MESSAGE" != "none" ]; then
    echo "메시지: $MESSAGE"
fi

if [ "$SUCCESS" = "true" ]; then
    echo ""
    echo "✅ API 정상 작동!"
    
    TOTAL=$(echo "$API_RESPONSE" | jq -r '.statistics.totalSubmissions')
    GRADED=$(echo "$API_RESPONSE" | jq -r '.statistics.gradedSubmissions')
    PENDING=$(echo "$API_RESPONSE" | jq -r '.statistics.pendingSubmissions')
    AVG_SCORE=$(echo "$API_RESPONSE" | jq -r '.statistics.averageScore')
    
    echo ""
    echo "📊 통계:"
    echo "  전체 제출: $TOTAL"
    echo "  채점 완료: $GRADED"
    echo "  대기 중: $PENDING"
    echo "  평균 점수: ${AVG_SCORE}점"
    
    if [ "$TOTAL" -gt 0 ]; then
        echo ""
        echo "📝 최근 제출 5건:"
        echo "$API_RESPONSE" | jq -r '.results[0:5] | .[] | "  - \(.userName): \(.grading.score)점 (\(.submittedAt))"'
        
        echo ""
        echo "🔍 첫 번째 제출 상세:"
        echo "$API_RESPONSE" | jq '.results[0] | {
          id: .submissionId,
          student: .userName,
          submitted: .submittedAt,
          status: .status,
          imageCount: .imageCount,
          grading: {
            score: .grading.score,
            subject: .grading.subject,
            total: .grading.totalQuestions,
            correct: .grading.correctAnswers
          }
        }'
    else
        echo ""
        echo "ℹ️ 아직 제출된 숙제가 없습니다"
    fi
    
    # 2. 새 숙제 제출 테스트
    echo ""
    echo ""
    echo "2️⃣ 새 숙제 제출 테스트..."
    
    # 출석 확인으로 사용자 정보 가져오기
    USER_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/attendance/verify" \
      -H "Content-Type: application/json" \
      -d '{"code": "402246"}')
    
    USER_ID=$(echo "$USER_RESPONSE" | jq -r '.student.id // empty')
    USER_NAME=$(echo "$USER_RESPONSE" | jq -r '.student.name // empty')
    
    if [ -n "$USER_ID" ]; then
        echo "✅ 사용자 확인: $USER_NAME (ID: $USER_ID)"
        
        # 간단한 테스트 이미지
        TEST_IMAGE="iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNk+M9Qz0AEYBxVSF+FABJADveWkH6oAAAAAElFTkSuQmCC"
        
        echo "📤 숙제 제출 중..."
        SUBMIT_RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/homework/submit" \
          -H "Content-Type: application/json" \
          -d "{
            \"userId\": \"$USER_ID\",
            \"code\": \"402246\",
            \"images\": [\"$TEST_IMAGE\"]
          }")
        
        SUBMIT_SUCCESS=$(echo "$SUBMIT_RESPONSE" | jq -r '.success')
        SUBMISSION_ID=$(echo "$SUBMIT_RESPONSE" | jq -r '.submission.id // empty')
        
        if [ "$SUBMIT_SUCCESS" = "true" ] && [ -n "$SUBMISSION_ID" ]; then
            echo "✅ 제출 성공: $SUBMISSION_ID"
            echo "⏳ 채점 대기 중 (30초)..."
            sleep 30
            
            echo ""
            echo "📊 채점 결과 확인..."
            RESULT_RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
              -H "Authorization: Bearer ${ADMIN_TOKEN}")
            
            NEW_TOTAL=$(echo "$RESULT_RESPONSE" | jq -r '.statistics.totalSubmissions')
            echo "  제출 건수 변화: $TOTAL → $NEW_TOTAL"
            
            # 방금 제출한 것 찾기
            MY_RESULT=$(echo "$RESULT_RESPONSE" | jq --arg id "$SUBMISSION_ID" '.results[] | select(.submissionId == $id)')
            
            if [ -n "$MY_RESULT" ]; then
                MY_SCORE=$(echo "$MY_RESULT" | jq -r '.grading.score')
                MY_STATUS=$(echo "$MY_RESULT" | jq -r '.status')
                echo ""
                echo "✅ 새 제출 확인됨:"
                echo "  - 상태: $MY_STATUS"
                echo "  - 점수: ${MY_SCORE}점"
            else
                echo ""
                echo "⚠️ 새 제출이 아직 결과에 나타나지 않음"
            fi
        else
            echo "❌ 제출 실패"
            echo "$SUBMIT_RESPONSE" | jq '.'
        fi
    else
        echo "⚠️ 사용자 정보를 가져올 수 없음 (코드 402246)"
    fi
    
else
    echo ""
    echo "❌ API 오류 발생"
    echo ""
    echo "전체 응답:"
    echo "$API_RESPONSE" | jq '.'
fi

echo ""
echo "======================================"
echo "🎯 테스트 완료"
echo "======================================"

