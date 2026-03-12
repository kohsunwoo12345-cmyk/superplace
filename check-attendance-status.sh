#!/bin/bash

echo "출석 데이터 상태 확인"
echo "=========================================="

# Check if there's attendance data for userId=1
echo "1. userId=1의 출석 데이터 확인"
curl -s "https://superplacestudy.pages.dev/api/admin/check-attendance-data" | jq '.records[] | select(.userId == "1" or .userId == 1) | {userId, status, checkInTime}' 2>/dev/null | head -20

echo ""
echo "2. 모든 status 값 확인"
curl -s "https://superplacestudy.pages.dev/api/admin/check-attendance-data" | jq -r '.records[].status' 2>/dev/null | sort | uniq -c

echo ""
echo "3. 최근 5개 레코드의 userId와 status"
curl -s "https://superplacestudy.pages.dev/api/admin/check-attendance-data" | jq '.records[0:5] | .[] | {userId, status, checkInTime}' 2>/dev/null

