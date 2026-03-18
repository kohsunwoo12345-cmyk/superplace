#!/bin/bash

echo "=== 출석 코드 마이그레이션 실행 ==="
echo ""
echo "⏳ 배포 대기 (60초)..."
sleep 60

echo ""
echo "🚀 마이그레이션 실행..."
RESULT=$(curl -s -X POST "https://suplacestudy.com/api/admin/migrate-attendance-codes")

echo "$RESULT" | python3 -m json.tool

SUCCESS=$(echo "$RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success',False))" 2>/dev/null)

if [ "$SUCCESS" = "True" ]; then
  echo ""
  echo "✅ 마이그레이션 성공!"
  
  # 통계 출력
  echo "$RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'stats' in data:
    stats = data['stats']
    print(f'총 레코드: {stats.get(\"total\", 0)}')
    print(f'업데이트됨: {stats.get(\"updated\", 0)}')
    print(f'건너뜀: {stats.get(\"skipped\", 0)}')
    print(f'실패: {stats.get(\"failed\", 0)}')
"
  
  echo ""
  echo "🧪 기존 학생 테스트..."
  # 기존 학생 ID 1로 테스트
  TEST_CODE=$(curl -s "https://suplacestudy.com/api/attendance/code?userId=1" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('code',''))" 2>/dev/null)
  
  if [ -n "$TEST_CODE" ]; then
    echo "기존 학생(ID=1) 코드: $TEST_CODE"
    
    VERIFY=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
      -H "Content-Type: application/json" \
      -d "{\"code\":\"$TEST_CODE\"}")
    
    VERIFY_SUCCESS=$(echo "$VERIFY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success',False))" 2>/dev/null)
    
    if [ "$VERIFY_SUCCESS" = "True" ]; then
      echo "✅ 기존 학생 출석 코드 정상 작동!"
    else
      echo "❌ 기존 학생 출석 여전히 실패"
      echo "$VERIFY" | python3 -m json.tool
    fi
  fi
else
  echo ""
  echo "❌ 마이그레이션 실패"
fi

