# 🚨 프로덕션 308 리다이렉트 문제 해결 - Trailing Slash

## 🔍 문제 진단 완료

### 실제 문제

**프로덕션에서 모든 API가 trailing slash로 리다이렉트됨**

```
프리뷰 (정상):
  /api/auth/login → 200 OK ✅

프로덕션 (문제):
  /api/auth/login → 308 Permanent Redirect → /api/auth/login/ ❌
```

### 원인
Cloudflare Pages의 **URL 정규화 설정**이 프로덕션과 프리뷰에서 다르게 적용됨

---

## ✅ 해결 방법

### 방법 1: Cloudflare Pages 설정 변경 (권장)

#### 1단계: Cloudflare Dashboard 접속
```
https://dash.cloudflare.com/
→ Workers & Pages
→ superplacestudy
```

#### 2단계: 설정 변경
```
Settings → Functions
→ 또는 Settings → Builds & deployments
```

다음 설정 찾기:
- **Trailing slashes**: Auto → None 또는 Remove
- **URL normalization**: 비활성화

#### 3단계: 재배포
설정 변경 후 자동으로 재배포되거나, 수동으로 재배포:
```
Deployments → [최신 배포] → Retry deployment
```

---

### 방법 2: _redirects 파일 추가

프로젝트 루트에 `public/_redirects` 파일 생성:

```
# Cloudflare Pages _redirects
# API 경로는 리다이렉트하지 않음
/api/* 200
/api/auth/* 200
```

---

### 방법 3: _headers 파일 수정

프로젝트 루트에 `public/_headers` 파일 추가/수정:

```
/api/*
  X-Robots-Tag: noindex

/api/auth/*
  X-Robots-Tag: noindex
```

---

### 방법 4: wrangler.toml 설정 (현재 사용 중)

`wrangler.toml` 파일 수정:

```toml
[build]
command = "npm run build"

[build.upload]
format = "service-worker"

[[redirects]]
from = "/api/*"
to = "/api/:splat"
status = 200
force = true

[[redirects]]
from = "/api/auth/*"
to = "/api/auth/:splat"
status = 200
force = true
```

---

### 방법 5: next.config.js 설정

`next.config.js`에 trailing slash 설정 추가:

```javascript
module.exports = {
  trailingSlash: false,  // trailing slash 비활성화
  // 또는
  skipTrailingSlashRedirect: true,
  
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Trailing-Slash-Redirect',
            value: 'false',
          },
        ],
      },
    ];
  },
};
```

---

## 🔧 즉시 실행 (방법 5 - 코드 수정)

가장 안전하고 확실한 방법은 `next.config.js` 수정:

### 1단계: next.config.js 확인
현재 설정을 확인하고 `trailingSlash` 옵션 추가

### 2단계: Git 커밋 및 푸시
```bash
git add next.config.js
git commit -m "fix: disable trailing slash redirects for API routes"
git push origin main
```

### 3단계: 배포 확인
Cloudflare Pages에서 자동 재배포 후 테스트

---

## 🧪 검증 방법

### 1. curl 테스트
```bash
# 프로덕션 테스트
curl -I -X POST https://superplacestudy.pages.dev/api/auth/login

# 예상 결과: 200 OK (308 아님!)
```

### 2. 브라우저 개발자 도구
```
F12 → Network 탭
로그인 시도
/api/auth/login 요청 확인
상태 코드: 200 OK (308 아님!)
```

---

## 📊 프리뷰 vs 프로덕션 차이

| 항목 | 프리뷰 (d8533809) | 프로덕션 (superplacestudy) |
|------|-------------------|----------------------------|
| /api/auth/login | 200 OK ✅ | 308 → /api/auth/login/ ❌ |
| /api/auth/signup | 500 (DB 문제) ✅ | 308 → /api/auth/signup/ ❌ |
| /api/login | 405 (다른 API) ✅ | 308 → /api/login/ ❌ |
| 원인 | 올바른 설정 | Trailing slash 리다이렉트 |

---

## 🎯 권장 해결 순서

1. **즉시**: `next.config.js`에 `trailingSlash: false` 추가
2. **Git 커밋 및 푸시**
3. **배포 대기** (2-5분)
4. **테스트**: curl 또는 브라우저로 확인
5. **실패 시**: Cloudflare Dashboard에서 설정 변경

---

## 📝 참고 자료

### Cloudflare Pages 문서
- URL normalization: https://developers.cloudflare.com/pages/
- Redirects: https://developers.cloudflare.com/pages/platform/redirects/

### Next.js 문서
- trailingSlash: https://nextjs.org/docs/api-reference/next.config.js/trailing-slash

---

**작성일**: 2026-02-18  
**문제**: 프로덕션 308 Permanent Redirect (trailing slash)  
**해결**: next.config.js 또는 Cloudflare 설정 수정  
**상태**: 해결 방법 제시 완료
