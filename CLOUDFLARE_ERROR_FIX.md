# 🚨 중요: Cloudflare 배포 오류 해결 가이드

## ❌ 발생한 오류

Cloudflare Pages가 Next.js 앱 전체를 배포하려다가 실패했습니다.

**오류 원인:**
- Cloudflare Pages는 Edge Runtime만 지원
- 현재 프로젝트의 86개 API 라우트가 Edge Runtime으로 설정되지 않음
- Vercel용으로 설정된 프로젝트를 Cloudflare Pages에 배포하려고 시도

---

## ✅ 올바른 배포 구조

```
┌──────────────────────────────────────────────────┐
│            프로젝트 구조도                        │
├──────────────────────────────────────────────────┤
│                                                  │
│  📦 Next.js 앱                                   │
│  └─ 호스팅: Vercel                               │
│     └─ URL: https://superplace-study.vercel.app │
│                                                  │
│  ⚡ Cloudflare Worker (별도 프로젝트)            │
│  └─ 위치: cloudflare-worker/                    │
│     └─ 역할: D1 Database 프록시                  │
│     └─ URL: https://superplace-db-worker...     │
│                                                  │
└──────────────────────────────────────────────────┘
```

**중요:** 
- Next.js 앱은 Vercel에 배포 (이미 완료)
- Cloudflare Worker는 별도로 배포 (아직 안 함)

---

## 🎯 해결 방법: Cloudflare Worker만 배포

### 1. Cloudflare Pages 연결 해제 (선택사항)

만약 Cloudflare Pages에 프로젝트가 연결되어 있다면:

1. https://dash.cloudflare.com 접속
2. **Workers & Pages** 클릭
3. 프로젝트 찾기 (예: `superplace`)
4. **Settings** → **Delete Project**

### 2. Cloudflare Worker 배포 (필수)

**올바른 배포 명령어:**

```bash
# ⚠️ 중요: cloudflare-worker 디렉토리에서 실행!
cd cloudflare-worker

# 패키지 설치
npm install

# Cloudflare 로그인
wrangler login

# Worker 배포 (Pages가 아님!)
wrangler deploy
```

**예상 출력:**
```
✨ Success! Deployed to:
   https://superplace-db-worker.YOUR-ACCOUNT.workers.dev
```

---

## 🔍 현재 상태 확인

### Vercel 배포 상태
- ✅ Next.js 앱이 Vercel에 배포됨
- ✅ URL: https://superplace-study.vercel.app
- ✅ 정상 작동 중

### Cloudflare Worker 배포 상태
- ⏳ 아직 배포되지 않음
- ⏳ D1 Database와 연결 대기 중

---

## 📋 다음 단계

### 1. Worker 배포하기

```bash
cd cloudflare-worker
npm install
wrangler login
wrangler deploy
```

### 2. Vercel 환경 변수 설정

Worker 배포 후 나온 URL을 Vercel에 추가:

```
CLOUDFLARE_WORKER_URL=https://superplace-db-worker.YOUR-ACCOUNT.workers.dev
CLOUDFLARE_WORKER_TOKEN=92629e6aa16f35aaae63ace77625575860327f664844c4d60871cc8897cce1f3
```

### 3. 웹사이트 테스트

Vercel 재배포 후 웹사이트에서 기능 테스트

---

## 🆘 자주 묻는 질문

### Q1. Cloudflare Pages와 Worker의 차이는?

**Cloudflare Pages:**
- 정적 웹사이트 호스팅
- Edge Runtime만 지원
- Next.js 앱 전체를 배포하려면 모든 라우트가 Edge Runtime이어야 함

**Cloudflare Worker:**
- 서버리스 함수 실행
- D1 Database와 직접 연결 가능
- 단순한 API 프록시 역할

### Q2. 왜 Next.js를 Cloudflare에 배포하지 않나요?

- 현재 프로젝트는 Vercel용으로 최적화됨
- 86개의 API 라우트를 모두 Edge Runtime으로 변경하려면 큰 작업 필요
- Vercel이 Next.js에 가장 최적화된 플랫폼

### Q3. D1 Database는 어떻게 사용하나요?

```
Next.js (Vercel)
    ↓ HTTP 요청
Cloudflare Worker (D1 프록시)
    ↓ D1 Binding (초고속)
D1 Database
```

---

## ✅ 요약

1. **Cloudflare Pages 오류는 무시하세요** (잘못된 배포 시도)
2. **Cloudflare Worker만 배포하세요** (올바른 방법)
3. **Next.js 앱은 Vercel에 유지** (현재 정상 작동 중)

---

**다음 명령어만 실행하세요:**

```bash
cd cloudflare-worker
npm install
wrangler login
wrangler deploy
```

그러면 모든 것이 정상적으로 작동합니다! 🚀
