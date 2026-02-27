# 🔧 user_id가 여전히 INTEGER로 표시되는 문제 해결

## 문제 상황
PRAGMA table_info(landing_pages) 실행 시 user_id가 여전히 INTEGER로 표시됨

## 원인
SQLite는 컬럼 타입 변경을 직접 지원하지 않음. 
테이블을 완전히 재생성해야 함.

---

## 해결 방법 1: 완전 재생성 (권장)

다음 명령어를 **순서대로 하나씩** 실행하세요:

### 1. 기존 백업 삭제
```sql
DROP TABLE IF EXISTS landing_pages_backup;
```

### 2. 현재 데이터 백업
```sql
CREATE TABLE landing_pages_backup AS SELECT * FROM landing_pages;
```

### 3. FK 제약 해제
```sql
PRAGMA foreign_keys = OFF;
```

### 4. 기존 테이블 완전 삭제
```sql
DROP TABLE landing_pages;
```

### 5. 새 테이블 생성 (user_id를 TEXT로)
```sql
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
  FOREIGN KEY (user_id) REFERENCES User(id),
  FOREIGN KEY (folder_id) REFERENCES landing_folders(id)
);
```

### 6. 인덱스 생성
```sql
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
```

```sql
CREATE INDEX idx_landing_pages_user_id ON landing_pages(user_id);
```

### 7. FK 제약 다시 활성화
```sql
PRAGMA foreign_keys = ON;
```

### 8. 확인
```sql
PRAGMA table_info(landing_pages);
```

**예상 결과**: user_id가 **TEXT**로 표시되어야 함!

---

## 해결 방법 2: FK 제약 없이 생성 (더 간단)

FK 문제가 계속되면 FK 없이 생성:

### 1-4. 위와 동일

### 5. FK 없이 테이블 생성
```sql
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
  conversion_pixel TEXT
);
```

### 6-8. 위와 동일

---

## 🚨 중요 체크포인트

### PRAGMA table_info(landing_pages) 결과 확인

**올바른 결과**:
```
cid | name          | type    | notnull | dflt_value          | pk
----|---------------|---------|---------|---------------------|----
0   | id            | INTEGER | 0       | NULL                | 1
1   | user_id       | TEXT    | 1       | NULL                | 0  ✅ TEXT!
2   | slug          | TEXT    | 1       | NULL                | 0
3   | title         | TEXT    | 1       | NULL                | 0
```

**잘못된 결과**:
```
1   | user_id       | INTEGER | 1       | NULL                | 0  ❌ INTEGER
```

---

## 디버깅

### 현재 테이블이 정말 삭제되었는지 확인
```sql
SELECT name FROM sqlite_master WHERE type='table' AND name='landing_pages';
```

**결과가 비어있으면**: 테이블이 삭제됨 (정상)
**결과가 있으면**: 아직 존재함 (다시 DROP 필요)

### 테이블이 삭제 안 되는 경우
```sql
PRAGMA foreign_keys = OFF;
```
```sql
DROP TABLE IF EXISTS landing_pages;
```
```sql
SELECT name FROM sqlite_master WHERE type='table' AND name='landing_pages';
```

비어있어야 함!

---

## 최종 확인 스크립트

모든 단계 완료 후:

```sql
PRAGMA table_info(landing_pages);
```

```sql
PRAGMA foreign_key_list(landing_pages);
```

```sql
SELECT COUNT(*) FROM landing_pages;
```

---

## 💡 왜 INTEGER로 계속 표시되나?

1. **테이블이 실제로 삭제되지 않음**
   - DROP TABLE이 실행 안 됨
   - 이미 있는 테이블 그대로 사용 중

2. **CREATE TABLE이 실행 안 됨**
   - "table already exists" 오류 (무시하고 넘어갔을 수 있음)
   - 새 스키마가 적용 안 됨

3. **캐시 문제**
   - Console을 새로고침해보세요

---

## ✅ 성공 확인

```sql
PRAGMA table_info(landing_pages);
```

실행 시 **user_id**가 **TEXT**로 표시되면 성공!

그 다음:
1. 브라우저에서 랜딩페이지 생성 시도
2. ✅ 성공 예상!

