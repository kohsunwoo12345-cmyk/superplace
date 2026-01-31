#!/bin/bash
echo "⏳ Vercel 배포 대기 중..."
echo "=================================="

for i in {1..60}; do
  echo -n "$(date '+%H:%M:%S') - 시도 $i/60: "
  
  status=$(curl -s -o /dev/null -w "%{http_code}" "https://superplace-study.vercel.app/api/admin/users" 2>/dev/null)
  
  if [ "$status" = "401" ] || [ "$status" = "200" ]; then
    echo "✅ 성공! (HTTP $status)"
    echo ""
    echo "🎉 배포 완료!"
    echo "코드 변경이 반영되었습니다."
    echo ""
    echo "이제 https://superplace-study.vercel.app/dashboard/admin/users"
    echo "에서 학원장 계정으로 사용자 목록을 볼 수 있습니다!"
    exit 0
  elif [ "$status" = "403" ]; then
    echo "⏳ 아직 403 (배포 대기중...)"
  else
    echo "⚠️  HTTP $status"
  fi
  
  if [ $i -lt 60 ]; then
    sleep 10
  fi
done

echo ""
echo "❌ 10분 대기했지만 배포가 완료되지 않았습니다."
echo "Vercel 대시보드를 확인하세요: https://vercel.com/dashboard"
