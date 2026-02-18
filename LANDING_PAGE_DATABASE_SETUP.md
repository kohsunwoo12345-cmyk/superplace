# 랜딩페이지 생성기 - 데이터베이스 설정 가이드

## 🚨 "생성 중 오류가 발생했습니다" 해결 방법

### 원인
- Cloudflare D1 데이터베이스에 랜딩페이지 테이블이 생성되지 않았음
- 스키마 파일 (`cloudflare-worker/schema.sql`)이 적용되지 않음

---

## 📋 필수 작업: D1 데이터베이스 스키마 적용

### 1. Wrangler 설치 확인

```bash
# wrangler 설치 확인
npx wrangler --version

# 로그인 (처음 사용하는 경우)
npx wrangler login
```

### 2. D1 데이터베이스 확인

```bash
# Cloudflare 계정의 모든 D1 데이터베이스 목록 조회
npx wrangler d1 list

# 출력 예시:
# ┌──────────────────┬──────────────────────────────────────┬─────────┐
# │ Name             │ UUID                                 │ Version │
# ├──────────────────┼──────────────────────────────────────┼─────────┤
# │ superplace-db    │ xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx │ 1       │
# └──────────────────┴──────────────────────────────────────┴─────────┘
```

### 3. wrangler.toml 확인

`wrangler.toml` 파일에 D1 바인딩이 설정되어 있는지 확인:

```toml
name = "superplace-study"

[[d1_databases]]
binding = "DB"
database_name = "superplace-db"
database_id = "your-database-id-here"  # ← 실제 UUID로 변경
```

**중요:** `database_id`는 `wrangler d1 list` 명령어로 확인한 UUID를 입력해야 합니다.

### 4. 스키마 적용 (프로덕션)

```bash
# 프로덕션 D1 데이터베이스에 스키마 적용
cd /home/user/webapp
npx wrangler d1 execute DB --file=./cloudflare-worker/schema.sql

# 성공 메시지:
# 🌀 Executing on remote database DB (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx):
# 🌀 To execute on your local development database, pass the --local flag
# ✅ Successfully executed 15 statements
```

### 5. 테이블 생성 확인

```bash
# 생성된 테이블 목록 조회
npx wrangler d1 execute DB --command="SELECT name FROM sqlite_master WHERE type='table';"

# 출력에 다음 테이블들이 있어야 함:
# - User
# - Academy
# - BotAssignment
# - AIBot
# - LandingPageFolder        ← 랜딩페이지 폴더
# - LandingPage              ← 랜딩페이지
# - LandingPageSubmission    ← 신청자 데이터
# - LandingPagePixelScript   ← 픽셀 스크립트
```

### 6. LandingPage 테이블 구조 확인

```bash
# LandingPage 테이블 컬럼 확인
npx wrangler d1 execute DB --command="PRAGMA table_info(LandingPage);"

# 출력 예시:
# cid | name            | type    | notnull | dflt_value | pk
# ----|-----------------|---------|---------|------------|---
# 0   | id              | TEXT    | 0       |            | 1
# 1   | slug            | TEXT    | 1       |            | 0
# 2   | title           | TEXT    | 1       |            | 0
# 3   | subtitle        | TEXT    | 0       |            | 0
# 4   | description     | TEXT    | 0       |            | 0
# 5   | templateType    | TEXT    | 1       | 'basic'    | 0
# 6   | templateHtml    | TEXT    | 0       |            | 0
# 7   | inputData       | TEXT    | 0       |            | 0
# 8   | ogTitle         | TEXT    | 0       |            | 0
# 9   | ogDescription   | TEXT    | 0       |            | 0
# 10  | thumbnail       | TEXT    | 0       |            | 0
# 11  | folderId        | TEXT    | 0       |            | 0
# 12  | showQrCode      | INTEGER | 0       | 1          | 0
# 13  | qrCodePosition  | TEXT    | 0       | 'bottom'   | 0
# 14  | qrCodeUrl       | TEXT    | 0       |            | 0
# 15  | pixelScripts    | TEXT    | 0       |            | 0
# 16  | studentId       | TEXT    | 0       |            | 0
# 17  | viewCount       | INTEGER | 0       | 0          | 0
# 18  | isActive        | INTEGER | 0       | 1          | 0
# 19  | createdById     | TEXT    | 1       |            | 0
# 20  | createdAt       | TEXT    | 1       |            | 0
# 21  | updatedAt       | TEXT    | 1       |            | 0
```

---

## 🧪 로컬 개발 환경 설정 (선택사항)

로컬에서 테스트하려면:

```bash
# 로컬 D1 데이터베이스 생성 및 스키마 적용
npx wrangler d1 execute DB --local --file=./cloudflare-worker/schema.sql

# 로컬 개발 서버 실행
npm run dev

# 로컬에서 랜딩페이지 생성 테스트
# http://localhost:3000/dashboard/admin/landing-pages/builder
```

---

## 🔍 문제 진단

