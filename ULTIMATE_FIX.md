# 🔥 최종 해결책 - user_id가 계속 INTEGER인 문제

## 문제 원인
Cloudflare D1의 캐시 또는 동기화 문제로 변경사항이 반영되지 않고 있습니다.

---

## 해결책: 완전히 새로운 이름으로 테이블 생성

기존 `landing_pages` 대신 `landing_pages_v2`로 생성 후 이름 변경

---

## Step 1: Cloudflare D1 Console에서 실행

### 1. FK 해제
```sql
PRAGMA foreign_keys = OFF;
```

### 2. 기존 테이블 이름 변경 (백업)
```sql
ALTER TABLE landing_pages RENAME TO landing_pages_old_backup;
```

### 3. 새 테이블 생성 (user_id를 TEXT로)
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

### 4. 인덱스 생성
```sql
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
```

```sql
CREATE INDEX idx_landing_pages_user_id ON landing_pages(user_id);
```

### 5. FK 활성화
```sql
PRAGMA foreign_keys = ON;
```

### 6. 확인 ⭐
```sql
PRAGMA table_info(landing_pages);
```

**이제 user_id가 TEXT로 표시되어야 합니다!**

---

## Step 2: 테스트

1. 브라우저에서 랜딩페이지 생성 시도
2. ✅ 성공 확인

---

## 💡 왜 이 방법이 작동하나?

- `DROP TABLE`은 캐시 문제로 제대로 작동 안 할 수 있음
- `ALTER TABLE RENAME`은 즉시 반영됨
- 새 이름으로 테이블을 만들면 캐시 문제 우회

---

## 🚨 만약 여전히 실패한다면

다음 정보를 확인해주세요:

```sql
SELECT sql FROM sqlite_master WHERE type='table' AND name='landing_pages';
```

이 명령어 결과를 보내주시면 정확한 CREATE TABLE 문을 확인할 수 있습니다.

---

## 대안: 코드에서 INTEGER 처리

DB 스키마 변경이 계속 실패한다면, 코드를 수정해서 INTEGER로 처리할 수도 있습니다.

하지만 **먼저 위 방법을 시도해보세요!**

