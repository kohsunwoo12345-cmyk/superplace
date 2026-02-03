#!/bin/bash

# Cloudflare D1 바인딩 설정 가이드
# 이 스크립트는 Cloudflare Pages에서 D1 데이터베이스를 설정하는 방법을 안내합니다.

echo "=================================================="
echo "🚀 Cloudflare D1 바인딩 설정 가이드"
echo "=================================================="
echo ""

echo "📋 현재 상황:"
echo "  - API 엔드포인트가 500 에러를 반환하고 있습니다"
echo "  - 에러 메시지: Cannot read properties of undefined (reading 'prepare')"
echo "  - 원인: D1 바인딩이 설정되지 않아 context.env.DB가 undefined입니다"
echo ""

echo "✅ 해결 방법 (3단계):"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Step 1: Cloudflare Dashboard 접속"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. URL: https://dash.cloudflare.com/"
echo "  2. 로그인 후 대시보드 열기"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Step 2: D1 바인딩 추가"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. 왼쪽 메뉴: Workers & Pages 클릭"
echo "  2. 프로젝트 선택: 'superplacestudy' 클릭"
echo "  3. 상단 탭: Settings 클릭"
echo "  4. 왼쪽 섹션: Functions 선택"
echo "  5. D1 database bindings 섹션 찾기"
echo "  6. 버튼 클릭: Add binding"
echo ""
echo "  📝 입력 정보:"
echo "    - Variable name: DB (대문자, 정확히 입력!)"
echo "    - D1 database: superplace-db (드롭다운에서 선택)"
echo ""
echo "  7. Save 버튼 클릭"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Step 3: 배포 완료 대기"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. Save 후 자동으로 재배포 시작"
echo "  2. 배포 완료까지 약 1-2분 소요"
echo "  3. Deployments 탭에서 상태 확인 가능"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 테스트 방법"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  1. URL 접속:"
echo "     https://genspark-ai-developer.superplacestudy.pages.dev/login"
echo ""
echo "  2. 관리자 계정으로 로그인:"
echo "     이메일: admin@superplace.com"
echo "     비밀번호: admin123456"
echo ""
echo "  3. 성공 시 /dashboard로 자동 이동"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 문제 해결"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  ❌ 여전히 500 에러가 발생하는 경우:"
echo "     1. D1 바인딩의 Variable name이 정확히 'DB'인지 확인"
echo "     2. 바인딩 저장 후 1-2분 대기 (재배포 시간)"
echo "     3. 브라우저 캐시 삭제 후 재시도"
echo ""
echo "  ❌ '이메일 또는 비밀번호가 올바르지 않습니다' 에러:"
echo "     1. D1 Console에서 관리자 계정 확인:"
echo "        https://dash.cloudflare.com/ → D1 → superplace-db → Console"
echo "     2. SQL 실행:"
echo "        SELECT * FROM users WHERE email = 'admin@superplace.com';"
echo "     3. 계정이 없으면 D1_SETUP_GUIDE.md의 Step 2-3 실행"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 데이터베이스 정보"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Database ID: 8c106540-21b4-4fa9-8879-c4956e459ca1"
echo "  Database Name: superplace-db"
echo "  Binding Variable: DB"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 체크리스트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  [ ] Cloudflare Dashboard 접속"
echo "  [ ] Workers & Pages → superplacestudy → Settings → Functions"
echo "  [ ] D1 binding 추가 (Variable: DB, Database: superplace-db)"
echo "  [ ] Save 클릭"
echo "  [ ] 1-2분 대기 (재배포)"
echo "  [ ] 로그인 테스트 (admin@superplace.com / admin123456)"
echo ""

echo "=================================================="
echo "📌 중요 안내"
echo "=================================================="
echo "D1 바인딩 설정은 Cloudflare Dashboard에서만 가능합니다."
echo "이 설정 없이는 어떤 API도 작동하지 않습니다."
echo ""
echo "자세한 내용은 D1_SETUP_GUIDE.md 파일을 참고하세요."
echo "=================================================="
echo ""

# API 테스트 함수
test_api() {
    echo "🧪 API 테스트 중..."
    echo ""
    
    RESPONSE=$(curl -s -X POST "https://genspark-ai-developer.superplacestudy.pages.dev/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@superplace.com","password":"admin123456"}')
    
    echo "응답:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo ""
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo "✅ 로그인 성공! D1 바인딩이 정상적으로 설정되었습니다."
    elif echo "$RESPONSE" | grep -q 'DB binding not found'; then
        echo "❌ D1 바인딩이 설정되지 않았습니다. 위의 Step 1-2를 따라 설정해주세요."
    elif echo "$RESPONSE" | grep -q 'Cannot read properties of undefined'; then
        echo "❌ D1 바인딩이 설정되지 않았습니다. 위의 Step 1-2를 따라 설정해주세요."
    else
        echo "⚠️  예상치 못한 응답입니다. 응답 내용을 확인해주세요."
    fi
}

# 사용자에게 테스트 여부 물어보기
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "지금 API 테스트를 실행하시겠습니까? (y/n)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -r answer

if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
    test_api
else
    echo "테스트를 건너뜁니다. 필요할 때 다시 실행하세요."
fi

echo ""
echo "스크립트 종료."
