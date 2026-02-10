#!/bin/bash

BASE_URL="https://genspark-ai-developer.superplacestudy.pages.dev"

echo "🔍 숙제 데이터 확인"
echo "====================================="
echo ""

echo "1️⃣ 방금 생성된 숙제 확인 (academyId 필터 없이)"
RESPONSE=$(curl -s "${BASE_URL}/api/homework/assignments/teacher?teacherId=1")
echo "$RESPONSE"
echo ""

ASSIGNMENT_COUNT=$(echo $RESPONSE | grep -o '"id":"assignment-' | wc -l)
echo "✅ academyId 필터 없이: $ASSIGNMENT_COUNT개"
echo ""

echo "2️⃣ academyId=1로 필터링"
RESPONSE2=$(curl -s "${BASE_URL}/api/homework/assignments/teacher?teacherId=1&academyId=1")
echo "$RESPONSE2"
echo ""

ASSIGNMENT_COUNT2=$(echo $RESPONSE2 | grep -o '"id":"assignment-' | wc -l)
echo "✅ academyId=1로 필터: $ASSIGNMENT_COUNT2개"

echo "====================================="
