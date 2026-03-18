#!/bin/bash

echo "=== 기존 학생 디버깅 ==="

# 여러 기존 학생 ID로 테스트
for STUDENT_ID in 1 2 3 4 5; do
  echo ""
  echo "학생 ID $STUDENT_ID:"
  
  # 1. 코드 조회
  CODE_RESP=$(curl -s "https://suplacestudy.com/api/attendance/code?userId=$STUDENT_ID")
  echo "  코드 응답: $CODE_RESP"
  
  CODE=$(echo "$CODE_RESP" | python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('code',''))" 2>/dev/null)
  echo "  추출된 코드: $CODE"
  
  if [ -n "$CODE" ] && [ "$CODE" != "null" ] && [ "$CODE" != "None" ]; then
    # 2. 출석 시도
    VERIFY=$(curl -s -X POST "https://suplacestudy.com/api/attendance/verify" \
      -H "Content-Type: application/json" \
      -d "{\"code\":\"$CODE\"}")
    
    SUCCESS=$(echo "$VERIFY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success',False))" 2>/dev/null)
    ERROR=$(echo "$VERIFY" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error',''))" 2>/dev/null)
    
    if [ "$SUCCESS" = "True" ]; then
      echo "  ✅ 출석 성공"
    else
      echo "  ❌ 출석 실패: $ERROR"
      echo "  전체 응답: $VERIFY"
    fi
  else
    echo "  ⚠️ 코드 없음"
  fi
done

