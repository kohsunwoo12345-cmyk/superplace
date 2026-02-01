#!/bin/bash

echo "🚀 긴급 배포 모니터링 시작..."
echo "URL: https://superplace-study.vercel.app/dashboard/admin/users"
echo ""

# 5분 동안 30초마다 체크
for i in {1..10}; do
    echo "[$i/10] 체크 중... ($(date '+%H:%M:%S'))"
    
    # API 상태 체크
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://superplace-study.vercel.app/api/admin/users)
    
    echo "  - API Status: $STATUS"
    
    if [ "$STATUS" == "200" ]; then
        echo ""
        echo "✅ 성공! API가 200을 반환합니다!"
        echo ""
        echo "🎉 사용자 목록 확인:"
        curl -s https://superplace-study.vercel.app/api/admin/users | head -c 500
        echo ""
        echo ""
        echo "✅ 배포 성공! 이제 URL을 확인하세요:"
        echo "   https://superplace-study.vercel.app/dashboard/admin/users"
        exit 0
    fi
    
    if [ $i -lt 10 ]; then
        echo "  ⏳ 30초 대기..."
        sleep 30
    fi
done

echo ""
echo "⚠️ 배포가 아직 진행 중입니다. Vercel 대시보드를 확인하세요:"
echo "   https://vercel.com/dashboard"
