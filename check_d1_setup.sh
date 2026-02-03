#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 제목
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}  🔍 D1 데이터베이스 설정 자동 확인 스크립트${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. 프로젝트 정보 확인
echo -e "${BLUE}📋 Step 1: 프로젝트 정보 확인${NC}"
echo -e "${CYAN}─────────────────────────────────────────────────────────${NC}"
echo -e "  프로젝트 이름: ${GREEN}superplacestudy${NC}"
echo -e "  배포 URL: ${GREEN}https://genspark-ai-developer.superplacestudy.pages.dev${NC}"
echo -e "  데이터베이스 ID: ${GREEN}8c106540-21b4-4fa9-8879-c4956e459ca1${NC}"
echo ""

# 2. wrangler.toml 확인
echo -e "${BLUE}📋 Step 2: wrangler.toml 설정 확인${NC}"
echo -e "${CYAN}─────────────────────────────────────────────────────────${NC}"

if [ -f "wrangler.toml" ]; then
    echo -e "  ${GREEN}✅ wrangler.toml 파일 존재${NC}"
    
    # D1 바인딩 확인
    if grep -q "database_id.*8c106540-21b4-4fa9-8879-c4956e459ca1" wrangler.toml; then
        echo -e "  ${GREEN}✅ D1 Database ID 설정됨${NC}"
        echo -e "     ${CYAN}database_id = \"8c106540-21b4-4fa9-8879-c4956e459ca1\"${NC}"
    else
        echo -e "  ${RED}❌ D1 Database ID가 설정되지 않았습니다${NC}"
        echo -e "     ${YELLOW}⚠️  wrangler.toml에서 확인 필요${NC}"
    fi
    
    # 바인딩 이름 확인
    if grep -q "binding.*=.*\"DB\"" wrangler.toml; then
        echo -e "  ${GREEN}✅ D1 바인딩 이름 'DB' 설정됨${NC}"
    else
        echo -e "  ${RED}❌ D1 바인딩 이름이 'DB'가 아닙니다${NC}"
    fi
else
    echo -e "  ${RED}❌ wrangler.toml 파일을 찾을 수 없습니다${NC}"
fi
echo ""

# 3. 로그인 API 파일 확인
echo -e "${BLUE}📋 Step 3: API 파일 존재 확인${NC}"
echo -e "${CYAN}─────────────────────────────────────────────────────────${NC}"

if [ -f "functions/api/auth/login.ts" ]; then
    echo -e "  ${GREEN}✅ login.ts 파일 존재${NC}"
    
    # D1 사용 확인
    if grep -q "context.env.DB" functions/api/auth/login.ts; then
        echo -e "  ${GREEN}✅ D1 연결 코드 포함${NC}"
    else
        echo -e "  ${YELLOW}⚠️  D1 연결 코드가 없습니다${NC}"
    fi
else
    echo -e "  ${RED}❌ login.ts 파일을 찾을 수 없습니다${NC}"
fi

if [ -f "functions/api/auth/signup.ts" ]; then
    echo -e "  ${GREEN}✅ signup.ts 파일 존재${NC}"
else
    echo -e "  ${YELLOW}⚠️  signup.ts 파일이 없습니다 (선택사항)${NC}"
fi
echo ""

# 4. 로그인 페이지 확인
echo -e "${BLUE}📋 Step 4: 프론트엔드 페이지 확인${NC}"
echo -e "${CYAN}─────────────────────────────────────────────────────────${NC}"

if [ -f "src/app/login/page.tsx" ]; then
    echo -e "  ${GREEN}✅ 로그인 페이지 존재${NC}"
else
    echo -e "  ${RED}❌ 로그인 페이지를 찾을 수 없습니다${NC}"
fi

if [ -f "src/app/register/page.tsx" ]; then
    echo -e "  ${GREEN}✅ 회원가입 페이지 존재${NC}"
else
    echo -e "  ${YELLOW}⚠️  회원가입 페이지가 없습니다${NC}"
fi
echo ""

# 5. API 테스트
echo -e "${BLUE}📋 Step 5: 배포된 API 테스트${NC}"
echo -e "${CYAN}─────────────────────────────────────────────────────────${NC}"
echo -e "  ${CYAN}테스트 URL: https://genspark-ai-developer.superplacestudy.pages.dev/api/auth/login${NC}"
echo ""
echo -e "  ${YELLOW}🔄 API 호출 중...${NC}"

# 테스트 로그인 요청
RESPONSE=$(curl -s -X POST \
  https://genspark-ai-developer.superplacestudy.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}' \
  -w "\n%{http_code}")

# HTTP 상태 코드 추출
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n -1)

echo ""
echo -e "  ${CYAN}HTTP 상태 코드: ${YELLOW}$HTTP_CODE${NC}"

if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "401" ]; then
    echo -e "  ${GREEN}✅ API가 정상 작동 중입니다${NC}"
    echo -e "  ${CYAN}응답: $(echo $BODY | head -c 100)...${NC}"
