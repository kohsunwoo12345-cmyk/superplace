# 🚨 랜딩페이지 긴급 복구 가이드

## 문제 상황
- **오류**: `D1_ERROR: no such column: slug at offset 35: SQLITE_ERROR`
- **원인**: `landing_pages` 테이블에 `slug` 컬럼이 없음
- **영향**: 랜딩페이지 생성 및 목록 조회 불가

## ✅ 즉시 복구 방법

### 1단계: Cloudflare D1 콘솔 접속
1. https://dash.cloudflare.com 로그인
2. **Workers & Pages** 클릭
3. **D1** 탭 선택
4. 데이터베이스 선택 (예: `webapp-production`)
5. **Console** 탭 클릭

### 2단계: SQL 실행 (순서대로)

#### SQL 1: slug 컬럼 추가
```sql
ALTER TABLE landing_pages ADD COLUMN slug TEXT;
```
**예상 결과**: `Success` 또는 컬럼이 이미 있다는 메시지

#### SQL 2: 기존 데이터에 slug 값 설정
```sql
UPDATE landing_pages 
SET slug = 'lp-' || id 
WHERE slug IS NULL OR slug = '';
```
**예상 결과**: `X rows affected` (X = 업데이트된 행 수)

#### SQL 3: UNIQUE 인덱스 추가
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
```
**예상 결과**: `Success`

#### SQL 4: 확인
```sql
SELECT id, slug, title, created_at FROM landing_pages ORDER BY created_at DESC LIMIT 5;
```
**예상 결과**: 최근 5개 랜딩페이지 목록 (slug 포함)

#### SQL 5: 테이블 구조 확인
```sql
PRAGMA table_info(landing_pages);
```
**예상 결과**: 모든 컬럼 목록 (slug 포함되어야 함)

### 3단계: 동작 확인
1. 브라우저에서 랜딩페이지 목록 페이지 새로고침
2. 새 랜딩페이지 생성 시도
3. 오류 없이 정상 동작 확인

## 🔍 문제가 계속되는 경우

### 대안 1: 테이블 재생성 (데이터 백업 필수!)

```sql
-- 1. 기존 데이터 백업 (JSON으로 복사 저장)
SELECT * FROM landing_pages;

-- 2. 테이블 삭제 (⚠️ 위험!)
DROP TABLE IF EXISTS landing_pages;

-- 3. 새 테이블 생성
CREATE TABLE landing_pages (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  templateType TEXT DEFAULT 'basic',
  templateHtml TEXT,
  customFields TEXT,
  thumbnailUrl TEXT,
  qrCodeUrl TEXT,
  metaTitle TEXT,
  metaDescription TEXT,
  isActive INTEGER DEFAULT 1,
  viewCount INTEGER DEFAULT 0,
  createdById TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 4. 인덱스 생성
CREATE INDEX idx_lp_slug ON landing_pages(slug);
CREATE INDEX idx_lp_created_at ON landing_pages(created_at);
CREATE INDEX idx_lp_createdById ON landing_pages(createdById);
```

### 대안 2: 구 스키마 확인

현재 테이블이 구 스키마인 경우 다음 컬럼들을 추가:

```sql
-- 필수 컬럼 추가
ALTER TABLE landing_pages ADD COLUMN slug TEXT;
ALTER TABLE landing_pages ADD COLUMN templateType TEXT DEFAULT 'basic';
ALTER TABLE landing_pages ADD COLUMN templateHtml TEXT;
ALTER TABLE landing_pages ADD COLUMN customFields TEXT;
ALTER TABLE landing_pages ADD COLUMN thumbnailUrl TEXT;
ALTER TABLE landing_pages ADD COLUMN qrCodeUrl TEXT;
ALTER TABLE landing_pages ADD COLUMN metaTitle TEXT;
ALTER TABLE landing_pages ADD COLUMN metaDescription TEXT;
ALTER TABLE landing_pages ADD COLUMN isActive INTEGER DEFAULT 1;
ALTER TABLE landing_pages ADD COLUMN createdById TEXT;

-- 기존 데이터 업데이트
UPDATE landing_pages SET slug = 'lp-' || id WHERE slug IS NULL;
UPDATE landing_pages SET isActive = 1 WHERE isActive IS NULL;
```

## 📊 완전한 테이블 스키마 (목표)

```sql
CREATE TABLE landing_pages (
  -- 기본 정보
  id TEXT PRIMARY KEY,                    -- 고유 ID
  slug TEXT UNIQUE NOT NULL,              -- URL 슬러그
  title TEXT NOT NULL,                    -- 제목
  subtitle TEXT,                          -- 부제목
  description TEXT,                       -- 설명
  
  -- 템플릿 정보
  templateType TEXT DEFAULT 'basic',      -- 템플릿 타입
  templateHtml TEXT,                      -- HTML 내용
  customFields TEXT,                      -- 커스텀 필드 (JSON)
  
  -- 메타 정보
  thumbnailUrl TEXT,                      -- 썸네일 URL
  qrCodeUrl TEXT,                         -- QR 코드 URL
  metaTitle TEXT,                         -- OG 제목
  metaDescription TEXT,                   -- OG 설명
  
  -- 상태 및 통계
  isActive INTEGER DEFAULT 1,             -- 활성 상태
  viewCount INTEGER DEFAULT 0,            -- 조회수
  
  -- 생성 정보
  createdById TEXT NOT NULL,              -- 생성자 ID
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

## ⚠️ 주의사항

1. **데이터 백업**: 테이블 재생성 전 반드시 데이터 백업
2. **순서 준수**: SQL 실행 순서를 반드시 지킬 것
3. **오류 확인**: 각 SQL 실행 후 오류 메시지 확인
4. **테스트**: 복구 후 반드시 동작 테스트

## 🎯 복구 완료 체크리스트

- [ ] `slug` 컬럼 추가 완료
- [ ] 기존 데이터에 slug 값 설정 완료
- [ ] UNIQUE 인덱스 생성 완료
- [ ] 테이블 구조 확인 완료
- [ ] 랜딩페이지 목록 조회 성공
- [ ] 새 랜딩페이지 생성 성공

## 📞 추가 지원

복구가 완료되지 않으면:
1. Cloudflare D1 Console의 **전체 오류 메시지** 복사
2. `PRAGMA table_info(landing_pages);` 실행 결과 복사
3. 위 정보를 제공하여 추가 지원 요청

---

**작성일**: 2026-03-07  
**적용 환경**: Cloudflare Pages + D1 Database
