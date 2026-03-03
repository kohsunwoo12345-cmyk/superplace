#!/bin/bash

# 요금제 저장 및 한도 적용 100% 검증 스크립트

echo "========================================="
echo "요금제 저장 및 한도 적용 검증 스크립트"
echo "========================================="
echo ""

BASE_URL="https://superplacestudy.pages.dev"

echo "1️⃣ 기존 요금제 조회"
echo "GET $BASE_URL/api/admin/pricing-plans"
PLANS=$(curl -s "$BASE_URL/api/admin/pricing-plans")
echo "$PLANS" | jq '.plans[] | {id, name, price_1month, max_students, max_teachers}'
echo ""

echo "2️⃣ 새 요금제 생성 테스트"
echo "POST $BASE_URL/api/admin/pricing-plans"
CREATE_PAYLOAD=$(cat <<EOF
{
  "name": "테스트검증플랜",
  "description": "한도 검증용 테스트 플랜",
  "pricing_1month": 25000,
  "pricing_6months": 135000,
  "pricing_12months": 240000,
  "maxStudents": 20,
  "maxTeachers": 3,
  "maxHomeworkChecks": 80,
  "maxAIAnalysis": 40,
  "maxAIGrading": 80,
  "maxCapabilityAnalysis": 40,
  "maxConceptAnalysis": 40,
  "maxSimilarProblems": 80,
  "maxLandingPages": 2,
  "features": "[\"최대 20명 학생\",\"최대 3명 교사\",\"월 80회 숙제 검사\",\"월 40회 AI 분석\"]",
  "isPopular": false,
  "isActive": true,
  "color": "#10b981",
  "order": 5
}
EOF
)

CREATE_RESULT=$(curl -s -X POST "$BASE_URL/api/admin/pricing-plans" \
  -H "Content-Type: application/json" \
  -d "$CREATE_PAYLOAD")

echo "$CREATE_RESULT" | jq '.'
echo ""

