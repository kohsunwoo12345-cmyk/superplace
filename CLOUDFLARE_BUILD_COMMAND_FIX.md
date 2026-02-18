# 🔴 Cloudflare Pages 빌드 커맨드 수정 필요!

## 문제 원인

빌드 로그에서 확인:
```
Executing user command: npm run build
> next build

...빌드 성공...

Error: Output directory ".vercel/output/static" not found.
Failed: build output directory not found
```

**원인**: 
- Cloudflare가 `npm run build` 실행 → `next build` 실행 → `.next` 디렉토리만 생성됨
- 필요한 것: `npm run pages:build` → `@cloudflare/next-on-pages` 실행 → `.vercel/output/static` 생성

---

## ✅ 해결 방법

### Cloudflare Pages 대시보드 설정 변경

**1. Cloudflare 대시보드 접속**
https://dash.cloudflare.com/

**2. 프로젝트 설정 이동**
Workers & Pages → `superplacestudy` 선택 → **Settings** 탭 → **Builds & deployments**

**3. Build configuration 수정**

현재 설정을 다음과 같이 **반드시** 변경하세요:

```
Framework preset: None (또는 비워두기)
                  ⚠️ "Next.js"를 선택하면 안 됩니다!

Build command: npm run pages:build
               ⚠️ "npm run build"가 아닙니다!

Build output directory: .vercel/output/static

Root directory: (비워두기)

Node version: 20.x (또는 자동)
```

**4. 저장 후 재배포**
- **Save** 버튼 클릭
- **Deployments** 탭으로 이동
- **Retry deployment** 클릭

---

## 📋 중요 포인트

### ❌ 잘못된 설정 (현재 상태)
```
Framework preset: Next.js
Build command: npm run build
```
→ `next build`가 실행되어 `.next` 디렉토리만 생성됨

### ✅ 올바른 설정 (변경 필요)
```
Framework preset: None
Build command: npm run pages:build
```
→ `@cloudflare/next-on-pages`가 실행되어 `.vercel/output/static` 생성됨

---

## 🔍 빌드 스크립트 확인

`package.json`에 정의된 스크립트:

```json
{
  "scripts": {
    "build": "next build",                           ❌ 일반 Next.js 빌드
    "pages:build": "npx @cloudflare/next-on-pages"  ✅ Cloudflare Pages 빌드
  }
}
```

---

## 🎯 예상 빌드 결과

올바른 설정 후 빌드 로그:

```
Executing user command: npm run pages:build

⚡️ @cloudflare/next-on-pages CLI v.1.13.16
⚡️ Building project...
⚡️ Build Summary
⚡️ 
⚡️ Edge Function Routes (14)
⚡️   ├ /api/admin/landing-pages
⚡️   ├ /api/admin/sms/*
⚡️   └ /api/landing/*
⚡️ 
⚡️ Prerendered Routes (128)
⚡️ 
✅ Build completed successfully

Validating asset output directory
✅ Output directory ".vercel/output/static" found
✅ Deployment successful
```

---

## 📸 스크린샷 가이드

Cloudflare Pages 대시보드에서 다음 화면을 찾으세요:

```
Settings
  └─ Builds & deployments
       └─ Build configuration
            ├─ Framework preset: [None 선택] ⚠️
            ├─ Build command: npm run pages:build ⚠️
            ├─ Build output directory: .vercel/output/static
            └─ Root directory: (비워두기)
```

---

## ⚠️ 주의사항

1. **Framework preset을 "None"으로 설정**: "Next.js"를 선택하면 자동으로 `npm run build`를 실행합니다
2. **Build command를 정확히 입력**: `npm run pages:build` (띄어쓰기 주의)
3. **설정 저장 후 재배포**: 설정만 변경하고 재배포하지 않으면 이전 설정으로 빌드됩니다

---

## 🚀 재배포 순서

1. ✅ Settings → Builds & deployments 이동
2. ✅ Framework preset → **None** 선택
3. ✅ Build command → `npm run pages:build` 입력
4. ✅ Build output directory → `.vercel/output/static` 입력
5. ✅ **Save** 버튼 클릭
6. ✅ Deployments 탭으로 이동
7. ✅ **Retry deployment** 클릭
8. ⏳ 빌드 완료 대기 (약 1-2분)
9. ✅ https://superplacestudy.pages.dev 접속 확인

---

## 💡 빠른 확인 방법

빌드 로그에서 다음 라인을 찾으세요:

### ❌ 잘못된 경우
```
Executing user command: npm run build
> next build
```

### ✅ 올바른 경우
```
Executing user command: npm run pages:build
⚡️ @cloudflare/next-on-pages CLI v.1.13.16
```

---

**이 설정을 변경하면 배포가 성공합니다!** 🎉

Framework preset을 **"None"**으로 설정하는 것이 가장 중요합니다.
