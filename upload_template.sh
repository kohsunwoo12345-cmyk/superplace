#!/bin/bash
# ============================================
# Wrangler를 통한 템플릿 업로드 스크립트
# ============================================

echo "🚀 Wrangler를 통한 템플릿 업로드 시작..."

# 1. Wrangler 설치 확인
if ! command -v wrangler &> /dev/null; then
    echo "📦 Wrangler 설치 중..."
    npm install -g wrangler
fi

# 2. Wrangler 로그인 확인
echo "🔐 Cloudflare 로그인 확인..."
wrangler whoami || wrangler login

# 3. D1 데이터베이스 이름 입력
echo ""
echo "📋 사용 가능한 D1 데이터베이스 목록:"
wrangler d1 list

echo ""
read -p "📝 D1 데이터베이스 이름을 입력하세요: " DB_NAME

# 4. User 테이블에 admin 추가 (없으면)
echo ""
echo "👤 Admin 사용자 추가 중..."
wrangler d1 execute "$DB_NAME" --command "INSERT OR IGNORE INTO User (id, email, name, role, password, createdAt, updatedAt) VALUES ('1', 'admin@superplace.com', 'System Admin', 'SUPER_ADMIN', 'hashed_password', datetime('now'), datetime('now'));"

# 5. 간단한 템플릿 먼저 추가
echo ""
echo "✨ 간단한 테스트 템플릿 추가 중..."
wrangler d1 execute "$DB_NAME" --file="SIMPLE_TEMPLATE_INSERT.sql"

# 6. 템플릿 확인
echo ""
echo "📋 추가된 템플릿 확인:"
wrangler d1 execute "$DB_NAME" --command "SELECT id, name, isDefault FROM LandingPageTemplate;"

echo ""
echo "✅ 완료! 웹 페이지에서 확인하세요."
echo "🌐 https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates"
