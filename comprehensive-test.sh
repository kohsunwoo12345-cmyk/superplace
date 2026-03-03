#!/bin/bash

echo "========================================="
echo "구독 시스템 종합 테스트"
echo "========================================="

echo ""
echo "1. API 엔드포인트 존재 확인"
echo "HEAD https://superplacestudy.pages.dev/api/subscription/check"
curl -I "https://superplacestudy.pages.dev/api/subscription/check" 2>&1 | head -1

echo ""
echo "2. 파라미터 없이 호출 (에러 메시지 확인)"
RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/subscription/check")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "3. 테스트 userId로 호출"
RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/subscription/check?userId=test-user-123")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "4. 테스트 academyId로 호출"
RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/subscription/check?academyId=test-academy-123")
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "========================================="
echo "프론트엔드 디버깅 체크리스트"
echo "========================================="
cat << 'CHECKLIST'

✅ 확인사항:
1. localStorage의 user 객체에 academyId가 있는가?
   - 브라우저 개발자도구 > Application > Local Storage
   - user 키 확인
   
2. API 호출이 정상적으로 이루어지는가?
   - 개발자도구 > Network 탭
   - /api/subscription/check 요청 확인
   - Query Params에 academyId가 포함되어 있는가?
   
3. API 응답이 200 OK인가?
   - 응답 상태 코드 확인
   - Response body 확인
   
4. 콘솔에 에러가 있는가?
   - Console 탭에서 빨간색 에러 메시지 확인
   - CORS 에러, 404 에러, 500 에러 등

🔍 일반적인 원인:
- academyId가 null/undefined → 학원장 계정이 학원에 연결되지 않음
- API가 404 반환 → 함수가 배포되지 않음
- API가 500 반환 → 서버 오류 (데이터베이스 연결 문제 등)
- CORS 에러 → 잘못된 도메인에서 접근

🛠️ 해결 방법:
1. academyId 없음 → 관리자에게 학원 연결 요청
2. API 404 → 배포 상태 확인, 재배포
3. API 500 → 서버 로그 확인, 데이터베이스 상태 확인
4. CORS 에러 → API 설정 확인

CHECKLIST

echo ""
echo "========================================="
echo "테스트 완료"
echo "========================================="
