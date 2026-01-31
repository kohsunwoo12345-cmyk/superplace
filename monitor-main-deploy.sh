#!/bin/bash

echo "🚀 MAIN 브랜치 배포 모니터링..."
echo "커밋: c5941d8"
echo "URL: https://superplace-study.vercel.app/api/admin/users"
echo ""
echo "⏳ 2분 대기 (빌드 시간)..."
sleep 120

echo ""
echo "✅ 배포 시작! 30초마다 체크..."
echo ""

# 5분 동안 30초마다 체크
for i in {1..10}; do
    echo "[$i/10] 체크 중... ($(date '+%H:%M:%S'))"
    
    # HTTP 상태 체크
    RESPONSE=$(curl -s -w "\n%{http_code}" https://superplace-study.vercel.app/api/admin/users)
    STATUS=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | head -n -1)
    
    echo "  - HTTP Status: $STATUS"
    
    if [ "$STATUS" == "200" ]; then
        echo ""
        echo "🎉🎉🎉 성공! 사용자 목록이 반환됩니다! 🎉🎉🎉"
        echo ""
        echo "📊 응답 미리보기:"
        echo "$BODY" | head -c 1000
        echo ""
        echo ""
        echo "✅✅✅ 100% 성공! 이제 브라우저에서 확인하세요! ✅✅✅"
        echo "   https://superplace-study.vercel.app/dashboard/admin/users"
        echo ""
        exit 0
    fi
    
    if [ "$STATUS" == "401" ] || [ "$STATUS" == "403" ]; then
        echo "  ⚠️ 아직 이전 버전: $STATUS"
        echo "  ⚠️ 응답: $(echo "$BODY" | head -c 200)"
    fi
    
    if [ $i -lt 10 ]; then
        echo "  ⏳ 30초 대기..."
        sleep 30
    fi
done

echo ""
echo "⚠️ 배포 대기 시간 초과. Vercel 대시보드 확인:"
echo "   https://vercel.com/dashboard"
