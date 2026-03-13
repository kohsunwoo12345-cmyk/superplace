#!/bin/bash

echo "🚀 배포 완료 대기 및 자동 테스트"
echo "======================================"

MAX_ATTEMPTS=10
ATTEMPT=0
SUCCESS=false

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    echo ""
    echo "시도 $ATTEMPT/$MAX_ATTEMPTS..."
    
    ADMIN_TOKEN="1|admin@superplace.co.kr|ADMIN|$(date +%s)000"
    RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}")
    
    API_SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
    
    if [ "$API_SUCCESS" = "true" ]; then
        SUCCESS=true
        echo "✅ 배포 완료! API 정상 작동"
        echo ""
        echo "$RESPONSE" | jq '{success, statistics, resultCount: (.results | length)}'
        
        TOTAL=$(echo "$RESPONSE" | jq -r '.statistics.totalSubmissions')
        echo ""
        echo "======================================"
        echo "📊 최종 결과"
        echo "======================================"
        echo "제출 건수: $TOTAL"
        
        if [ "$TOTAL" -gt 0 ]; then
            echo ""
            echo "최근 제출 3건:"
            echo "$RESPONSE" | jq -r '.results[0:3] | .[] | "- \(.userName): \(.grading.score)점 (\(.grading.subject))"'
        fi
        
        break
    else
        ERROR=$(echo "$RESPONSE" | jq -r '.error // "unknown"')
        MESSAGE=$(echo "$RESPONSE" | jq -r '.message // ""')
        echo "❌ 아직 배포 중... (오류: $ERROR)"
        [ -n "$MESSAGE" ] && echo "   상세: $MESSAGE"
        
        if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
            echo "   30초 후 재시도..."
            sleep 30
        fi
    fi
done

if [ "$SUCCESS" = "false" ]; then
    echo ""
    echo "======================================"
    echo "⚠️ 배포 지연"
    echo "======================================"
    echo "배포가 예상보다 오래 걸리고 있습니다."
    echo "Cloudflare Pages 대시보드를 확인하세요:"
    echo "https://dash.cloudflare.com/"
    echo ""
    echo "또는 5-10분 후 수동으로 테스트하세요:"
    echo "https://superplacestudy.pages.dev/dashboard/homework/results/"
fi

