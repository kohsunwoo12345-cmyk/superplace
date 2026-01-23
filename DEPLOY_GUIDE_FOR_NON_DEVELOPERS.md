# 🚀 비개발자를 위한 배포 가이드

## 📌 시작하기 전에 확인할 것

### ✅ 필요한 계정
- [ ] Cloudflare 계정 (https://dash.cloudflare.com)
- [ ] Vercel 계정 (https://vercel.com)

### ✅ 필요한 정보
- [ ] Cloudflare D1 Database ID
- [ ] Vercel 프로젝트 도메인 (예: superplace-study.vercel.app)

---

## 🎯 목표

여러 웹사이트가 하나의 데이터베이스를 공유하도록 만들기

```
웹사이트 A → ↘
웹사이트 B → → [Cloudflare Worker] → [D1 Database]
웹사이트 C → ↗
```

---

## 📋 STEP 1: Cloudflare D1 Database ID 확인하기

### 1-1. Cloudflare 대시보드 접속
- 브라우저에서 https://dash.cloudflare.com 접속
- 로그인

### 1-2. D1 Database 메뉴로 이동
1. 왼쪽 사이드바에서 **"Workers & Pages"** 클릭
2. 상단 탭에서 **"D1 SQL Database"** 클릭

### 1-3. Database 선택 및 ID 복사
1. 만들어진 데이터베이스 이름 클릭 (예: `superplace-db`)
2. **Database ID** 찾기 (긴 영문자+숫자 조합)
3. 📋 복사 버튼 클릭하여 Database ID 복사

**복사한 Database ID를 여기에 적어두세요:**
```
Database ID: ___________________________________________
```

---

## 🔧 STEP 2: 설정 파일 수정하기

### 2-1. wrangler.toml 파일 열기
- 경로: `cloudflare-worker/wrangler.toml`
- 텍스트 에디터로 열기

### 2-2. Database ID 입력
10번째 줄을 찾아서:

**변경 전:**
```toml
database_id = "YOUR_D1_DATABASE_ID"
```

**변경 후:**
```toml
database_id = "복사한_Database_ID_여기에_붙여넣기"
```

### 2-3. 보안 토큰 확인
14번째 줄에 이미 생성된 토큰이 있는지 확인:

```toml
API_SECRET_TOKEN = "92629e6aa16f35aaae63ace77625575860327f664844c4d60871cc8897cce1f3"
```

**❗ 이 토큰을 복사해서 안전한 곳에 저장하세요! 나중에 Vercel 설정에서 사용합니다.**

### 2-4. Vercel 도메인 확인
15번째 줄에서 Vercel 도메인 확인:

```toml
ALLOWED_ORIGINS = "https://superplace-study.vercel.app,http://localhost:3000"
```

도메인이 다르면 수정하세요.

### 2-5. 저장
파일을 저장합니다.

---

## 📤 STEP 3: Cloudflare Worker 배포하기

### 방법 A: Cloudflare 대시보드에서 배포 (추천 - 쉬움)

1. **Workers & Pages 메뉴로 이동**
   - Cloudflare 대시보드 왼쪽 사이드바
   - **"Workers & Pages"** 클릭

2. **Create Application 클릭**
   - **"Create Worker"** 선택

3. **Worker 이름 입력**
   - 이름: `superplace-db-worker`
   - **Deploy** 클릭

4. **코드 업로드**
   - 배포된 Worker 클릭
   - 상단 **"Quick Edit"** 버튼 클릭
   - 왼쪽 파일 목록에서 `worker.js` 선택
   - 아래 제공된 코드 전체 복사 → 붙여넣기
   - **"Save and Deploy"** 클릭

5. **Settings 설정**
   - 상단 **"Settings"** 탭 클릭
   - **"Variables"** 섹션으로 스크롤
   - **"Add variable"** 클릭
   - 다음 변수들 추가:

   | Name | Value |
   |------|-------|
   | API_SECRET_TOKEN | `92629e6aa16f35aaae63ace77625575860327f664844c4d60871cc8897cce1f3` |
   | ALLOWED_ORIGINS | `https://superplace-study.vercel.app,http://localhost:3000` |

6. **D1 Binding 연결**
   - 같은 Settings 페이지에서
   - **"Bindings"** 섹션으로 스크롤
   - **"Add binding"** 클릭
   - Type: **"D1 Database"** 선택
   - Variable name: `DB`
   - D1 Database: 만든 데이터베이스 선택
   - **Save** 클릭

7. **Worker URL 복사**
   - 상단에 표시된 URL 복사
   - 예: `https://superplace-db-worker.your-account.workers.dev`

**복사한 Worker URL을 여기에 적어두세요:**
```
Worker URL: ___________________________________________
```

### 방법 B: 명령어로 배포 (개발자용)

터미널에서 실행:

```bash
cd cloudflare-worker
npm install
wrangler login
wrangler deploy
```

---

## ⚙️ STEP 4: Vercel 환경 변수 설정하기

### 4-1. Vercel 대시보드 접속
- https://vercel.com 접속
- 로그인
- 프로젝트 선택 (예: `superplace-study`)

### 4-2. Settings 메뉴로 이동
- 상단 탭에서 **"Settings"** 클릭
- 왼쪽에서 **"Environment Variables"** 클릭

### 4-3. 환경 변수 추가

**추가할 변수 2개:**

#### 변수 1: CLOUDFLARE_WORKER_URL
- **Key**: `CLOUDFLARE_WORKER_URL`
- **Value**: STEP 3에서 복사한 Worker URL
  ```
  https://superplace-db-worker.your-account.workers.dev
  ```
- **Environments**: Production, Preview, Development 모두 체크
- **Add** 클릭

#### 변수 2: CLOUDFLARE_WORKER_TOKEN
- **Key**: `CLOUDFLARE_WORKER_TOKEN`
- **Value**: STEP 2에서 복사한 보안 토큰
  ```
  92629e6aa16f35aaae63ace77625575860327f664844c4d60871cc8897cce1f3
  ```
- **Environments**: Production, Preview, Development 모두 체크
- **Add** 클릭

### 4-4. 재배포 트리거
- 환경 변수를 추가하면 자동으로 재배포 시작
- 또는 **"Deployments"** 탭에서 수동으로 재배포

---

## ✅ STEP 5: 작동 확인하기

### 5-1. Worker 상태 확인

브라우저에서 다음 URL 접속:
```
https://superplace-db-worker.your-account.workers.dev/health
```

**예상 응답:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2026-01-23T..."
  }
}
```

❌ 만약 에러가 나면:
- Database ID가 올바르게 입력되었는지 확인
- D1 Binding이 제대로 연결되었는지 확인

### 5-2. 웹사이트에서 확인

1. Vercel 재배포 완료 대기 (약 2-3분)
2. 웹사이트 접속: https://superplace-study.vercel.app
3. 관리자 로그인
4. 학생 추가 테스트

---

## 🎉 완료!

이제 다음 기능들이 작동합니다:

✅ **실시간 데이터 동기화**
- 웹사이트 A에서 학생 추가 → 웹사이트 B에서 즉시 표시

✅ **빠른 성능**
- D1 REST API보다 10배 빠른 속도

✅ **보안**
- 허가된 웹사이트만 접근 가능

---

## 🆘 문제 해결

### Q1. Worker 배포 시 "Database not found" 에러
**A:** Database ID가 잘못 입력되었습니다.
- Cloudflare 대시보드에서 Database ID 다시 확인
- wrangler.toml 파일에서 database_id 수정
- 다시 배포

### Q2. Vercel에서 "CLOUDFLARE_WORKER_URL is not set" 에러
**A:** 환경 변수가 제대로 설정되지 않았습니다.
- Vercel Settings → Environment Variables 확인
- CLOUDFLARE_WORKER_URL 변수 추가
- 재배포

### Q3. "Unauthorized: Invalid or missing API token" 에러
**A:** 보안 토큰이 일치하지 않습니다.
- wrangler.toml의 API_SECRET_TOKEN 확인
- Vercel의 CLOUDFLARE_WORKER_TOKEN 확인
- 두 값이 동일한지 확인

### Q4. CORS 에러
**A:** 도메인이 허용 목록에 없습니다.
- wrangler.toml의 ALLOWED_ORIGINS에 도메인 추가
- 다시 배포

---

## 📞 추가 도움이 필요하면

1. Cloudflare 대시보드의 Worker 로그 확인
2. Vercel 대시보드의 배포 로그 확인
3. 브라우저 개발자 도구(F12) → Console 탭에서 에러 확인

---

**작성일**: 2026-01-23
**버전**: 1.0
