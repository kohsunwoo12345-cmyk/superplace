#!/bin/bash

echo "🎯 실제 학생 리포트 랜딩페이지 생성 테스트"
echo "================================================"

# 샘플 API로 페이지 생성
echo -e "\n📤 샘플 랜딩페이지 생성 중..."
RESPONSE=$(curl -s -X POST "https://superplacestudy.pages.dev/api/test/create-sample-landing-page")

echo "$RESPONSE" | jq '.'

# URL 추출
URL=$(echo "$RESPONSE" | jq -r '.landingPage.url')
FULL_URL="https://superplacestudy.pages.dev${URL}"

echo -e "\n✅ 생성된 랜딩페이지 URL: $FULL_URL"

# 페이지 내용 확인
echo -e "\n📄 페이지 내용 확인:"
echo "================================================"
curl -s "$FULL_URL" | grep -E "<title>|<h1>|출석|과제|AI" | head -10

echo -e "\n\n🔗 브라우저로 확인: $FULL_URL"
