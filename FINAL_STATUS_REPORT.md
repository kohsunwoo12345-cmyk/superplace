# 🎯 랜딩페이지 생성 문제 - 최종 상태 보고

## ✅ 완료된 작업

### 1. 진단 및 문제 파악
- ✅ 실제 오류 메시지 확인: `D1_ERROR: table landing_pages has no column named subtitle`
- ✅ `NOT NULL constraint failed: landing_pages.user_id` 발견
- ✅ `FOREIGN KEY constraint failed` 지속 확인

### 2. 스키마 불일치 확인
**마이그레이션 파일 스키마**:
- 컬럼: id (TEXT), slug, title, subtitle, description, templateType, createdBy, etc.

**실제 프로덕션 DB 스키마**:
- 컬럼: id (INTEGER AUTOINCREMENT), slug, title, user_id (INTEGER NOT NULL), template_type, content_json, html_content
- **없음**: subtitle, description, templateType (camelCase), createdBy

### 3. 적용된 수정사항
1. ✅ subtitle, description 컬럼 제거
2. ✅ template_type (snake_case) 사용
3. ✅ content_json, html_content 사용
4. ✅ user_id NOT NULL 제약 처리 시도
5. ✅ 실존하는 User ID 조회 후 사용

## ❌ 현재 상태

**여전히 실패**: `D1_ERROR: FOREIGN KEY constraint failed: SQLITE_CONSTRAINT`

## 🔍 근본 원인 분석

### FK 제약 상황
```sql
-- 프로덕션 테이블
CREATE TABLE landing_pages (
  ...
  user_id INTEGER NOT NULL,
  ...
  FOREIGN KEY (user_id) REFERENCES User(id)
);
```

**문제점**:
- `landing_pages.user_id` = INTEGER
- `User.id` = TEXT (예: 'user-1234567890-abc')
- **타입 불일치로 FK가 작동하지 않아야 하는데, SQLite가 FK를 체크하고 있음**

### 시도한 해결책 및 결과
1. ❌ `user_id = 0` → FK 실패
2. ❌ `user_id = -999` → FK 실패
3. ❌ `user_id = NULL` → NOT NULL 제약 실패
4. ❌ `user_id = (실존하는 User.id)` → 타입 불일치로 FK 실패
5. ❌ folder_id NULL → 여전히 FK 실패
6. ❌ PRAGMA foreign_keys=OFF → 작동 안 함

## 💡 최종 해결 방법 (수동 작업 필요)

### 방법 1: Cloudflare D1 콘솔에서 FK 제약 제거 (권장)
```sql
-- 1. 백업
CREATE TABLE landing_pages_backup AS SELECT * FROM landing_pages;

-- 2. FK 없는 새 테이블 생성
CREATE TABLE landing_pages_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  user_id INTEGER NOT NULL,  -- FK 제거!
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
  og_description TEXT
);

-- 3. 데이터 복사
INSERT INTO landing_pages_new SELECT * FROM landing_pages_backup;

-- 4. 테이블 교체
DROP TABLE landing_pages;
ALTER TABLE landing_pages_new RENAME TO landing_pages;

-- 5. 인덱스 재생성
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
```

### 방법 2: INTEGER 더미 사용자 생성
```sql
-- User 테이블에 INTEGER ID를 가진 더미 사용자 생성
-- (하지만 User.id가 TEXT PRIMARY KEY이므로 불가능)
```

### 방법 3: user_id 컬럼을 NULL 허용으로 변경
```sql
-- landing_pages 테이블 재생성하여 user_id를 NULL 허용으로 변경
-- (위 방법 1과 유사하나 user_id INTEGER NULL로 변경)
```

## 📊 최신 커밋

- **Commit**: `4add79e`
- **Branch**: `main`
- **Repo**: https://github.com/kohsunwoo12345-cmyk/superplace
- **Live Site**: https://superplacestudy.pages.dev

## 🚀 다음 단계

### 즉시 실행 가능 (Cloudflare D1 콘솔 접근 필요)
1. Cloudflare Dashboard 로그인
2. Workers & Pages → superplace
3. D1 데이터베이스 → webapp-production
4. Console 열기
5. 위의 "방법 1" SQL 실행

### 실행 후 테스트
```bash
cd /home/user/webapp
bash test_landing_page_creation.sh
```

**예상 결과**: HTTP 200 + 페이지 생성 성공

## 📝 작업 요약

- **작업 시간**: 약 2시간
- **커밋 수**: 20+
- **파악된 문제**: 프로덕션 DB 스키마와 마이그레이션 파일 불일치, FK 타입 불일치
- **최종 원인**: `landing_pages.user_id` (INTEGER) → `User.id` (TEXT) FK 제약
- **해결책**: D1 콘솔에서 FK 제약 제거 필요

## 🔗 관련 파일

- API: `/home/user/webapp/functions/api/admin/landing-pages.ts`
- 뷰: `/home/user/webapp/functions/lp/[slug].ts`
- 테스트: `/home/user/webapp/test_landing_page_creation.sh`
- 문서: 
  - `LANDING_PAGE_FINAL_DIAGNOSIS.md`
  - `LANDING_PAGE_FIX_SUMMARY.md`
  - `FK_CONSTRAINT_FINAL_SOLUTION.md`

