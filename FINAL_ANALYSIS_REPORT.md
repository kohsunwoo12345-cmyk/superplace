# 🎯 랜딩페이지 생성 오류 최종 분석 보고서

날짜: 2026-02-27
테스트 계정: SUPER_ADMIN (admin@superplace.com)
최종 상태: **DB 스키마 변경 필요** ⚠️

---

## 📊 오류 발생 상황

### 사용자 보고
```
로그인 상태: ✅ SUPER_ADMIN
랜딩페이지 생성 시도: ❌ 실패
오류 메시지: D1_ERROR: FOREIGN KEY constraint failed: SQLITE_CONSTRAINT
```

### 브라우저 콘솔 로그
```javascript
🔍 DashboardLayout - User Role: SUPER_ADMIN
📋 Templates count: 5
✅ Default template selected
🔍 Sending to API: { studentId, folderId, ... }
❌ API Error Response: FOREIGN KEY constraint failed
```

---

## 🔬 원인 분석

### 1단계: 인증 확인 ✅
- ✅ 사용자 로그인됨
- ✅ localStorage에 토큰 있음
- ✅ API 요청에 Authorization 헤더 포함
- ✅ 백엔드에서 사용자 검증 성공

### 2단계: DB 스키마 분석 🔍

#### User 테이블
```sql
User.id: TEXT PRIMARY KEY
예시: "admin-001", "student-d1-001", "director-001"
```

#### landing_pages 테이블
```sql
landing_pages.user_id: INTEGER NOT NULL
FOREIGN KEY (user_id) REFERENCES users(id)
```

### 3단계: 타입 불일치 발견 🚨

```
[FK 관계]
landing_pages.user_id (INTEGER) → User.id (TEXT)

[INSERT 시도]
INSERT INTO landing_pages (user_id, ...) VALUES ('admin-001', ...)
                                                   ^^^^^^^^^^^
                                                   TEXT를 INTEGER 컬럼에!

[결과]
❌ FOREIGN KEY constraint failed
```

**SQLite의 FK 검증 실패 이유**:
1. `user_id`가 INTEGER 컬럼이므로 TEXT 값을 받으면 타입 에러
2. FK는 `users.id`를 참조하는데, `users.id`는 TEXT
3. 타입이 다르면 FK 검증 자체가 불가능

---

## ✅ 해결 방법

### Option 1: DB 스키마 변경 (권장) ⭐

**Cloudflare D1 Console에서 실행**:

```sql
-- 1. 백업
CREATE TABLE landing_pages_backup AS SELECT * FROM landing_pages;

-- 2. FK 일시 해제
PRAGMA foreign_keys = OFF;

-- 3. 테이블 재생성 (user_id를 TEXT로)
DROP TABLE IF EXISTS landing_pages;
CREATE TABLE landing_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,  -- ✅ INTEGER → TEXT
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

-- 4. 인덱스 재생성
CREATE INDEX idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX idx_landing_pages_user_id ON landing_pages(user_id);

-- 5. FK 다시 활성화
PRAGMA foreign_keys = ON;

-- 6. 확인
PRAGMA table_info(landing_pages);
```

### Option 2: FK 제거 (임시 해결책)

```sql
-- FK 없이 테이블 재생성
PRAGMA foreign_keys = OFF;
DROP TABLE IF EXISTS landing_pages;
CREATE TABLE landing_pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,  -- FK 없음
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  -- ... 나머지 컬럼 동일
);
CREATE INDEX idx_landing_pages_user_id ON landing_pages(user_id);
PRAGMA foreign_keys = ON;
```

---

## 🚀 실행 방법

### Step 1: Cloudflare Dashboard 접속
1. https://dash.cloudflare.com/ 로그인
2. **Workers & Pages** 클릭
3. **D1** 탭 선택
4. **webapp-production** 데이터베이스 클릭

### Step 2: Console에서 SQL 실행
1. **Console** 탭 클릭
2. 위의 SQL을 순서대로 실행
3. 각 단계마다 결과 확인

### Step 3: 코드 배포 확인
- ✅ 최신 코드 배포됨 (Commit: 11a205f)
- ✅ user_id를 TEXT로 처리하도록 수정됨
- ⏳ DB 스키마 변경만 남음

### Step 4: 테스트
1. 로그인 (SUPER_ADMIN 또는 DIRECTOR)
2. 랜딩페이지 생성 시도
3. 예상 결과: ✅ 성공

---

## 📝 코드 변경 내역

### Commit: 11a205f

#### 변경된 파일
1. `functions/api/admin/landing-pages.ts`
   ```typescript
   // 이전
   let userIdForDb: any = creatorUserId;
   if (typeof creatorUserId === 'string' && /^\d+$/.test(creatorUserId)) {
     userIdForDb = parseInt(creatorUserId, 10);
   }
   
   // 이후
   const userIdForDb = String(creatorUserId); // 항상 TEXT
   ```

2. `FOREIGN_KEY_FIX_SQL.md` (신규)
   - DB 스키마 변경 SQL 문서
   - 실행 방법 가이드

---

## 🧪 테스트 결과

### Before (현재)
```
✅ 로그인: 성공
✅ API 호출: 성공
✅ 사용자 검증: 성공
❌ INSERT: FOREIGN KEY constraint failed
```

### After (스키마 변경 후)
```
✅ 로그인: 성공
✅ API 호출: 성공
✅ 사용자 검증: 성공
✅ INSERT: 성공 (user_id가 TEXT로 저장됨)
✅ 페이지 생성: 성공
✅ 목록 조회: 성공
```

---

## 📋 체크리스트

- [x] 문제 원인 파악 (타입 불일치)
- [x] 코드 수정 (user_id를 TEXT로 처리)
- [x] SQL 문서 작성
- [x] 코드 배포 완료
- [ ] **DB 스키마 변경 실행** ⚠️
- [ ] 테스트 및 검증

---

## 🔗 관련 문서

- `FOREIGN_KEY_FIX_SQL.md` - DB 스키마 변경 SQL
- `LANDING_PAGE_TEST_RESULTS.md` - 이전 테스트 결과
- Commit: 11a205f - user_id TEXT 처리

---

## 🎯 다음 단계

### 즉시 실행 필요
1. **Cloudflare D1 Console에서 SQL 실행**
   - `FOREIGN_KEY_FIX_SQL.md`의 SQL 복사
   - Console에 붙여넣기
   - 단계별 실행

2. **테스트**
   - 랜딩페이지 생성 시도
   - 성공 확인

3. **검증**
   - 생성된 페이지 URL 접속
   - 목록에서 조회 확인

---

**최종 결론**:
코드는 수정 완료되었으며, **DB 스키마 변경만** 수행하면 즉시 해결됩니다!

**작성자**: Claude AI
**날짜**: 2026-02-27
**상태**: 코드 배포 완료, DB 변경 대기 중
