#!/bin/bash

echo "=================================================="
echo "🚀 슈퍼플레이스 - 완전 자동 설정 가이드"
echo "=================================================="
echo ""
echo "✅ 진단 완료:"
echo "  - D1 바인딩: 정상 작동 중"
echo "  - 문제: academyId 컬럼 누락"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 단계별 해결 방법"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "【Step 1】Cloudflare D1 Console 접속"
echo "  → URL: https://dash.cloudflare.com/"
echo "  → Workers & Pages → D1 → superplace-db → Console"
echo ""
echo "【Step 2】아래 SQL을 복사해서 Console에 붙여넣고 실행"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'EOF'

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

-- Academy 테이블
CREATE TABLE academy (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logoUrl TEXT,
  subscriptionPlan TEXT DEFAULT 'FREE',
  maxStudents INTEGER DEFAULT 10,
  maxTeachers INTEGER DEFAULT 2,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_academy_code ON academy(code);

-- Classes 테이블
CREATE TABLE classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  academyId TEXT NOT NULL,
  teacherId TEXT,
  startDate TEXT,
  endDate TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (academyId) REFERENCES academy(id),
  FOREIGN KEY (teacherId) REFERENCES users(id)
);
CREATE INDEX idx_classes_academyId ON classes(academyId);

-- Students 테이블
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  academyId TEXT NOT NULL,
  grade TEXT,
  parentPhone TEXT,
  status TEXT DEFAULT 'ACTIVE',
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (academyId) REFERENCES academy(id)
);
CREATE INDEX idx_students_academyId ON students(academyId);

-- 관리자 계정 생성
INSERT INTO users (
  id, email, password, name, role, phone, academyId, createdAt, updatedAt
) VALUES (
  'admin-001',
  'admin@superplace.com',
  'admin123456',
  '슈퍼플레이스 관리자',
  'ADMIN',
  '010-8739-9697',
  NULL,
  datetime('now'),
  datetime('now')
);

-- 테스트 학원 생성
INSERT INTO academy (
  id, name, code, description, address, phone, email, 
  subscriptionPlan, maxStudents, maxTeachers, isActive, 
  createdAt, updatedAt
) VALUES (
  'academy-001',
  '슈퍼플레이스 학원',
  'SUPERPLACE01',
  '체계적인 학습 관리를 위한 스마트 학원',
  '인천광역시 서구 청라커낼로 270, 2층',
  '010-8739-9697',
  'academy@superplace.com',
  'PREMIUM',
  100,
  10,
  1,
  datetime('now'),
  datetime('now')
);

-- 확인
SELECT * FROM users WHERE email = 'admin@superplace.com';

EOF
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "【Step 3】실행 완료 후 확인"
echo "  → SELECT 쿼리 결과에 admin-001 계정이 보여야 함"
echo "  → academyId 컬럼이 NULL로 표시되어야 함"
echo ""
echo "【Step 4】로그인 테스트"
echo "  → URL: https://genspark-ai-developer.superplacestudy.pages.dev/login"
echo "  → 이메일: admin@superplace.com"
echo "  → 비밀번호: admin123456"
echo ""
echo "=================================================="
echo "🎯 완료 체크리스트"
echo "=================================================="
echo "  [ ] D1 Console 접속"
echo "  [ ] SQL 복사 & 붙여넣기"
echo "  [ ] 실행 버튼 클릭"
echo "  [ ] SELECT 결과 확인 (admin-001 존재)"
echo "  [ ] 로그인 페이지 접속"
echo "  [ ] 로그인 성공 ✅"
echo ""
echo "=================================================="
echo ""

# API 테스트
echo "지금 API 테스트를 실행하시겠습니까? (y/n)"
read -r answer

if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
    echo ""
    echo "🧪 API 테스트 중..."
    echo ""
    
    RESPONSE=$(curl -s -X POST "https://genspark-ai-developer.superplacestudy.pages.dev/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@superplace.com","password":"admin123456"}')
    
    echo "응답:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    echo ""
    
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo "✅ 성공! 로그인이 정상 작동합니다!"
        echo "   → 이제 웹사이트에서 로그인하세요!"
    elif echo "$RESPONSE" | grep -q 'no such column: academyId'; then
        echo "❌ 아직 academyId 컬럼이 없습니다."
        echo "   → Step 1-2의 SQL을 D1 Console에서 실행하세요."
    elif echo "$RESPONSE" | grep -q '이메일 또는 비밀번호가 올바르지 않습니다'; then
        echo "❌ 관리자 계정이 없습니다."
        echo "   → Step 2의 INSERT 문을 D1 Console에서 실행하세요."
    else
        echo "⚠️  예상치 못한 응답:"
        echo "$RESPONSE"
    fi
else
    echo "테스트를 건너뜁니다."
fi

echo ""
echo "스크립트 종료."
