#!/bin/bash
echo "🚀 배포 대기 및 종합 테스트"
echo "⏰ 3분 대기 중..."
sleep 180

echo ""
echo "✅ 배포 완료! 이제 실제 테스트를 시작합니다."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 1단계: 데이터베이스 상태 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1️⃣ MessageSendHistory 테이블 존재 확인:"
curl -s "https://superplacestudy.pages.dev/api/messages/history" \
  -H "Authorization: Bearer 1|wangholy1@naver.com|DIRECTOR" | python3 -c "import sys, json; data=json.load(sys.stdin); print('❌ 테이블 없음:', data.get('error', '')) if 'error' in data else print('✅ 테이블 있음')"

echo ""
echo "2️⃣ 현재 포인트 상태:"
curl -s 'https://superplacestudy.pages.dev/api/debug/point-transactions?userId=1' \
  -H 'Authorization: Bearer 1|wangholy1@naver.com|DIRECTOR' | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'💰 총 포인트: {data.get(\"totalPoints\", 0)}P'); print(f'📊 트랜잭션 수: {len(data.get(\"userTransactions\", []))}건')"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 2단계: 실제 발송 및 포인트 차감 테스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "테스트 파라미터:"
echo "  - userId: 1"
echo "  - email: wangholy1@naver.com"
echo "  - to: 01085328739"
echo "  - from: 01087399697"
echo ""
echo "발송 중..."
curl -s "https://superplacestudy.pages.dev/api/debug/test-send-and-deduct?userId=1&email=wangholy1@naver.com&to=01085328739&from=01087399697" | python3 -m json.tool

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 3단계: 발송 후 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "1️⃣ 포인트 차감 확인:"
curl -s 'https://superplacestudy.pages.dev/api/debug/point-transactions?userId=1' \
  -H 'Authorization: Bearer 1|wangholy1@naver.com|DIRECTOR' | python3 -c "
import sys, json
data = json.load(sys.stdin)
transactions = data.get('userTransactions', [])
print(f'💰 총 포인트: {data.get(\"totalPoints\", 0)}P')
print(f'📊 트랜잭션 수: {len(transactions)}건')
print('\n최근 트랜잭션:')
for t in transactions[:3]:
    amount = t.get('amount', 0)
    desc = t.get('description', '')
    created = t.get('createdAt', '')
    print(f'  • {amount:+d}P - {desc} ({created})')
"

echo ""
echo "2️⃣ 발송 이력 확인:"
curl -s "https://superplacestudy.pages.dev/api/messages/history" \
  -H "Authorization: Bearer 1|wangholy1@naver.com|DIRECTOR" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if 'error' in data:
        print('❌ 발송 이력 조회 실패:', data.get('message', ''))
        print('⚠️ MessageSendHistory 테이블을 생성해야 합니다!')
    else:
        history = data.get('history', [])
        print(f'📋 발송 이력: {len(history)}건')
        for h in history[:3]:
            print(f'  • {h.get(\"messageType\", \"\")} - {h.get(\"recipientCount\", 0)}명 - {h.get(\"pointsUsed\", 0)}P - {h.get(\"status\", \"\")}')
except Exception as e:
    print(f'❌ 파싱 오류: {e}')
"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 결과 요약"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ 확인사항:"
echo "  1. Solapi 발송 성공 여부 (statusCode: 2000)"
echo "  2. 포인트 차감 여부 (before - after = 40P)"
echo "  3. SMS 로그 저장 여부"
echo "  4. 포인트 트랜잭션 저장 여부"
echo "  5. 발송 이력 저장 여부"
echo ""
echo "❌ MessageSendHistory 테이블이 없다면:"
echo "  Cloudflare D1 Console에서 URGENT_FIX_DATABASE.sql 실행 필요"
echo ""
echo "🔗 Cloudflare D1 Console:"
echo "  https://dash.cloudflare.com/"
echo "  → Workers & Pages → superplacestudy → D1 → webapp-production → Console"
echo ""

