# Landing Pages 테이블 수정 - 단계별 실행 가이드

## ⚠️ 주의사항
Cloudflare D1 콘솔에서는 **한 번에 하나의 SQL 문만** 실행할 수 있습니다.
아래 SQL을 **하나씩 순서대로** 복사하여 실행하세요.

---

## 1단계: 현재 테이블 구조 확인

```sql
PRAGMA table_info(landing_pages);
```

**확인사항**: 어떤 컬럼들이 이미 존재하는지 확인하세요.

---

## 2단계: 기존 데이터 백업

```sql
CREATE TABLE IF NOT EXISTS landing_pages_backup AS SELECT * FROM landing_pages;
```

---

## 3단계: 새 테이블 생성

```sql
CREATE TABLE IF NOT EXISTS landing_pages_new (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  templateType TEXT DEFAULT 'basic',
  templateHtml TEXT,
  inputData TEXT DEFAULT '[]',
  ogTitle TEXT,
  ogDescription TEXT,
  thumbnail TEXT,
  folderId TEXT,
  showQrCode INTEGER DEFAULT 1,
  qrCodePosition TEXT DEFAULT 'bottom',
  qrCodeUrl TEXT,
  pixelScripts TEXT DEFAULT '[]',
  studentId TEXT,
  viewCount INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdById TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);
```

---

## 4단계: 데이터 복사

### 4-1. 기존 데이터 확인
```sql
SELECT COUNT(*) as total_rows FROM landing_pages;
```

### 4-2. 데이터가 있는 경우 실행
```sql
INSERT INTO landing_pages_new (id, slug, title, subtitle, description, templateType, templateHtml, inputData, ogTitle, ogDescription, thumbnail, folderId, showQrCode, qrCodePosition, qrCodeUrl, pixelScripts, studentId, viewCount, isActive, createdById, createdAt, updatedAt)
SELECT 
  COALESCE(id, 'lp_' || CAST(ROWID AS TEXT)) as id,
  COALESCE(slug, 'slug_' || CAST(ROWID AS TEXT)) as slug,
  COALESCE(title, 'Untitled') as title,
  NULL as subtitle,
  NULL as description,
  'basic' as templateType,
  NULL as templateHtml,
  '[]' as inputData,
  NULL as ogTitle,
  NULL as ogDescription,
  NULL as thumbnail,
  NULL as folderId,
  1 as showQrCode,
  'bottom' as qrCodePosition,
  NULL as qrCodeUrl,
  '[]' as pixelScripts,
  NULL as studentId,
  0 as viewCount,
  1 as isActive,
  'admin' as createdById,
  datetime('now') as createdAt,
  datetime('now') as updatedAt
FROM landing_pages;
```

### 4-3. 데이터가 없는 경우
아무것도 실행하지 않고 다음 단계로 진행

---

## 5단계: 기존 테이블 삭제

```sql
DROP TABLE landing_pages;
```

---

## 6단계: 새 테이블 이름 변경

```sql
ALTER TABLE landing_pages_new RENAME TO landing_pages;
```

---

## 7단계: 인덱스 생성

### 7-1. slug 인덱스
```sql
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
```

### 7-2. folderId 인덱스
```sql
CREATE INDEX IF NOT EXISTS idx_landing_pages_folder ON landing_pages(folderId);
```

### 7-3. studentId 인덱스
```sql
CREATE INDEX IF NOT EXISTS idx_landing_pages_student ON landing_pages(studentId);
```

### 7-4. isActive 인덱스
```sql
CREATE INDEX IF NOT EXISTS idx_landing_pages_active ON landing_pages(isActive);
```

---

## 8단계: 마이그레이션 확인

### 8-1. 테이블 구조 확인
```sql
PRAGMA table_info(landing_pages);
```

**확인사항**: 모든 컬럼이 있는지 확인하세요 (21개 컬럼)

### 8-2. 데이터 개수 확인
```sql
SELECT COUNT(*) as total_rows FROM landing_pages;
```

### 8-3. 백업과 비교
```sql
SELECT 
  (SELECT COUNT(*) FROM landing_pages_backup) as backup_count,
  (SELECT COUNT(*) FROM landing_pages) as new_count;
```

---

## 9단계: 백업 테이블 삭제 (선택사항)

**확인 후에만 실행하세요!**

```sql
DROP TABLE landing_pages_backup;
```

---

## 🎯 테스트

마이그레이션 완료 후:
1. 랜딩페이지 생성 페이지 접속
2. 학생 선택 및 정보 입력
3. "생성하기" 버튼 클릭
4. 오류 없이 생성 확인

---

## 🐛 문제 발생 시

### 오류: "table landing_pages already exists"
```sql
DROP TABLE IF EXISTS landing_pages_new;
```
그 후 3단계부터 다시 시작

### 데이터 복구 필요 시
```sql
DROP TABLE landing_pages;
ALTER TABLE landing_pages_backup RENAME TO landing_pages;
```

---

## 📝 참고

- 각 SQL은 **개별적으로** 실행해야 합니다
- 오류 발생 시 백업 테이블(`landing_pages_backup`)에서 복구 가능
- 모든 단계가 성공하면 백업 테이블 삭제
