#!/bin/bash

echo "🚨 긴급 수정 배포 테스트"
echo "======================================"
echo "⏳ 배포 대기 중 (90초)..."
sleep 90

for i in {1..5}; do
    echo ""
    echo "테스트 시도 $i/5..."
    
    ADMIN_TOKEN="1|admin@superplace.co.kr|ADMIN|$(date +%s)000"
    RESPONSE=$(curl -s "https://superplacestudy.pages.dev/api/homework/results?startDate=2024-01-01&endDate=2099-12-31" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}")
    
    SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
    
    if [ "$SUCCESS" = "true" ]; then
        echo "✅ SUCCESS!"
        echo ""
        echo "$RESPONSE" | jq '{success, statistics}'
        
        TOTAL=$(echo "$RESPONSE" | jq -r '.statistics.totalSubmissions')
        echo ""
        echo "======================================"
        echo "📊 결과"
        echo "======================================"
        echo "제출 건수: $TOTAL"
        
        if [ "$TOTAL" -gt 0 ]; then
            echo ""
            echo "최근 제출 3건:"
            echo "$RESPONSE" | jq -r '.results[0:3] | .[] | "- \(.userName): \(.grading.score)점"'
        else
            echo ""
            echo "ℹ️ 제출된 숙제가 없습니다."
            echo "숙제를 제출하면 여기에 표시됩니다."
        fi
        
        echo ""
        echo "======================================"
        echo "🎯 테스트 URL"
        echo "======================================"
        echo "1. 결과 페이지: https://superplacestudy.pages.dev/dashboard/homework/results/"
        echo "2. 숙제 제출: https://superplacestudy.pages.dev/attendance-verify/ (코드: 402246)"
        
        exit 0
    else
        ERROR=$(echo "$RESPONSE" | jq -r '.error // "unknown"')
        MESSAGE=$(echo "$RESPONSE" | jq -r '.message // ""')
        echo "❌ 오류: $ERROR"
        [ -n "$MESSAGE" ] && echo "   메시지: $MESSAGE"
        
        if [ $i -lt 5 ]; then
            echo "   30초 후 재시도..."
            sleep 30
        fi
    fi
done

echo ""
echo "======================================"
echo "⚠️ 배포가 지연되고 있습니다"
echo "======================================"
echo "10분 후 다시 확인해주세요."

