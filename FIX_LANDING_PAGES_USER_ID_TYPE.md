# landing_pages.user_id 타입 불일치 해결

## 문제
FOREIGN KEY constraint 오류 발생
→ landing_pages.user_id (INTEGER) ≠ User.id (TEXT)

## 해결 방법

### Cloudflare D1 Console에서 실행

```sql
-- 1. 현재 테이블 구조 확인
PRAGMA table_info(landing_pages);

-- 2. user_id 컬럼 타입 확인 (INTEGER인지 TEXT인지)

-- 만약 user_id가 INTEGER라면:

-- Step 1: 기존 데이터 백업
CREATE TABLE landing_pages_backup AS SELECT * FROM landing_pages;

-- Step 2: 기존 테이블 삭제
DROP TABLE landing_pages;

-- Step 3: 새 테이블 생성 (user_id를 TEXT로)
CREATE TABLE landing_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
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
  conversion_pixel TEXT,
  FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
);

-- Step 4: 기존 데이터 복원 (있다면)
-- INSERT INTO landing_pages SELECT * FROM landing_pages_backup;

-- Step 5: 백업 테이블 삭제
-- DROP TABLE landing_pages_backup;
```

## 중요
User.id가 TEXT 타입이므로, landing_pages.user_id도 TEXT여야 합니다!
