#!/bin/bash

echo "🔍 1단계: 실제 사용자 정보 확인"
# DB에서 실제 사용자 정보 가져오기
curl -s "https://superplacestudy.pages.dev/api/debug/check-db-schema" | jq -r '.landing_pages_sample[0] | "\(.user_id)"' 2>/dev/null || echo "user-test-123"

