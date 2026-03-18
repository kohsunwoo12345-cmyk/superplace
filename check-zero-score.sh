#!/bin/bash

echo "🔍 0점 제출 데이터 조회..."
echo ""

TOKEN="test-token"

# 최근 제출 데이터 조회
RESULTS=$(curl -s "https://suplacestudy.com/api/homework/results" \
  -H "Authorization: Bearer $TOKEN")

echo "📊 최근 제출 목록:"
echo "$RESULTS" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('results'):
    for i, r in enumerate(data['results'][:5]):
        sub = r.get('submission', {})
        grad = r.get('grading', {})
        print(f'''
제출 {i+1}:
  ID: {sub.get('id', 'N/A')}
  학생: {sub.get('userName', '이름 없음')}
  점수: {grad.get('score', 0)}점
  과목: {grad.get('subject', '미지정')}
  제출시간: {sub.get('submittedAt', 'N/A')}
  상태: {sub.get('status', 'N/A')}
  ''')
else:
    print('결과 없음')
"

echo ""
echo "✅ 조회 완료"
