#!/bin/bash

echo "🚀 배포 모니터링 시작"
echo "커밋: ceae83b"
echo "URL: https://superplace-study.vercel.app/dashboard/admin/users"
echo ""
echo "⏳ 2분 대기 (Vercel 빌드 시간)..."
sleep 120

echo ""
echo "✅ 배포 시작! 30초마다 체크 중..."
echo ""

SUCCESS=false

for i in {1..10}; do
    echo "[$i/10] 체크 중... ($(date '+%H:%M:%S'))"
    
    # API 호출
    RESPONSE=$(curl -s https://superplace-study.vercel.app/api/admin/users)
    
    # success 필드 확인
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo ""
        echo "🎉🎉🎉 성공! API가 정상 응답합니다! 🎉🎉🎉"
        echo ""
        
        # 사용자 수 확인
        TOTAL=$(echo "$RESPONSE" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
        NEON=$(echo "$RESPONSE" | grep -o '"neon":[0-9]*' | grep -o '[0-9]*' | head -1)
        D1=$(echo "$RESPONSE" | grep -o '"d1":[0-9]*' | grep -o '[0-9]*' | head -1)
        
        echo "📊 사용자 통계:"
        echo "   - 전체: $TOTAL명"
        echo "   - Neon: $NEON명"
        echo "   - D1: $D1명"
        echo ""
        
        echo "✅✅✅ 배포 성공! 브라우저에서 확인하세요! ✅✅✅"
        echo "   👉 https://superplace-study.vercel.app/dashboard/admin/users"
        echo ""
        
        SUCCESS=true
        break
    else
        # 에러 확인
        if echo "$RESPONSE" | grep -q '"error"'; then
            ERROR=$(echo "$RESPONSE" | grep -o '"error":"[^"]*"' | head -1)
            echo "  ⚠️ API 에러: $ERROR"
        elif echo "$RESPONSE" | grep -q '"success":false'; then
            echo "  ⚠️ API가 실패를 반환했습니다"
        else
            echo "  ⚠️ 아직 이전 버전이거나 빌드 중입니다"
        fi
    fi
    
    if [ $i -lt 10 ]; then
        echo "  ⏳ 30초 대기..."
        sleep 30
    fi
done

if [ "$SUCCESS" = false ]; then
    echo ""
    echo "⚠️ 배포 대기 시간 초과"
    echo ""
    echo "다음을 확인하세요:"
    echo "1. Vercel 대시보드: https://vercel.com/dashboard"
    echo "2. Deployments 탭에서 빌드 상태 확인"
    echo "3. Functions → /api/admin/users 로그 확인"
    echo ""
    echo "현재 API 응답:"
    echo "$RESPONSE" | head -c 500
fi
