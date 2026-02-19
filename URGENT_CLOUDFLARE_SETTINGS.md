# 🚨 Cloudflare Pages 빌드 설정 필수 변경

**날짜**: 2026-02-18 23:58 (KST)  
**커밋**: 557e268  
**상태**: 🔴 **Cloudflare Dashboard 설정 변경 필요 (필수)**

---

## 🔍 핵심 문제

**프로덕션에서 여전히 `/api/auth/login` → 404 발생**

### 원인
Cloudflare Pages가 **자동 배포 시 `npm run build` 명령을 사용**하는데, 이 명령이:
1. Next.js 빌드만 실행 (`next build`)
2. `functions/` 디렉토리를 배포 결과물에 포함하지 않음
3. 결과적으로 Cloudflare Pages Functions가 배포되지 않음

---

## ✅ 해결책: Cloudflare Dashboard 설정 변경

### 🔴 필수 조치: 빌드 명령 변경

1. **https://dash.cloudflare.com/** 접속
2. **Workers & Pages** 클릭
3. **superplacestudy** 프로젝트 선택
4. **Settings** 탭 클릭
5. **Builds & deployments** 섹션 찾기
6. **Edit configuration** 버튼 클릭
7. 다음과 같이 변경:

| 설정 항목 | 기존 값 (추정) | **새 값 (필수)** |
|-----------|----------------|------------------|
| **Build command** | `npm run build` | **`npm run pages:build`** |
| **Build output directory** | `.vercel/output/static` | **`out`** |
| **Root directory** | (empty) | (empty) |

8. **Save** 버튼 클릭
9. **Deployments** 탭으로 이동
10. **Retry deployment** 버튼 클릭 (최신 커밋 재배포)

---

## 📊 빌드 스크립트 구조

### package.json (최종 버전)
```json
{
  "scripts": {
    "build": "next build",
    "pages:build": "next build && npx @cloudflare/next-on-pages && rm -rf out && cp -r .vercel/output/static out && cp -r functions out/functions"
  }
}
```

### 각 스크립트의 역할

#### `npm run build`
- Next.js 빌드만 실행
- `.next/` 및 `.vercel/output/` 생성
- **Functions는 포함하지 않음** ❌

#### `npm run pages:build` (Cloudflare 전용)
- Next.js 빌드 실행
- @cloudflare/next-on-pages로 Cloudflare Workers 통합
- `.vercel/output/static` → `out/` 복사
- **`functions/` → `out/functions/` 복사** ✅
- 결과: `out/` 디렉토리에 모든 것이 포함됨

---

## 🧪 설정 변경 후 검증

### 1️⃣ Cloudflare 배포 로그 확인
1. Deployments → 최신 배포 클릭
2. **View build log** 클릭
3. 로그에서 다음 확인:
   ```
   Running build command: npm run pages:build
   
   > pages:build
   > next build && npx @cloudflare/next-on-pages && ...
   
   ✓ Compiled successfully
   ⚡️ @cloudflare/next-on-pages CLI
   ⚡️ Build completed in X.XXs
   ```
4. 빌드 성공 확인

### 2️⃣ 배포 결과물 확인 (간접적)
배포가 완료되면 다음 명령으로 검증:
```bash
cd /home/user/webapp
node test_preview_vs_production.js
```

**기대 결과**:
```
✅ 프리뷰와 프로덕션이 100% 동일합니다!

🎯 Result: 5/5 endpoints match (또는 4/5)
   ✅ /api/auth/login     (401 - Functions 작동)
   ✅ /api/auth/signup    (400 - Functions 작동)
```