### 현재 상태 확인

```bash
# 1. D1 데이터베이스 존재 확인
npx wrangler d1 list

# 2. 테이블 목록 확인
npx wrangler d1 execute DB --command="SELECT name FROM sqlite_master WHERE type='table';"

# 3. LandingPage 테이블 데이터 확인 (비어있어야 정상)
npx wrangler d1 execute DB --command="SELECT COUNT(*) as count FROM LandingPage;"
```

### 스키마 재적용 (테이블이 없는 경우)

```bash
# 기존 테이블 삭제 (필요 시)
npx wrangler d1 execute DB --command="DROP TABLE IF EXISTS LandingPagePixelScript;"
npx wrangler d1 execute DB --command="DROP TABLE IF EXISTS LandingPageSubmission;"
npx wrangler d1 execute DB --command="DROP TABLE IF EXISTS LandingPage;"
npx wrangler d1 execute DB --command="DROP TABLE IF EXISTS LandingPageFolder;"

# 스키마 재적용
npx wrangler d1 execute DB --file=./cloudflare-worker/schema.sql
```

---

## 🚀 최종 검증

### 1. 스키마 적용 후 Cloudflare Pages 재배포

스키마를 적용한 후, Cloudflare Pages를 재배포해야 합니다:

```bash
# 빈 커밋으로 재배포 트리거
git commit --allow-empty -m "chore: Cloudflare Pages 재배포"
git push origin genspark_ai_developer
```

### 2. 배포 완료 후 테스트

1. **관리자 로그인**
   - https://superplace-study.pages.dev/login

2. **랜딩페이지 빌더 접속**
   - https://superplace-study.pages.dev/dashboard/admin/landing-pages/builder

3. **테스트 랜딩페이지 생성**
   - 제목: "테스트 랜딩페이지"
   - 폼 필드 추가: 이름, 이메일
   - 저장 버튼 클릭

4. **성공 시 확인 사항**
   - 생성된 URL 알림창 표시
   - 목록 페이지로 리다이렉트
   - 새 랜딩페이지가 목록에 표시됨

5. **퍼블릭 랜딩페이지 접속**
   - https://superplace-study.pages.dev/lp/[생성된-slug]

---

## ⚠️ 주의사항

### 1. wrangler.toml 바인딩 필수

`wrangler.toml` 파일에 D1 바인딩이 없으면 API가 작동하지 않습니다:

```toml
[[d1_databases]]
binding = "DB"
database_name = "superplace-db"
database_id = "actual-uuid-here"
```

### 2. 환경 변수 vs D1 바인딩

- **환경 변수 (`DATABASE_URL`)**: Next.js API Routes에서 사용 (현재 사용 안 함)
- **D1 바인딩 (`DB`)**: Cloudflare Pages Functions에서 사용 (현재 사용 중)

### 3. 로컬 vs 프로덕션

- **로컬**: `--local` 플래그 사용 (로컬 SQLite 파일)
- **프로덕션**: 플래그 없음 (Cloudflare D1 클라우드)

---

## 📞 추가 지원

### Cloudflare Dashboard에서 확인

1. Cloudflare Dashboard 접속
2. Workers & Pages → D1 메뉴
3. `superplace-db` 선택
4. Console 탭에서 직접 SQL 쿼리 실행 가능

### 예시 쿼리

```sql
-- 모든 랜딩페이지 조회
SELECT * FROM LandingPage;

-- 폴더 목록 조회
SELECT * FROM LandingPageFolder;

-- 신청자 수 조회
SELECT COUNT(*) FROM LandingPageSubmission;

-- 특정 랜딩페이지의 신청자 조회
SELECT * FROM LandingPageSubmission WHERE slug = 'lp_1234567890_abc123';
```

---

## ✅ 체크리스트

스키마 적용 전:
- [ ] `wrangler` 설치 및 로그인 완료
- [ ] `wrangler d1 list`로 데이터베이스 확인
- [ ] `wrangler.toml`에 올바른 `database_id` 설정

스키마 적용:
- [ ] `npx wrangler d1 execute DB --file=./cloudflare-worker/schema.sql` 실행
- [ ] 테이블 생성 확인 (`SELECT name FROM sqlite_master...`)
- [ ] `LandingPage`, `LandingPageFolder`, `LandingPageSubmission`, `LandingPagePixelScript` 테이블 존재 확인

배포 및 테스트:
- [ ] Cloudflare Pages 재배포
- [ ] 관리자 로그인
- [ ] 랜딩페이지 생성 테스트
- [ ] 퍼블릭 페이지 접속 테스트
- [ ] 폼 제출 테스트
- [ ] CSV 다운로드 테스트

---

## 🎉 완료!

모든 단계를 완료하면 **"생성 중 오류가 발생했습니다"** 문제가 해결됩니다!

**다음 단계:**
- [LANDING_PAGE_GUIDE.md](./LANDING_PAGE_GUIDE.md) - 전체 기능 사용 가이드
