#!/bin/bash

echo "🔍 학생/원장 계정 오류 진단"
echo "===================================="

echo ""
echo "📋 확인이 필요한 정보:"
echo "-----------------------------------"
echo "1. 학생/원장 계정에서 발생하는 정확한 오류 메시지"
echo "2. 브라우저 콘솔(F12 → Console)의 에러 로그"
echo "3. 네트워크 탭(F12 → Network)의 API 요청/응답"
echo ""

echo "🧪 가능한 원인들:"
echo "-----------------------------------"
echo "1. ❌ API 요청에 필요한 인증 토큰/세션이 누락"
echo "2. ❌ botId가 학생/원장 계정과 연결되지 않음"
echo "3. ❌ academyId 필터링 문제 (봇이 다른 학원 소속)"
echo "4. ❌ 프론트엔드에서 conversationHistory 형식 오류"
echo "5. ❌ CORS 또는 권한 검증 실패"
echo ""

echo "🔧 디버깅 방법:"
echo "-----------------------------------"
echo ""
echo "A. 브라우저에서 확인:"
echo "  1. F12 (개발자 도구 열기)"
echo "  2. Console 탭 → 빨간색 에러 확인"
echo "  3. Network 탭 → ai-chat 요청 클릭"
echo "  4. Response 탭에서 실제 에러 메시지 확인"
echo ""
echo "B. 실제 요청 복사해서 테스트:"
echo "  1. Network 탭에서 ai-chat 요청 우클릭"
echo "  2. 'Copy as cURL' 선택"
echo "  3. 터미널에 붙여넣기 (토큰 포함된 실제 요청)"
echo ""

echo "🧪 임시 디버깅 방법:"
echo "-----------------------------------"
echo ""
echo "# 학생 계정으로 로그인한 상태에서 다음 코드를 브라우저 콘솔에 입력:"
cat << 'JSEOF'

// 1. 현재 사용자 정보 확인
fetch('/api/auth/session')
  .then(r => r.json())
  .then(data => console.log('세션 정보:', data));

// 2. 봇 목록 조회
fetch('/api/ai-bots/list')
  .then(r => r.json())
  .then(data => console.log('봇 목록:', data));

// 3. AI 챗 API 직접 호출 (봇 ID는 실제 사용 중인 것으로 교체)
fetch('/api/ai-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: '안녕하세요',
    botId: 'bot-1773803533575-qrn2pluec',
    conversationHistory: []
  })
})
.then(r => r.json())
.then(data => console.log('AI 챗 응답:', data))
.catch(err => console.error('AI 챗 에러:', err));

JSEOF

echo ""
echo "===================================="
echo ""
echo "📊 AI 봇 API 엔드포인트 확인:"
echo "-----------------------------------"

# AI 봇 목록 API가 있는지 확인
if [ -f "functions/api/ai-bots/list.ts" ]; then
  echo "✅ /api/ai-bots/list 존재"
else
  echo "⚠️ /api/ai-bots/list 없음"
fi

# AI 챗 API 권한 확인
echo ""
echo "📝 ai-chat.ts 권한 검증 로직 확인:"
grep -n "userId\|session\|auth" functions/api/ai-chat.ts | head -20

echo ""
echo "===================================="
