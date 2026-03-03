#!/bin/bash

echo "========================================="
echo "설정 페이지 구독 정보 표시 테스트"
echo "========================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="https://superplacestudy.pages.dev"

echo ""
echo "📋 테스트 시나리오:"
echo "1. API 엔드포인트 존재 확인"
echo "2. 파라미터 유효성 검증"
echo "3. 구독 없는 경우 응답 확인"
echo "4. 응답 JSON 구조 검증"
echo ""

# 테스트 1: API 존재 확인
echo -e "${YELLOW}[테스트 1]${NC} API 엔드포인트 존재 확인"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/subscription/check?userId=test")
if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓${NC} API 엔드포인트 존재 (HTTP $HTTP_CODE)"
else
  echo -e "${RED}✗${NC} API 엔드포인트 문제 (HTTP $HTTP_CODE)"
fi

# 테스트 2: 파라미터 없을 때
echo ""
echo -e "${YELLOW}[테스트 2]${NC} 파라미터 유효성 검증"
RESPONSE=$(curl -s "${BASE_URL}/api/subscription/check")
ERROR=$(echo "$RESPONSE" | jq -r '.error' 2>/dev/null)
if [ "$ERROR" = "userId or academyId required" ]; then
  echo -e "${GREEN}✓${NC} 파라미터 필수 검증 통과"
else
  echo -e "${RED}✗${NC} 파라미터 검증 실패"
fi

# 테스트 3: userId로 조회
echo ""
echo -e "${YELLOW}[테스트 3]${NC} userId로 구독 조회"
RESPONSE=$(curl -s "${BASE_URL}/api/subscription/check?userId=test-user-123")
SUCCESS=$(echo "$RESPONSE" | jq -r '.success' 2>/dev/null)
HAS_SUB=$(echo "$RESPONSE" | jq -r '.hasSubscription' 2>/dev/null)

if [ "$SUCCESS" = "false" ] && [ "$HAS_SUB" = "false" ]; then
  echo -e "${GREEN}✓${NC} 구독 없음 응답 정상"
  MESSAGE=$(echo "$RESPONSE" | jq -r '.message' 2>/dev/null)
  echo "  메시지: $MESSAGE"
else
  echo -e "${RED}✗${NC} 예상치 못한 응답"
fi

# 테스트 4: academyId로 조회
echo ""
echo -e "${YELLOW}[테스트 4]${NC} academyId로 구독 조회"
RESPONSE=$(curl -s "${BASE_URL}/api/subscription/check?academyId=test-academy-123")
SUCCESS=$(echo "$RESPONSE" | jq -r '.success' 2>/dev/null)
HAS_SUB=$(echo "$RESPONSE" | jq -r '.hasSubscription' 2>/dev/null)

if [ "$SUCCESS" = "false" ] && [ "$HAS_SUB" = "false" ]; then
  echo -e "${GREEN}✓${NC} 학원 구독 없음 응답 정상"
  REDIRECT=$(echo "$RESPONSE" | jq -r '.redirectTo' 2>/dev/null)
  echo "  리다이렉트: $REDIRECT"
else
  echo -e "${RED}✗${NC} 예상치 못한 응답"
fi

# 테스트 5: 응답 JSON 구조
echo ""
echo -e "${YELLOW}[테스트 5]${NC} 응답 JSON 구조 검증"
echo "예상 응답 구조 (구독 있는 경우):"
cat << 'JSON'
{
  "success": true,
  "hasSubscription": true,
  "subscription": {
    "id": "...",
    "planName": "Starter",
    "status": "active",
    "endDate": "2027-03-03",
    "usage": {
      "students": 5,
      "homeworkChecks": 10,
      "aiAnalysis": 2,
      "similarProblems": 8,
      "landingPages": 1
    },
    "limits": {
      "maxStudents": 30,
      "maxHomeworkChecks": 720,
      "maxAIAnalysis": 50,
      "maxSimilarProblems": 30,
      "maxLandingPages": 40
    }
  }
}
JSON

echo ""
echo "예상 응답 구조 (구독 없는 경우):"
cat << 'JSON'
{
  "success": false,
  "hasSubscription": false,
  "message": "활성화된 구독이 없습니다. 요금제를 선택해주세요.",
  "redirectTo": "/pricing"
}
JSON

echo ""
echo "========================================="
echo "프론트엔드 체크리스트"
echo "========================================="

cat << 'CHECKLIST'

🔍 브라우저 개발자 도구에서 확인할 사항:

1. Console 탭 로그:
   ✓ "사용자 정보: {...}"
   ✓ "사용자 역할: DIRECTOR"
   ✓ "학원 ID: xxx"
   ✓ "구독 정보 조회 시작 - academyId: xxx"
   ✓ "API 응답 상태: 200"
   ✓ "API 응답 데이터: {...}"
   ✓ "구독 정보 로딩 완료"

2. Network 탭:
   ✓ GET /api/subscription/check?academyId=xxx
   ✓ Status: 200 OK
   ✓ Response 타입: application/json
   ✓ CORS 헤더 존재

3. Application 탭 > Local Storage:
   ✓ user 키 존재
   ✓ user.role === "DIRECTOR"
   ✓ user.academyId 존재 (null/undefined 아님)

4. Elements 탭:
   ✓ 로딩 스피너가 사라짐
   ✓ "현재 플랜" 카드 표시
   ✓ 플랜명, 만료일 표시
   ✓ 사용량/한도 표시

CHECKLIST

echo ""
echo "========================================="
echo "일반적인 문제와 해결 방법"
echo "========================================="

cat << 'SOLUTIONS'

❌ 문제 1: 여전히 로딩 중만 표시
해결책:
- Console 탭에서 에러 메시지 확인
- Network 탭에서 API 호출 실패 여부 확인
- localStorage의 academyId 확인
- 페이지 새로고침 (Ctrl+F5)

❌ 문제 2: "학원 정보가 설정되지 않았습니다"
해결책:
- 관리자에게 학원 할당 요청
- localStorage에서 user 삭제 후 재로그인

❌ 문제 3: "활성화된 구독이 없습니다"
해결책:
- 관리자 페이지에서 구독 요청 승인 확인
- "요금제 선택하기" 버튼으로 구독 신청

❌ 문제 4: API 500 에러
해결책:
- 서버 로그 확인
- 데이터베이스 연결 상태 확인
- 배포 상태 확인 (Cloudflare Pages)

SOLUTIONS

echo ""
echo "========================================="
echo "테스트 완료"
echo "========================================="
echo ""
echo "다음 단계:"
echo "1. 브라우저에서 ${BASE_URL}/dashboard/settings 접속"
echo "2. F12 눌러 개발자 도구 열기"
echo "3. Console 탭에서 로그 확인"
echo "4. Network 탭에서 API 호출 확인"
echo "5. 구독 정보가 제대로 표시되는지 확인"
echo ""
