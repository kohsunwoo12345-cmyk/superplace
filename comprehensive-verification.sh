#!/bin/bash

echo "========================================"
echo "🔍 SuperPlaceStudy 전체 시스템 검증"
echo "========================================"
echo ""

BASE_URL="https://superplacestudy.pages.dev"
PYTHON_WORKER="https://physonsuperplacestudy.kohsunwoo12345.workers.dev"
STUDENT_ID="student-1772865101424-12ldfjns29zg"

# 1. 환경변수 확인
echo "1️⃣ 환경변수 확인..."
ENV_CHECK=$(curl -s "${BASE_URL}/api/homework/debug" | jq -r '.environment')
echo "   Novita API: $(echo "$ENV_CHECK" | jq -r '.hasNovitaApiKey')"
echo "   Novita Key Length: $(echo "$ENV_CHECK" | jq -r '.novitaApiKeyLength')"
echo "   Python Worker: $(echo "$ENV_CHECK" | jq -r '.hasPythonWorkerUrl')"
echo "   Python Worker URL: $(echo "$ENV_CHECK" | jq -r '.pythonWorkerUrl')"
echo ""

# 2. Python Worker /solve 엔드포인트 확인
echo "2️⃣ Python Worker /solve 엔드포인트 확인..."
SOLVE_TEST=$(curl -s -X POST "${PYTHON_WORKER}/solve" \
  -H "Content-Type: application/json" \
  -d '{"equation":"2+2"}' 2>&1)
echo "   Response: $SOLVE_TEST"
echo ""

# 3. RAG 설정 확인
echo "3️⃣ RAG 설정 확인..."
RAG_CONFIG=$(curl -s "${BASE_URL}/api/admin/homework-grading-config" | jq -r '.config')
echo "   EnableRAG: $(echo "$RAG_CONFIG" | jq -r '.enableRAG')"
echo "   KnowledgeBase Length: $(echo "$RAG_CONFIG" | jq -r '.knowledgeBase | length')"
echo "   Model: $(echo "$RAG_CONFIG" | jq -r '.model')"
echo ""

# 4. 출석 통계 API 확인
echo "4️⃣ 출석 통계 API 확인..."
ATTENDANCE=$(curl -s "${BASE_URL}/api/attendance/statistics?userId=${STUDENT_ID}&role=STUDENT")
echo "   Student Attendance Days: $(echo "$ATTENDANCE" | jq -r '.attendanceDays')"
ADMIN_ATTENDANCE=$(curl -s "${BASE_URL}/api/attendance/statistics")
echo "   Admin Total Students: $(echo "$ADMIN_ATTENDANCE" | jq -r '.totalStudents')"
echo "   Admin Month Attendance: $(echo "$ADMIN_ATTENDANCE" | jq -r '.monthAttendance')"
echo ""

# 5. 출석 페이지 UI 확인
echo "5️⃣ 출석 페이지 UI 확인..."
ATTENDANCE_PAGE=$(curl -s "${BASE_URL}/dashboard/attendance-statistics/")
if echo "$ATTENDANCE_PAGE" | grep -q "AttendanceStatistics"; then
    echo "   ✅ 출석 페이지 컴포넌트 존재"
else
    echo "   ❌ 출석 페이지 컴포넌트 없음"
fi
echo ""

# 6. 실제 숙제 이미지로 테스트
echo "6️⃣ 실제 숙제 이미지로 채점 테스트..."
if [ -f "homework_test.jpg" ]; then
    IMAGE_BASE64=$(base64 -w 0 homework_test.jpg)
    IMAGE_SIZE=$(stat -f%z homework_test.jpg 2>/dev/null || stat -c%s homework_test.jpg)
    echo "   이미지 크기: ${IMAGE_SIZE} bytes"
    
    SUBMIT_RESULT=$(curl -s -X POST "${BASE_URL}/api/homework/submit" \
      -H "Content-Type: application/json" \
      -d "{\"userId\":\"${STUDENT_ID}\",\"images\":[\"data:image/jpeg;base64,${IMAGE_BASE64}\"]}")
    
    SUBMISSION_ID=$(echo "$SUBMIT_RESULT" | jq -r '.submission.id')
    echo "   제출 ID: $SUBMISSION_ID"
    
    if [ "$SUBMISSION_ID" != "null" ] && [ -n "$SUBMISSION_ID" ]; then
        echo "   ⏳ 채점 대기 중 (최대 120초)..."
        
        for i in {1..24}; do
            sleep 5
            STATUS=$(curl -s "${BASE_URL}/api/homework/status/${SUBMISSION_ID}")
            GRADING_STATUS=$(echo "$STATUS" | jq -r '.submission.status')
            
            if [ "$GRADING_STATUS" = "graded" ]; then
                echo "   ✅ 채점 완료!"
                echo ""
                echo "   📊 채점 결과:"
                echo "      점수: $(echo "$STATUS" | jq -r '.grading.score')"
                echo "      과목: $(echo "$STATUS" | jq -r '.grading.subject')"
                echo "      전체 문제: $(echo "$STATUS" | jq -r '.grading.totalQuestions')"
                echo "      정답 수: $(echo "$STATUS" | jq -r '.grading.correctAnswers')"
                echo "      문제 분석 수: $(echo "$STATUS" | jq -r '.grading.problemAnalysis | length')"
                echo ""
                echo "   📝 문제별 상세 분석:"
                echo "$STATUS" | jq -r '.grading.problemAnalysis[] | "      문제 \(.problemNumber): \(.correctness) - \(.feedback)"'
                echo ""
                echo "   💬 전체 피드백:"
                echo "      $(echo "$STATUS" | jq -r '.grading.feedback')"
                echo ""
                
                # 문제 분석이 비어있는지 확인
                PROBLEM_COUNT=$(echo "$STATUS" | jq -r '.grading.problemAnalysis | length')
                if [ "$PROBLEM_COUNT" = "0" ] || [ "$PROBLEM_COUNT" = "null" ]; then
                    echo "   ⚠️  경고: 문제 분석이 비어있습니다!"
                    echo "   Novita AI API 호출이 실패했을 가능성이 높습니다."
                    echo "   Cloudflare Pages 로그를 확인하세요."
                fi
                break
            fi
            
            echo "      대기 중... ($((i*5))초)"
        done
        
        if [ "$GRADING_STATUS" != "graded" ]; then
            echo "   ❌ 채점 시간 초과 (120초)"
        fi
    else
        echo "   ❌ 제출 실패"
        echo "$SUBMIT_RESULT" | jq '.'
    fi
else
    echo "   ❌ homework_test.jpg 파일이 없습니다"
fi

echo ""
echo "========================================"
echo "검증 완료"
echo "========================================"
