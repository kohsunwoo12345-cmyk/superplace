#!/bin/bash

echo "==================================================="
echo "🔧 강제 수정: 페이지 재생성"
echo "==================================================="

# 1. 파일에 타임스탬프 주석 추가로 강제 재빌드
echo ""
echo "1️⃣ 타임스탬프 추가하여 강제 재빌드"

# 현재 시각
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# assign 페이지 맨 위에 주석 추가
sed -i "1i// Force rebuild: $TIMESTAMP" src/app/dashboard/admin/ai-bots/assign/page.tsx

echo "   ✓ 타임스탬프 추가: $TIMESTAMP"

# 2. 빌드
echo ""
echo "2️⃣ 빌드 시작..."
npm run build > /tmp/build.log 2>&1

if [ $? -eq 0 ]; then
    echo "   ✅ 빌드 성공"
else
    echo "   ❌ 빌드 실패"
    tail -20 /tmp/build.log
    exit 1
fi

# 3. Git commit & push
echo ""
echo "3️⃣ Git commit & push"
git add -A
git commit -m "force: AI 봇 할당 페이지 강제 재배포 (타임스탬프: $TIMESTAMP)

- 브라우저 캐시 문제 해결을 위한 강제 재빌드
- 파일에 타임스탬프 추가하여 번들 파일명 변경 유도
- 권한 체크 제거 코드 재확인"

git push origin main

echo ""
echo "==================================================="
echo "✅ 완료"
echo "==================================================="
echo ""
echo "배포 완료까지 약 2-3분 소요됩니다."

