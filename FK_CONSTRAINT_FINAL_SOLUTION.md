# 🎯 최종 해결책: FOREIGN KEY 제약 완전 제거

## 문제 분석

1. **현재 상황**:
   - `landing_pages.user_id` (INTEGER NOT NULL) → `User.id` (TEXT) FK 제약
   - `PRAGMA foreign_keys=OFF`가 Cloudflare D1에서 작동하지 않음
   - 빈 문자열, 0 모두 FK 제약 위반

2. **근본 원인**:
   - 타입 불일치: INTEGER → TEXT 참조
   - FK 제약이 활성화되어 있고 비활성화 불가

## ✅ 해결 방법 3가지

### 방법 1: 더미 사용자 생성 (권장)
```sql
-- Cloudflare D1 콘솔에서 실행
INSERT OR IGNORE INTO User (id, email, name, role, password, createdAt, updatedAt)
VALUES ('0', 'dummy@system.com', 'System User', 'SYSTEM', 'N/A', datetime('now'), datetime('now'));
```

그 다음 API에서 `user_id = '0'` (문자열) 사용

### 방법 2: FK 제약 제거 (테이블 재생성 필요)
```sql
-- 백업
CREATE TABLE landing_pages_backup AS SELECT * FROM landing_pages;

-- 새 테이블 (FK 없이)
CREATE TABLE landing_pages_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,  -- FK 제약 제거
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  template_type TEXT NOT NULL,
  content_json TEXT NOT NULL,
  html_content TEXT NOT NULL,
  qr_code_url TEXT,
  view_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  folder_id INTEGER,
  thumbnail_url TEXT,
  og_title TEXT,
  og_description TEXT,
  form_template_id INTEGER,
  form_id INTEGER,
  header_pixel TEXT,
  body_pixel TEXT,
  conversion_pixel TEXT
);

-- 데이터 복사
INSERT INTO landing_pages_new SELECT * FROM landing_pages_backup;

-- 교체
DROP TABLE landing_pages;
ALTER TABLE landing_pages_new RENAME TO landing_pages;
```

### 방법 3: user_id를 NULL 허용으로 변경
```sql
-- 스키마 변경 (위와 유사한 프로세스)
-- user_id INTEGER NULL로 변경하고 API에서 NULL 저장
```

## 🚀 즉시 적용 가능한 해결책

**API 코드에서 타입 일치시키기:**
- `User.id`가 TEXT이므로 `user_id`도 TEXT여야 함
- 또는 `User` 테이블에 INTEGER id=0인 더미 레코드 생성

