# 🚨 Cloudflare Pages 빌드 실패 수정

## 문제 진단

### 빌드 로그 분석
```
Executing user deploy command: npx wrangler deploy
✘ [ERROR] Could not detect a directory containing static files
```

**문제:** 
- Cloudflare Pages가 `npx wrangler deploy` 명령을 실행하려 시도
- 이것은 Worker 배포 명령이지 Pages 배포 명령이 아님
- Next.js 빌드가 실행되지 않음

---

## 해결 방법

### Cloudflare Dashboard에서 설정 수정

1. **Cloudflare Dashboard 접속**
   - https://dash.cloudflare.com/

2. **Pages 프로젝트 설정**
   - Pages → `superplace` (또는 프로젝트 이름)
   - Settings → Builds & deployments

3. **빌드 설정 수정**

**현재 설정 (잘못됨):**
```
Build command: npx wrangler deploy
Build output directory: (자동)
```

**올바른 설정:**
```
Build command: npm run build
Build output directory: out
```

### 또는 (Next.js + Cloudflare Pages 최적화)

**최적 설정:**
```
Framework preset: Next.js
Build command: npx @cloudflare/next-on-pages
Build output directory: .vercel/output/static
```

---

## package.json 스크립트 확인

현재 `package.json`에 있는 빌드 스크립트:
```json
{
  "scripts": {
    "build": "next build",
    "pages:build": "npx @cloudflare/next-on-pages",
    "deploy": "npm run pages:build && wrangler pages deploy .vercel/output/static --project-name=superplacestudy"
  }
}
```

**권장 사항:**
- Cloudflare Pages 자동 배포 사용 시: `pages:build` 사용
- 수동 배포 시: `deploy` 스크립트 사용

---

## 즉시 수정 단계

### 옵션 1: Cloudflare Dashboard에서 수정 (권장)

1. Cloudflare Dashboard → Pages → superplace
2. Settings → Builds & deployments
3. **Build command** 수정:
   ```
   npx @cloudflare/next-on-pages
   ```
4. **Build output directory** 수정:
   ```
   .vercel/output/static
   ```
5. Save 후 **Retry deployment**

### 옵션 2: 환경 변수로 우회

Cloudflare Pages Settings → Environment variables에 추가:
```
CLOUDFLARE_PAGES = 1
```

그리고 `package.json` 수정:
```json
{
  "scripts": {
    "build": "npx @cloudflare/next-on-pages"
  }
}
```

---

## Worker는?

**Worker는 이미 배포 완료!**
- Worker 이름: `physonsuperplacestudy`
- Worker URL: https://physonsuperplacestudy.kohsunwoo12345.workers.dev
- 상태: ✅ 정상 작동

**Worker는 별도 프로젝트이므로:**
- Pages 배포와 무관
- `/home/user/webapp/python-worker/` 디렉토리에서 별도 관리
- 필요 시 `cd python-worker && npm run deploy-worker` 실행

---

## 최종 확인 사항

### Pages 빌드 성공 시 확인할 것:
1. ✅ Next.js 빌드 완료
2. ✅ Pages Functions 배포 (`/functions/api/*`)
3. ✅ 환경 변수 바인딩 (DB, VECTORIZE, AI)
4. ✅ 프론트엔드 접속 가능

### Worker 확인:
1. ✅ https://physonsuperplacestudy.kohsunwoo12345.workers.dev/ 접속
2. ✅ RAG 엔드포인트 작동 확인

---

**작성 일시:** 2026-03-18 11:20 UTC
**상태:** Pages 빌드 설정 수정 필요
**Worker:** ✅ 정상 작동 중
