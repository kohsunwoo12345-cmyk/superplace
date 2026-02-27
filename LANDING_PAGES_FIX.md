# Landing Pages 테이블 수정 가이드

## 문제
랜딩페이지 생성 시 다음 오류 발생:
```
D1_ERROR: table landing_pages has no column named subtitle: SQLITE_ERROR
```

## 원인
`landing_pages` 테이블에 필수 컬럼들이 누락되어 있습니다.

## 해결 방법

### 1. Cloudflare D1 데이터베이스 콘솔 접속
1. Cloudflare Dashboard 로그인
2. Workers & Pages 선택
3. D1 Databases 선택
4. 사용 중인 데이터베이스 선택

### 2. 마이그레이션 SQL 실행
다음 SQL을 콘솔에서 실행하세요:

```sql
-- Landing Pages 테이블 수정
-- subtitle 및 누락된 컬럼들 추가

ALTER TABLE landing_pages ADD COLUMN subtitle TEXT;
ALTER TABLE landing_pages ADD COLUMN description TEXT;
ALTER TABLE landing_pages ADD COLUMN templateType TEXT DEFAULT 'basic';
ALTER TABLE landing_pages ADD COLUMN templateHtml TEXT;
ALTER TABLE landing_pages ADD COLUMN inputData TEXT DEFAULT '[]';
ALTER TABLE landing_pages ADD COLUMN ogTitle TEXT;
ALTER TABLE landing_pages ADD COLUMN ogDescription TEXT;
ALTER TABLE landing_pages ADD COLUMN thumbnail TEXT;
ALTER TABLE landing_pages ADD COLUMN folderId TEXT;
ALTER TABLE landing_pages ADD COLUMN showQrCode INTEGER DEFAULT 1;
ALTER TABLE landing_pages ADD COLUMN qrCodePosition TEXT DEFAULT 'bottom';
ALTER TABLE landing_pages ADD COLUMN qrCodeUrl TEXT;
ALTER TABLE landing_pages ADD COLUMN pixelScripts TEXT DEFAULT '[]';
ALTER TABLE landing_pages ADD COLUMN studentId TEXT;
ALTER TABLE landing_pages ADD COLUMN viewCount INTEGER DEFAULT 0;
ALTER TABLE landing_pages ADD COLUMN isActive INTEGER DEFAULT 1;
ALTER TABLE landing_pages ADD COLUMN createdById TEXT;
ALTER TABLE landing_pages ADD COLUMN createdAt TEXT DEFAULT (datetime('now'));
ALTER TABLE landing_pages ADD COLUMN updatedAt TEXT DEFAULT (datetime('now'));
```

### 3. 컬럼 존재 확인
다음 쿼리로 테이블 구조 확인:

```sql
PRAGMA table_info(landing_pages);
```

### 4. 폴더 테이블 확인
폴더 기능을 사용하려면 다음 테이블도 필요합니다:

```sql
CREATE TABLE IF NOT EXISTS landing_page_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#3b82f6',
  pagesCount INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 기본 폴더 추가
INSERT OR IGNORE INTO landing_page_folders (id, name, description) VALUES 
('folder-default', '기본 폴더', '기본 랜딩페이지 폴더'),
('folder-promotion', '프로모션', '프로모션용 랜딩페이지'),
('folder-event', '이벤트', '이벤트용 랜딩페이지');
```

## 테스트
1. Cloudflare Dashboard에서 SQL 실행
2. 랜딩페이지 생성 기능 테스트
3. 폴더 선택 및 저장 확인

## 추가 참고
- 마이그레이션 파일 위치: `/migrations/004_landing_pages_columns.sql`
- API 파일: `/functions/api/admin/landing-pages.ts`
- 프론트엔드: `/src/app/dashboard/admin/landing-pages/create/page.tsx`

## 문제 발생 시
1. 테이블 구조 확인: `PRAGMA table_info(landing_pages);`
2. 에러 로그 확인
3. Cloudflare Dashboard에서 D1 쿼리 직접 테스트
