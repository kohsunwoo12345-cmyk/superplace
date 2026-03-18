#!/bin/bash

echo "⏳ 배포 대기 중 (3분)..."
sleep 180

echo ""
echo "🧪 최종 채점 테스트 시작..."
echo ""

PHONE="01051363624"

# 1. 숙제 제출
echo "1️⃣ 숙제 제출..."
SUBMIT_RESULT=$(curl -s -X POST "https://suplacestudy.com/api/homework-v2/submit" \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"images\": [\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==\"]
  }")

SUBMISSION_ID=$(echo "$SUBMIT_RESULT" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data.get('submission',{}).get('id',''))" 2>/dev/null)

if [ -z "$SUBMISSION_ID" ]; then
  echo "❌ 제출 실패"
  exit 1
fi

echo "✅ 제출 ID: $SUBMISSION_ID"
echo ""

# 2. 채점 대기
echo "⏳ 채점 대기 중 (15초)..."
sleep 15

# 3. 결과 조회
echo ""
echo "2️⃣ 채점 결과 조회..."
TOKEN="test-token"
DEBUG_RESULT=$(curl -s "https://suplacestudy.com/api/homework/debug-submission?submissionId=$SUBMISSION_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "📊 채점 결과:"
echo "$DEBUG_RESULT" | python3 -m json.tool | head -80

# problemAnalysis 확인
HAS_ANALYSIS=$(echo "$DEBUG_RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
grading = data.get('grading', {})
analysis = grading.get('problemAnalysis', '[]')
if isinstance(analysis, str):
    import json as j
    analysis = j.loads(analysis)
print('yes' if analysis and len(analysis) > 0 else 'no')
" 2>/dev/null)

echo ""
if [ "$HAS_ANALYSIS" == "yes" ]; then
  echo "✅ problemAnalysis 데이터 있음!"
  echo "$DEBUG_RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
grading = data.get('grading', {})
analysis = grading.get('problemAnalysis', '[]')
if isinstance(analysis, str):
    import json as j
    analysis = j.loads(analysis)
print(f'📝 문제 분석 개수: {len(analysis)}개')
"
else
  echo "❌ problemAnalysis 데이터 없음 (여전히 빈 배열)"
fi

# weaknessTypes 확인
HAS_WEAKNESS=$(echo "$DEBUG_RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
grading = data.get('grading', {})
weakness = grading.get('weaknessTypes', '[]')
if isinstance(weakness, str):
    import json as j
    weakness = j.loads(weakness)
print('yes' if weakness and len(weakness) > 0 else 'no')
" 2>/dev/null)

echo ""
if [ "$HAS_WEAKNESS" == "yes" ]; then
  echo "✅ weaknessTypes 데이터 있음!"
else
  echo "❌ weaknessTypes 데이터 없음"
fi

echo ""
echo "🏁 최종 테스트 완료"
