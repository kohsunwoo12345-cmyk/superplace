# 🔧 Cloudflare D1 Console SQL 실행 가이드 (단계별)

⚠️ **중요**: Cloudflare D1 Console은 한 번에 하나의 SQL만 실행 가능!
아래 명령어를 **순서대로 하나씩** 복사해서 실행하세요.

---

## Step 1: 백업 생성

```sql
CREATE TABLE landing_pages_backup AS SELECT * FROM landing_pages;
```

**예상 결과**: `Query executed successfully` (또는 데이터 개수 표시)

---

## Step 2: FK 제약 일시 해제

```sql
PRAGMA foreign_keys = OFF;
```

**예상 결과**: `Success` 또는 아무 출력 없음

---

## Step 3: 기존 테이블 삭제

```sql
DROP TABLE IF EXISTS landing_pages;
```

**예상 결과**: `Query executed successfully`

---

## Step 4: 새 테이블 생성 (user_id를 TEXT로)

**⚠️ 이 명령어는 길지만 하나의 SQL이므로 전체를 한 번에 실행**:

```sql
CREATE TABLE landing_pages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, template_type TEXT NOT NULL, content_json TEXT NOT NULL, html_content TEXT NOT NULL, qr_code_url TEXT, view_count INTEGER DEFAULT 0, status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, folder_id INTEGER, thumbnail_url TEXT, og_title TEXT, og_description TEXT, form_template_id INTEGER, form_id INTEGER, header_pixel TEXT, body_pixel TEXT, conversion_pixel TEXT, FOREIGN KEY (user_id) REFERENCES User(id), FOREIGN KEY (folder_id) REFERENCES landing_folders(id));
```

**예상 결과**: `Query executed successfully`

---

## Step 5: 인덱스 생성 (slug)

```sql
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
```

**예상 결과**: `Query executed successfully`

---

## Step 6: 인덱스 생성 (user_id)

```sql
CREATE INDEX idx_landing_pages_user_id ON landing_pages(user_id);
```

**예상 결과**: `Query executed successfully`

---

## Step 7: FK 제약 다시 활성화

```sql
PRAGMA foreign_keys = ON;
```

**예상 결과**: `Success` 또는 아무 출력 없음

---

## Step 8: 확인 (테이블 구조 조회)

```sql
PRAGMA table_info(landing_pages);
```

**예상 결과**: 
```
cid | name          | type     | notnull | dflt_value | pk
----|---------------|----------|---------|------------|----
0   | id            | INTEGER  | 0       | NULL       | 1
1   | user_id       | TEXT     | 1       | NULL       | 0  ✅ TEXT로 변경됨!
2   | slug          | TEXT     | 1       | NULL       | 0
...
```

---

## Step 9: FK 확인

```sql
PRAGMA foreign_key_list(landing_pages);
```

**예상 결과**:
```
id | seq | table           | from      | to
---|-----|-----------------|-----------|----
0  | 0   | User            | user_id   | id
1  | 0   | landing_folders | folder_id | id
```

---

## Step 10: 데이터 개수 확인

```sql
SELECT COUNT(*) as count FROM landing_pages;
```

**예상 결과**: `count: 0` (새 테이블이므로 데이터 없음)

---

## ✅ 완료!

모든 단계가 성공하면:

### 다음 작업
1. 브라우저에서 로그인
2. 랜딩페이지 메뉴 클릭
3. 새 페이지 생성 시도
4. ✅ 성공 예상!

---

## 🚨 오류 발생 시

### "table landing_pages_backup already exists"
- Step 1을 이미 실행했음
- Step 2부터 계속 진행

### "no such table: landing_pages"
- Step 3을 이미 실행했음
- Step 4부터 계속 진행

### "table landing_pages already exists" (Step 4에서)
- Step 3이 실행 안 됨
- Step 3 다시 실행 후 Step 4 재시도

### "foreign key mismatch" 
- User 또는 landing_folders 테이블 없음
- 무시하고 계속 진행 (나중에 데이터 입력 시 확인)

---

## 📋 빠른 실행용 (복사하기 쉽게)

**Console에 하나씩 붙여넣으세요**:

```
CREATE TABLE landing_pages_backup AS SELECT * FROM landing_pages;
```
```
PRAGMA foreign_keys = OFF;
```
```
DROP TABLE IF EXISTS landing_pages;
```
```
CREATE TABLE landing_pages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, template_type TEXT NOT NULL, content_json TEXT NOT NULL, html_content TEXT NOT NULL, qr_code_url TEXT, view_count INTEGER DEFAULT 0, status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, folder_id INTEGER, thumbnail_url TEXT, og_title TEXT, og_description TEXT, form_template_id INTEGER, form_id INTEGER, header_pixel TEXT, body_pixel TEXT, conversion_pixel TEXT, FOREIGN KEY (user_id) REFERENCES User(id), FOREIGN KEY (folder_id) REFERENCES landing_folders(id));
```
```
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
```
```
CREATE INDEX idx_landing_pages_user_id ON landing_pages(user_id);
```
```
PRAGMA foreign_keys = ON;
```
```
PRAGMA table_info(landing_pages);
```
```
SELECT COUNT(*) FROM landing_pages;
```

---

**작성**: 2026-02-27
**목적**: Cloudflare D1 Console 단계별 실행 가이드
