#!/bin/bash

# Vercel 자동 승격 스크립트
# 최신 Preview 배포를 Production으로 승격

set -e

echo "🎯 Vercel Production 자동 승격 시작..."

# Vercel 토큰 확인
if [ -z "$VERCEL_TOKEN" ]; then
  echo "❌ VERCEL_TOKEN 환경 변수가 설정되지 않았습니다."
  echo ""
  echo "📝 설정 방법:"
  echo "  1. Vercel Dashboard → Settings → Tokens"
  echo "  2. Create Token → Full Access"
  echo "  3. export VERCEL_TOKEN='your_token_here'"
  echo ""
  echo "⚠️  수동으로 승격하세요:"
  echo "  https://vercel.com/dashboard"
  exit 1
fi

# 프로젝트 정보
PROJECT_NAME="superplace-study"
TEAM_ID="${VERCEL_TEAM_ID:-}" # 팀 ID (옵션)

echo "📦 프로젝트: $PROJECT_NAME"

# 최신 Preview 배포 조회
echo "🔍 최신 배포 조회 중..."

# Vercel API 호출
if [ -n "$TEAM_ID" ]; then
  API_URL="https://api.vercel.com/v6/deployments?projectId=$PROJECT_NAME&teamId=$TEAM_ID&limit=1&target=preview"
else
  API_URL="https://api.vercel.com/v6/deployments?projectId=$PROJECT_NAME&limit=1&target=preview"
fi

RESPONSE=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "$API_URL")

# 최신 배포 ID 추출
DEPLOYMENT_ID=$(echo "$RESPONSE" | jq -r '.deployments[0].uid // empty')

if [ -z "$DEPLOYMENT_ID" ]; then
  echo "❌ Preview 배포를 찾을 수 없습니다."
  echo ""
  echo "Response: $RESPONSE"
  exit 1
fi

echo "✅ 배포 ID: $DEPLOYMENT_ID"

# Production으로 승격
echo "🚀 Production으로 승격 중..."

if [ -n "$TEAM_ID" ]; then
  PROMOTE_URL="https://api.vercel.com/v13/deployments/$DEPLOYMENT_ID/promote?teamId=$TEAM_ID"
else
  PROMOTE_URL="https://api.vercel.com/v13/deployments/$DEPLOYMENT_ID/promote"
fi

PROMOTE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -H "Content-Type: application/json" \
  "$PROMOTE_URL")

# 결과 확인
if echo "$PROMOTE_RESPONSE" | jq -e '.error' > /dev/null; then
  echo "❌ 승격 실패:"
  echo "$PROMOTE_RESPONSE" | jq '.'
  exit 1
fi

echo "✅ Production 승격 성공!"
echo ""
echo "🌐 사이트 확인:"
echo "  https://superplace-study.vercel.app"
echo ""
echo "📊 Vercel Dashboard:"
echo "  https://vercel.com/dashboard"
echo ""