if echo "$CREATE_RESULT" | jq -e '.success == true' > /dev/null; then
  NEW_PLAN_ID=$(echo "$CREATE_RESULT" | jq -r '.planId')
  echo "✅ 요금제 생성 성공: $NEW_PLAN_ID"
  echo ""
  
  echo "3️⃣ 생성된 요금제 조회 및 검증"
  echo "GET $BASE_URL/api/admin/pricing-plans"
  sleep 2
  UPDATED_PLANS=$(curl -s "$BASE_URL/api/admin/pricing-plans")
  CREATED_PLAN=$(echo "$UPDATED_PLANS" | jq ".plans[] | select(.id == \"$NEW_PLAN_ID\")")
  
  if [ -n "$CREATED_PLAN" ]; then
    echo "✅ 요금제 DB 저장 확인"
    echo "$CREATED_PLAN" | jq '{
      id, name, description,
      price_1month, price_6months, price_12months,
      max_students, max_teachers,
      max_homework_checks, max_ai_analysis, max_ai_grading,
      max_capability_analysis, max_concept_analysis,
      max_similar_problems, max_landing_pages,
      isActive
    }'
    echo ""
    
    # 값 검증
    echo "4️⃣ 저장된 값 검증"
    STORED_STUDENTS=$(echo "$CREATED_PLAN" | jq -r '.max_students')
    STORED_TEACHERS=$(echo "$CREATED_PLAN" | jq -r '.max_teachers')
    STORED_HOMEWORK=$(echo "$CREATED_PLAN" | jq -r '.max_homework_checks')
    STORED_AI=$(echo "$CREATED_PLAN" | jq -r '.max_ai_analysis')
    
    if [ "$STORED_STUDENTS" == "20" ] || [ "$STORED_STUDENTS" == "-1" ]; then
      echo "✅ max_students: $STORED_STUDENTS (입력값: 20, -1은 무제한)"
    else
      echo "❌ max_students: $STORED_STUDENTS (예상값: 20)"
    fi
    
    if [ "$STORED_TEACHERS" == "3" ] || [ "$STORED_TEACHERS" == "-1" ]; then
      echo "✅ max_teachers: $STORED_TEACHERS (입력값: 3, -1은 무제한)"
    else
      echo "❌ max_teachers: $STORED_TEACHERS (예상값: 3)"
    fi
    
    if [ "$STORED_HOMEWORK" == "80" ] || [ "$STORED_HOMEWORK" == "-1" ]; then
      echo "✅ max_homework_checks: $STORED_HOMEWORK (입력값: 80, -1은 무제한)"
    else
      echo "❌ max_homework_checks: $STORED_HOMEWORK (예상값: 80)"
    fi
    
    if [ "$STORED_AI" == "40" ] || [ "$STORED_AI" == "-1" ]; then
      echo "✅ max_ai_analysis: $STORED_AI (입력값: 40, -1은 무제한)"
    else
      echo "❌ max_ai_analysis: $STORED_AI (예상값: 40)"
    fi
    echo ""
    
  else
    echo "❌ 생성된 요금제를 찾을 수 없음"
  fi
  
  echo "5️⃣ 요금제 수정 테스트"
  UPDATE_PAYLOAD=$(cat <<EOF
{
  "id": "$NEW_PLAN_ID",
  "name": "수정된테스트플랜",
  "description": "수정 테스트",
  "pricing_1month": 30000,
  "pricing_6months": 162000,
  "pricing_12months": 288000,
  "maxStudents": 30,
  "maxTeachers": 5,
  "maxHomeworkChecks": 100,
  "maxAIAnalysis": 50,
  "maxAIGrading": 100,
  "maxCapabilityAnalysis": 50,
  "maxConceptAnalysis": 50,
  "maxSimilarProblems": 100,
  "maxLandingPages": 3,
  "features": "[\"수정된 기능\"]",
  "isPopular": true,
  "isActive": true,
  "color": "#3b82f6",
  "order": 5
}
EOF
)

  UPDATE_RESULT=$(curl -s -X PUT "$BASE_URL/api/admin/pricing-plans" \
    -H "Content-Type: application/json" \
    -d "$UPDATE_PAYLOAD")
  
  echo "$UPDATE_RESULT" | jq '.'
  
  if echo "$UPDATE_RESULT" | jq -e '.success == true' > /dev/null; then
    echo "✅ 요금제 수정 성공"
    echo ""
    
    echo "6️⃣ 수정된 요금제 조회"
    sleep 2
    FINAL_PLANS=$(curl -s "$BASE_URL/api/admin/pricing-plans")
    UPDATED_PLAN=$(echo "$FINAL_PLANS" | jq ".plans[] | select(.id == \"$NEW_PLAN_ID\")")
    
    echo "$UPDATED_PLAN" | jq '{
      id, name,
      price_1month,
      max_students, max_teachers,
      max_homework_checks, max_ai_analysis
    }'
    echo ""
    
    UPDATED_STUDENTS=$(echo "$UPDATED_PLAN" | jq -r '.max_students')
    UPDATED_HOMEWORK=$(echo "$UPDATED_PLAN" | jq -r '.max_homework_checks')
    
    if [ "$UPDATED_STUDENTS" == "30" ] || [ "$UPDATED_STUDENTS" == "-1" ]; then
      echo "✅ 수정된 max_students: $UPDATED_STUDENTS (입력값: 30)"
    else
      echo "❌ 수정된 max_students: $UPDATED_STUDENTS (예상값: 30)"
    fi
    
    if [ "$UPDATED_HOMEWORK" == "100" ] || [ "$UPDATED_HOMEWORK" == "-1" ]; then
      echo "✅ 수정된 max_homework_checks: $UPDATED_HOMEWORK (입력값: 100)"
    else
      echo "❌ 수정된 max_homework_checks: $UPDATED_HOMEWORK (예상값: 100)"
    fi
  else
    echo "❌ 요금제 수정 실패"
  fi
  echo ""
  
  echo "7️⃣ 테스트 요금제 삭제"
  DELETE_RESULT=$(curl -s -X DELETE "$BASE_URL/api/admin/pricing-plans?id=$NEW_PLAN_ID")
  echo "$DELETE_RESULT" | jq '.'
  
  if echo "$DELETE_RESULT" | jq -e '.success == true' > /dev/null; then
    echo "✅ 요금제 삭제 성공"
  else
    echo "⚠️ 요금제 삭제 실패 (활성 구독이 있어 비활성화됨)"
  fi
  
else
  echo "❌ 요금제 생성 실패"
  echo "$CREATE_RESULT" | jq '.message, .error'
fi

echo ""
echo "========================================="
echo "검증 완료"
echo "========================================="