elif [ "$HTTP_CODE" == "500" ]; then
    echo -e "  ${RED}❌ API 500 에러 발생${NC}"
    echo ""
    
    # 에러 메시지 파싱
    if echo "$BODY" | grep -q "D1_ERROR"; then
        echo -e "  ${RED}🔴 D1 데이터베이스 에러${NC}"
        echo -e "     ${YELLOW}원인: D1 바인딩이 Cloudflare Pages에 설정되지 않았습니다${NC}"
    elif echo "$BODY" | grep -q "undefined"; then
        echo -e "  ${RED}🔴 context.env.DB가 undefined${NC}"
        echo -e "     ${YELLOW}원인: D1 바인딩이 없습니다${NC}"
    else
        echo -e "  ${YELLOW}⚠️  알 수 없는 에러입니다${NC}"
    fi
    
    echo ""
    echo -e "  ${CYAN}에러 응답:${NC}"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    echo -e "  ${YELLOW}⚠️  예상치 못한 응답: $HTTP_CODE${NC}"
fi
echo ""

# 6. 최종 진단
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}  📊 최종 진단 결과${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ "$HTTP_CODE" == "500" ]; then
    echo -e "${RED}❌ 현재 상태: 로그인 불가 (API 500 에러)${NC}"
    echo ""
    echo -e "${YELLOW}🔧 해결 방법:${NC}"
    echo ""
    echo -e "  ${CYAN}1. Cloudflare Dashboard 접속${NC}"
    echo -e "     https://dash.cloudflare.com/"
    echo ""
    echo -e "  ${CYAN}2. Workers & Pages → superplacestudy 선택${NC}"
    echo ""
    echo -e "  ${CYAN}3. Settings → Functions → D1 database bindings${NC}"
    echo ""
    echo -e "  ${CYAN}4. Add binding 클릭 후 입력:${NC}"
    echo -e "     Variable name: ${GREEN}DB${NC}"
    echo -e "     D1 database: ${GREEN}(ID가 8c106540...인 데이터베이스 선택)${NC}"
    echo ""
    echo -e "  ${CYAN}5. Save 클릭${NC}"
    echo ""
    echo -e "  ${CYAN}6. 1-2분 대기 후 다시 테스트${NC}"
    echo ""
    echo -e "${BLUE}📖 자세한 가이드:${NC}"
    echo -e "  - BEGINNER_D1_SETUP_GUIDE.md (비개발자용)"
    echo -e "  - VISUAL_SETUP_GUIDE.md (그림 가이드)"
    echo ""
elif [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "401" ]; then
    echo -e "${GREEN}✅ 현재 상태: API 정상 작동${NC}"
    echo ""
    echo -e "${CYAN}🎉 로그인 테스트:${NC}"
    echo ""
    echo -e "  ${CYAN}1. 브라우저에서 접속:${NC}"
    echo -e "     https://genspark-ai-developer.superplacestudy.pages.dev/login"
    echo ""
    echo -e "  ${CYAN}2. 기존 계정으로 로그인:${NC}"
    echo -e "     superplace-academy.pages.dev에서 사용하던 계정"
    echo ""
    echo -e "  ${CYAN}3. 로그인 성공 시:${NC}"
    echo -e "     자동으로 /dashboard로 이동"
    echo ""
else
    echo -e "${YELLOW}⚠️  현재 상태: 확인 필요${NC}"
    echo ""
    echo -e "${CYAN}다음을 확인하세요:${NC}"
    echo -e "  1. 배포가 완료되었나요?"
    echo -e "  2. URL이 올바른가요?"
    echo -e "  3. 인터넷 연결이 되어있나요?"
    echo ""
fi

echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 7. 참고 문서
echo -e "${BLUE}📚 참고 문서${NC}"
echo -e "${CYAN}─────────────────────────────────────────────────────────${NC}"
echo -e "  📄 BEGINNER_D1_SETUP_GUIDE.md - 비개발자를 위한 완전 가이드"
echo -e "  🖼️  VISUAL_SETUP_GUIDE.md - 그림으로 보는 설정 가이드"
echo -e "  🔧 D1_SAME_DATABASE.md - 기술 문서"
echo -e "  📝 COPY_THIS_SQL.sql - D1 테이블 생성 SQL"
echo ""

# 8. 체크리스트
echo -e "${BLUE}✅ 체크리스트${NC}"
echo -e "${CYAN}─────────────────────────────────────────────────────────${NC}"

if [ "$HTTP_CODE" == "500" ]; then
    echo -e "  [ ] Cloudflare Dashboard 접속"
    echo -e "  [ ] Workers & Pages → superplacestudy"
    echo -e "  [ ] Settings → Functions → D1 database bindings"
    echo -e "  [ ] Add binding (Variable: DB, Database: 8c106540...)"
    echo -e "  [ ] Save 클릭"
    echo -e "  [ ] 1-2분 대기"
    echo -e "  [ ] 이 스크립트 다시 실행: ./check_d1_setup.sh"
    echo -e "  [ ] 로그인 테스트"
elif [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "401" ]; then
    echo -e "  [${GREEN}✓${NC}] D1 바인딩 설정 완료"
    echo -e "  [${GREEN}✓${NC}] API 정상 작동"
    echo -e "  [ ] 로그인 페이지 접속 및 테스트"
    echo -e "  [ ] 기존 계정으로 로그인 성공 확인"
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}  스크립트 작성: 2026-02-03${NC}"
echo -e "${CYAN}  문의: 개발자에게 스크린샷과 함께 연락하세요${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
