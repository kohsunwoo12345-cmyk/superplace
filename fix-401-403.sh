#!/bin/bash

echo "🚀 401/403 에러 완전 해결 시작"
echo "=================================="
echo ""

echo "⏳ 배포 대기 중 (60초)..."
sleep 60

echo ""
echo "1️⃣ 비밀번호 마이그레이션 실행..."
MIGRATION_RESULT=$(curl -s -X POST "https://superplacestudy.pages.dev/api/admin/migrate-passwords" \
  -H "Authorization: migrate-superplace-2026")

echo "$MIGRATION_RESULT" | jq '.'

MIGRATED_COUNT=$(echo "$MIGRATION_RESULT" | jq -r '.stats.migrated // 0')
echo ""
if [ "$MIGRATED_COUNT" -gt 0 ]; then
  echo "   ✅ $MIGRATED_COUNT 개 계정 마이그레이션 완료"
elif [ "$MIGRATED_COUNT" = "0" ]; then
  SKIPPED_COUNT=$(echo "$MIGRATION_RESULT" | jq -r '.stats.skipped // 0')
  echo "   ℹ️  $SKIPPED_COUNT 개 계정 (이미 해시됨)"
else
  echo "   ⚠️  마이그레이션 API 대기 중... 잠시 후 재시도"
fi

echo ""
echo "2️⃣ 로그인 테스트..."
LOGIN_RESULT=$(curl -s -X POST "https://superplacestudy.pages.dev/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@superplace.co.kr","password":"admin1234!"}')

LOGIN_SUCCESS=$(echo "$LOGIN_RESULT" | jq -r '.success')

if [ "$LOGIN_SUCCESS" = "true" ]; then
  echo "   ✅ 로그인 성공!"
  USER_NAME=$(echo "$LOGIN_RESULT" | jq -r '.user.name')
  USER_ROLE=$(echo "$LOGIN_RESULT" | jq -r '.user.role')
  echo "   👤 사용자: $USER_NAME ($USER_ROLE)"
  echo ""
  echo "🎉🎉🎉 완전 해결 완료!"
  echo ""
  echo "✅ 다음 단계:"
  echo "   1. https://superplacestudy.pages.dev/login 접속"
  echo "   2. admin@superplace.co.kr / admin1234! 로그인"
  echo "   3. 대시보드 → 발신번호 신청 → 신청 완료"
  echo ""
else
  echo "   ❌ 로그인 실패"
  echo "   응답: $LOGIN_RESULT"
  echo ""
  echo "   💡 해결 방법:"
  echo "   - 1~2분 후 다시 실행하세요 (배포 전파 중)"
  echo "   - 또는 Cloudflare Dashboard에서 수동 재배포"
fi

echo ""
echo "=================================="
