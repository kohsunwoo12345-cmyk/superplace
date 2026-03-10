#!/bin/bash
# Quick Deploy Script for Python Workers
# 이 스크립트는 사용자가 직접 실행할 수 있습니다.

set -e

echo "============================================"
echo "🚀 Python Workers 배포 도우미"
echo "============================================"
echo ""

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 파일 존재 확인
if [ ! -f "python-worker-simple.js" ]; then
    echo -e "${RED}❌ 오류: python-worker-simple.js 파일이 없습니다.${NC}"
    echo "현재 디렉토리: $(pwd)"
    exit 1
fi

echo -e "${BLUE}📋 배포 방법을 선택하세요:${NC}"
echo ""
echo "1. 코드 복사 (수동 배포) - 권장"
echo "2. Wrangler CLI (자동 배포)"
echo "3. 배포 가이드 HTML 열기"
echo "4. 취소"
echo ""
read -p "선택 (1-4): " choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}📋 방법 1: 코드 복사 (수동 배포)${NC}"
        echo ""
        echo "다음 단계를 따라주세요:"
        echo ""
        echo -e "${YELLOW}Step 1:${NC} 브라우저에서 아래 URL 열기"
        echo "https://dash.cloudflare.com/"
        echo ""
        echo -e "${YELLOW}Step 2:${NC} Workers & Pages → physonsuperplacestudy 선택"
        echo ""
        echo -e "${YELLOW}Step 3:${NC} 'Quick Edit' 버튼 클릭"
        echo ""
        echo -e "${YELLOW}Step 4:${NC} 기존 코드 전부 삭제 (Ctrl+A, Delete)"
        echo ""
        echo -e "${YELLOW}Step 5:${NC} 아래 코드 복사 후 붙여넣기"
        echo ""
        
        # 코드 출력
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        cat python-worker-simple.js
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo -e "${YELLOW}Step 6:${NC} 'Save and Deploy' 클릭"
        echo ""
        echo -e "${YELLOW}Step 7:${NC} 배포 확인 (10-30초 대기)"
        echo "https://physonsuperplacestudy.kohsunwoo12345.workers.dev/"
        echo ""
        ;;
        
    2)
        echo ""
        echo -e "${GREEN}🔧 방법 2: Wrangler CLI 자동 배포${NC}"
        echo ""
        
        # Wrangler 설치 확인
        if ! command -v wrangler &> /dev/null; then
            echo -e "${YELLOW}⚠️ Wrangler CLI가 설치되지 않았습니다.${NC}"
            echo ""
            read -p "지금 설치하시겠습니까? (y/n): " install_wrangler
            
            if [ "$install_wrangler" = "y" ]; then
                echo "npm install -g wrangler 실행 중..."
                npm install -g wrangler
            else
                echo "설치를 취소했습니다."
                exit 0
            fi
        fi
        
        echo -e "${BLUE}📦 Wrangler 버전:${NC}"
        wrangler --version
        echo ""
        
        # 로그인 확인
        echo -e "${YELLOW}🔐 Cloudflare 로그인이 필요합니다.${NC}"
        read -p "로그인 페이지를 여시겠습니까? (y/n): " do_login
        
        if [ "$do_login" = "y" ]; then
            wrangler login
        fi
        
        echo ""
        echo -e "${BLUE}📤 배포 중...${NC}"
        echo ""
        
        # 임시 디렉토리 생성
        TEMP_DIR=$(mktemp -d)
        cp python-worker-simple.js "$TEMP_DIR/index.js"
        
        # wrangler.toml 생성
        cat > "$TEMP_DIR/wrangler.toml" << 'EOF'
name = "physonsuperplacestudy"
main = "index.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
workers_dev = true
EOF
        
        # 배포
        cd "$TEMP_DIR"
        wrangler deploy
        
        # 정리
        cd - > /dev/null
        rm -rf "$TEMP_DIR"
        
        echo ""
        echo -e "${GREEN}✅ 배포 완료!${NC}"
        echo ""
        ;;
        
    3)
        echo ""
        echo -e "${GREEN}📖 방법 3: 배포 가이드 HTML${NC}"
        echo ""
        
        if [ -f "deploy-guide.html" ]; then
            echo "deploy-guide.html을 브라우저에서 열고 있습니다..."
            
            # OS 감지 및 브라우저 열기
            if command -v xdg-open &> /dev/null; then
                xdg-open deploy-guide.html
            elif command -v open &> /dev/null; then
                open deploy-guide.html
            else
                echo "수동으로 deploy-guide.html을 브라우저에서 여세요."
            fi
        else
            echo -e "${RED}❌ deploy-guide.html 파일이 없습니다.${NC}"
        fi
        ;;
        
    4)
        echo "취소되었습니다."
        exit 0
        ;;
        
    *)
        echo -e "${RED}❌ 잘못된 선택입니다.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 배포 프로세스 완료!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "🧪 테스트 실행:"
echo "  curl https://physonsuperplacestudy.kohsunwoo12345.workers.dev/"
echo ""
echo "  또는:"
echo "  node test-python-worker-grading.js"
echo ""