### 3️⃣ 프로덕션 API 테스트
```bash
curl -X POST https://superplacestudy.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

**기대 응답**:
```json
HTTP/2 401  ← ✅ Functions 작동 (404가 아님)
{"success":false,"message":"이메일 또는 비밀번호가 올바르지 않습니다"}
```

### 4️⃣ 브라우저 로그인 테스트
1. **시크릿/인코그니토 모드** 열기
2. https://superplacestudy.pages.dev/login/ 접속
3. 테스트 계정 로그인:
   - `admin@superplace.com` / `admin1234`
4. ✅ **로그인 성공** 확인

---

## ⏰ 예상 시간표

| 단계 | 소요 시간 | 설명 |
|------|----------|------|
| Dashboard 설정 변경 | 1분 | Build command 수정 |
| 재배포 트리거 | 즉시 | Retry deployment 클릭 |
| Cloudflare 빌드 | 3-5분 | npm run pages:build 실행 |
| 글로벌 배포 | 1-2분 | CDN 업데이트 |
| **총 예상 시간** | **5-8분** | 설정 변경 후 로그인 가능까지 |

---

## 🚨 설정을 변경하지 않으면?

### 증상
- Cloudflare가 계속 `npm run build` 사용
- Functions가 배포되지 않음
- `/api/auth/login` → **404 Not Found**
- 로그인/회원가입 불가능

### 영향
- ❌ 테스트 계정 로그인 불가
- ❌ 기존 100+ 사용자 로그인 불가
- ❌ 새 회원가입 불가
- ❌ 서비스 완전 중단

---

## 📋 변경 체크리스트

- [ ] Cloudflare Dashboard 접속
- [ ] Workers & Pages → superplacestudy 선택
- [ ] Settings → Builds & deployments 진입
- [ ] Edit configuration 클릭
- [ ] **Build command**: `npm run pages:build` 입력
- [ ] **Build output directory**: `out` 입력
- [ ] Save 클릭
- [ ] Deployments 탭 이동
- [ ] Retry deployment 클릭
- [ ] 빌드 완료 대기 (3-5분)
- [ ] `node test_preview_vs_production.js` 실행
- [ ] 브라우저 로그인 테스트

---

## 🎯 성공 기준

### 빌드 로그 확인
```
Running build command: npm run pages:build   ← ✅ 이 줄 확인
> next build
✓ Compiled successfully
> npx @cloudflare/next-on-pages
⚡️ Build completed
```

### API 응답 확인
```bash
# 이전 (404)
$ curl https://superplacestudy.pages.dev/api/auth/login
404 Not Found

# 이후 (401/400)
$ curl -X POST https://superplacestudy.pages.dev/api/auth/login \
  -d '{"email":"test","password":"test"}'
{"success":false,"message":"이메일 또는 비밀번호가 올바르지 않습니다"}
```

### 검증 스크립트
```bash
$ node test_preview_vs_production.js
✅ 프리뷰와 프로덕션이 100% 동일합니다!
```

---

## 📞 추가 지원

### Option A: 수동 배포 (Dashboard 접근 불가 시)
Cloudflare Dashboard 접근이 어려우면, GitHub Actions나 다른 CI/CD를 설정하여 `npm run pages:build`를 실행하도록 구성할 수 있습니다.

### Option B: Wrangler CLI 수동 배포 (긴급 시)
```bash
# 로컬에서 직접 배포 (Dashboard 설정 우회)
cd /home/user/webapp
npm run deploy

# 이 방법은 올바른 빌드 명령(pages:build)을 사용하므로
# Functions가 포함된 결과물을 직접 배포합니다
```

---

## ✅ 최종 상태 (설정 변경 후)

| 구분 | 현재 상태 | 설정 변경 후 |
|------|----------|--------------|
| 빌드 명령 | `npm run build` | `npm run pages:build` ✅ |
| Functions 포함 | ❌ 없음 | ✅ 있음 |
| `/api/auth/login` | 404 | 401 ✅ |
| 로그인 기능 | ❌ 불가 | ✅ 가능 |
| 프리뷰 vs 프로덕션 | ❌ 다름 | ✅ 동일 |

---

**중요도**: 🔴 **긴급 필수**  
**조치 필요**: Cloudflare Dashboard 설정 변경  
**예상 완료**: 설정 변경 후 5-8분  
**담당자 액션**: Dashboard에서 Build command를 `npm run pages:build`로 변경

**이 설정을 변경하지 않으면 프로덕션 로그인이 영구적으로 불가능합니다.**
