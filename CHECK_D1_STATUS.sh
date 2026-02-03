#!/bin/bash

echo "=================================================="
echo "🔍 D1 데이터베이스 상태 확인"
echo "=================================================="
echo ""
echo "현재 API 에러 메시지를 확인 중..."
echo ""

RESPONSE=$(curl -s -X POST "https://genspark-ai-developer.superplacestudy.pages.dev/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@superplace.com","password":"admin123456"}')

echo "📡 API 응답:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

if echo "$RESPONSE" | grep -q "no such column: academyId"; then
    echo "❌ 문제 발견!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Users 테이블에 academyId 컬럼이 없습니다."
    echo ""
    echo "📍 원인:"
    echo "  D1 Console에서 SQL을 실행하지 않았거나"
    echo "  올바르지 않은 SQL을 실행했습니다."
    echo ""
    echo "✅ 해결 방법:"
    echo "  1. https://dash.cloudflare.com/ 접속"
    echo "  2. Workers & Pages → D1 → superplace-db → Console"
    echo "  3. 아래 명령어로 현재 테이블 구조 확인:"
    echo ""
    echo "     PRAGMA table_info(users);"
    echo ""
    echo "  4. academyId 컬럼이 없으면, 아래 SQL 실행:"
    echo ""
    cat << 'EOSQL'
-- 기존 테이블 삭제
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS academy;

-- Users 테이블 (academyId 포함!)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  academyId TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_academyId ON users(academyId);

-- 관리자 계정
INSERT INTO users (id, email, password, name, role, phone, academyId, createdAt, updatedAt)
VALUES ('admin-001', 'admin@superplace.com', 'admin123456', '슈퍼플레이스 관리자', 'ADMIN', '010-8739-9697', NULL, datetime('now'), datetime('now'));

-- 확인
SELECT * FROM users WHERE email = 'admin@superplace.com';
EOSQL
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
elif echo "$RESPONSE" | grep -q "이메일 또는 비밀번호가 올바르지 않습니다"; then
    echo "⚠️  테이블은 있지만 관리자 계정이 없습니다!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "D1 Console에서 이 SQL을 실행하세요:"
    echo ""
    echo "INSERT INTO users (id, email, password, name, role, phone, academyId, createdAt, updatedAt)"
    echo "VALUES ('admin-001', 'admin@superplace.com', 'admin123456', '슈퍼플레이스 관리자', 'ADMIN', '010-8739-9697', NULL, datetime('now'), datetime('now'));"
    echo ""
elif echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ 성공! 로그인이 정상 작동합니다!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "이제 웹사이트에서 로그인하세요:"
    echo "https://genspark-ai-developer.superplacestudy.pages.dev/login"
    echo ""
    echo "이메일: admin@superplace.com"
    echo "비밀번호: admin123456"
else
    echo "⚠️  예상치 못한 응답:"
    echo "$RESPONSE"
fi

echo ""
echo "=================================================="
