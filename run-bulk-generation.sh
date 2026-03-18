#!/bin/bash

echo "=== 모든 학생 출석 코드 일괄 생성 ==="
echo ""
echo "⏳ 배포 대기 (180초)..."
sleep 180

echo ""
echo "🚀 일괄 생성 실행..."
RESULT=$(curl -s -X POST "https://suplacestudy.com/api/admin/generate-all-attendance-codes")

echo "$RESULT" | python3 -m json.tool

echo ""
echo "=== 통계 ==="
echo "$RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if 'stats' in data:
    stats = data['stats']
    print(f'총 학생 수: {stats.get(\"totalStudents\", 0)}')
    print(f'코드 보유 학생: {stats.get(\"studentsWithCodes\", 0)}')
    print(f'코드 필요 학생: {stats.get(\"studentsNeedingCodes\", 0)}')
    print(f'생성 완료: {stats.get(\"created\", 0)}')
    print(f'실패: {stats.get(\"failed\", 0)}')
"

echo ""
echo "🧪 검증: 무작위 학생 5명 테스트"
for ID in 1 2 3 10 20; do
  CODE=$(curl -s "https://suplacestudy.com/api/attendance/code?userId=$ID" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('code',''))" 2>/dev/null)
  if [ -n "$CODE" ] && [ "$CODE" != "None" ] && [ "$CODE" != "null" ]; then
    echo "  학생 ID $ID: ✅ 코드 있음 ($CODE)"
  else
    echo "  학생 ID $ID: ⚠️ 코드 없음 (STUDENT 역할이 아니거나 데이터 없음)"
  fi
done

