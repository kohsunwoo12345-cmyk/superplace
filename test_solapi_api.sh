#!/bin/bash

echo "=== Solapi 카카오 채널 등록 API 테스트 ==="
echo ""
echo "📋 문제 분석:"
echo "- 400 에러: PlusFriendRegiestFailed"
echo "- 메시지: 카테고리를 선택해주세요"
echo ""
echo "🔍 가능한 원인:"
echo "1. categoryCode가 필수 필드임 (현재는 선택사항으로 처리)"
echo "2. categoryCode 형식이 잘못됨 (CS02 vs 002001001)"
echo "3. searchId 형식이 잘못됨 (@가 필요할 수도 있음)"
echo "4. token 값이 유효하지 않음"
echo ""
echo "🔧 해결 방법:"
echo "1. categoryCode를 필수 필드로 변경"
echo "2. 올바른 카테고리 코드 형식 사용"
echo "3. Solapi API 문서에 따른 정확한 파라미터 전송"
echo ""
echo "📝 Solapi API 요청 형식 (예상):"
cat << 'JSON'
POST https://api.solapi.com/kakao/v1/plus-friends
{
  "searchId": "@채널아이디",
  "phoneNumber": "01012345678",
  "categoryCode": "CS02",
  "token": "1234"
}
JSON
