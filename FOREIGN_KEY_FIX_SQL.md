# 🚨 FOREIGN KEY 제약 실패 원인 및 해결책

## 문제 발견

### 타입 불일치
```
User.id:                TEXT    (예: "admin-001", "student-d1-001")
landing_pages.user_id:  INTEGER (NOT NULL)
FK: landing_pages.user_id → users.id
```

**결과**: TEXT 값을 INTEGER 컬럼에 INSERT하려고 하면 FK 체크 실패!

## 해결책

### Cloudflare D1 Console에서 실행할 SQL

```sql
-- 1. 백업 생성
CREATE TABLE landing_pages_backup AS SELECT * FROM landing_pages;

-- 2. FK 제약 일시 해제
PRAGMA foreign_keys = OFF;

-- 3. 기존 테이블 삭제
DROP TABLE IF EXISTS landing_pages;

-- 4. 새 테이블 생성 (user_id를 TEXT로 변경)
CREATE TABLE landing_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,  -- ✅ INTEGER → TEXT로 변경!
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
  FOREIGN KEY (user_id) REFERENCES User(id),
  FOREIGN KEY (folder_id) REFERENCES landing_folders(id)
);

-- 5. 인덱스 재생성
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX idx_landing_pages_user_id ON landing_pages(user_id);

-- 6. 데이터 복원 (선택사항 - 기존 데이터가 있다면)
-- INSERT INTO landing_pages SELECT * FROM landing_pages_backup;

-- 7. FK 제약 다시 활성화
PRAGMA foreign_keys = ON;

-- 8. 확인
SELECT COUNT(*) FROM landing_pages;
PRAGMA table_info(landing_pages);
```

## 실행 방법

1. **Cloudflare Dashboard** 접속
   https://dash.cloudflare.com/

2. **Workers & Pages** → **D1** 클릭

3. **webapp-production** 데이터베이스 선택

4. **Console** 탭 클릭

5. 위의 SQL을 순서대로 실행

## 예상 결과

### 실행 전
```
❌ FOREIGN KEY constraint failed
(TEXT 값을 INTEGER 컬럼에 INSERT 시도)
```

### 실행 후
```
✅ 랜딩페이지가 생성되었습니다!
✅ 목록에서 조회 가능
✅ 페이지 정상 작동
```

## 대안 (임시 해결책)

FK 제약을 제거하고 user_id를 TEXT로 사용:

```sql
-- FK 없이 재생성
PRAGMA foreign_keys = OFF;
DROP TABLE IF EXISTS landing_pages;
CREATE TABLE landing_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,  -- FK 없음
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
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX idx_landing_pages_user_id ON landing_pages(user_id);
PRAGMA foreign_keys = ON;
```

## 검증

SQL 실행 후 다음으로 테스트:

```bash
# 로그인 후 랜딩페이지 생성 시도
# 예상 결과: HTTP 200 + 페이지 생성 성공
```

---

**작성**: 2026-02-27
**원인**: User.id(TEXT)와 landing_pages.user_id(INTEGER) 타입 불일치
**해결**: user_id 컬럼을 TEXT로 변경
