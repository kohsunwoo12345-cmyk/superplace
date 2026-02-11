# 🚨 API 라우팅 수정 보고서

## 📋 문제 발견

### 증상
- 프로덕션 URL에서 `/api/*` 엔드포인트가 404 에러 반환
- 예: `GET /api/admin/payment-approvals?status=all` → 404 Not Found

### 원인 분석
`public/_routes.json` 설정에서 **API 경로가 잘못 설정**되어 있었습니다:

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": [
    "/_next/*",
    "/favicon.svg",
    "/api/*"  ← 🚨 문제: API가 exclude에 있음!
  ]
}
```

**결과:** API 요청이 Cloudflare Pages Functions로 전달되지 않고, 정적 파일로 처리되어 404 반환

---

## ✅ 해결 방법

### 수정된 `_routes.json`

```json
{
  "version": 1,
  "include": [
    "/api/*"  ← ✅ API는 Functions에서 처리
  ],
  "exclude": [
    "/_next/*",
    "/favicon.svg"
  ]
}
```

### Cloudflare Pages 라우팅 동작

1. **`include: ["/api/*"]`**: `/api/*` 요청은 Functions로 전달
2. **`exclude: ["/_next/*", "/favicon.svg"]`**: 정적 자산은 CDN에서 직접 제공
3. **나머지 모든 경로**: 정적 페이지(`out/` 디렉토리)에서 제공

---

## 📊 배포 정보

- **커밋**: `01b87d8`
- **브랜치**: `main`
- **배포 URL**: https://superplacestudy.pages.dev/
- **배포 시작**: 2026-02-11 13:19:00 UTC
- **예상 소요**: 약 2-3분

---

## 🧪 테스트 계획

배포 완료 후 다음을 확인:

### 1. API 엔드포인트 테스트
```bash
# 결제 승인 API
curl https://superplacestudy.pages.dev/api/admin/payment-approvals?status=all

# 예상 응답: {"success":true,"approvals":[],"stats":{...}}
```

### 2. 정적 페이지 테스트
- 메인 페이지: https://superplacestudy.pages.dev/
- 출석 인증: https://superplacestudy.pages.dev/attendance-verify/
- 숙제 제출: https://superplacestudy.pages.dev/homework-check/

### 3. Functions 디렉토리 구조
```
functions/
└── api/
    ├── admin/
    │   └── payment-approvals.ts
    ├── homework/
    │   ├── submit.ts
    │   └── process-grading.ts
    └── attendance/
        └── verify.ts
```

---

## ✅ 예상 결과

- ✅ `/api/*` 요청이 Cloudflare Pages Functions에서 정상 처리
- ✅ 정적 페이지는 CDN에서 빠르게 제공
- ✅ 숙제 제출 및 채점 기능 정상 동작
- ✅ 결제 승인 API 정상 응답

---

## 📝 핵심 교훈

1. **Cloudflare Pages `_routes.json`**: API 경로는 `include`에, 정적 자산은 `exclude`에 설정
2. **Functions 우선**: `/api/*` 경로는 반드시 Functions로 전달되도록 설정
3. **빌드 스크립트**: `_routes.json`을 `out/` 디렉토리로 복사해야 배포 시 적용됨

---

생성 시간: 2026-02-11 13:19:30 UTC
