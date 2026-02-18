# 🚨 긴급: Cloudflare Pages 빌드 설정 확인 필요

**날짜**: 2026-02-18 23:48 (KST)  
**커밋**: bc12402  
**상태**: 🔴 Cloudflare Dashboard 설정 확인 필요

---

## 🔍 발견한 문제

### 증상
- ✅ **프리뷰 (d8533809)**: `/api/auth/login` → 401 (Functions 정상 작동)
- ❌ **프로덕션**: `/api/auth/login` → 404 (Functions 없음)

### 원인
프로덕션 빌드 시 **`functions/` 디렉토리가 배포 결과물에 포함되지 않음**

---

## ✅ 적용한 해결책

### 1️⃣ package.json 빌드 스크립트 수정

**변경 전**:
```json
"pages:build": "npx @cloudflare/next-on-pages && rm -rf out && cp -r .vercel/output/static out"
```

**변경 후**:
```json
"pages:build": "npx @cloudflare/next-on-pages && rm -rf out && cp -r .vercel/output/static out && cp -r functions out/functions"
```

### 2️⃣ 로컬 빌드 검증 완료
```bash
✅ npm run pages:build 성공
✅ out/functions/api/auth/login.ts 존재 확인
✅ out/functions/api/auth/signup.ts 존재 확인
```

---

## 🚨 중요: Cloudflare Pages 빌드 명령 확인 필요

Cloudflare Pages는 GitHub에서 자동 배포 시 **기본 빌드 명령**을 사용합니다.
반드시 아래 설정을 확인해주세요.

### ✅ Cloudflare Dashboard 설정 확인

1. **https://dash.cloudflare.com/** 접속
2. **Workers & Pages** → **superplacestudy** 선택
3. **Settings** → **Builds & deployments** 클릭
4. **Build configurations** 확인:

#### 📋 필수 설정 값

| 설정 항목 | 현재 값 (확인 필요) | **올바른 값** |
|-----------|---------------------|---------------|
| **Build command** | `npm run build` ❌ | **`npm run pages:build`** ✅ |
| **Build output directory** | `.vercel/output/static` ❌ | **`out`** ✅ |
| **Root directory** | `/` | `/` ✅ |

---

## 🔧 수정 방법

### Option A: Cloudflare Dashboard에서 수정 (권장)

1. Cloudflare Dashboard → **superplacestudy**
2. **Settings** → **Builds & deployments**
3. **Edit configuration** 클릭
4. 다음과 같이 변경:
   ```
   Build command: npm run pages:build
   Build output directory: out
   ```
5. **Save** 클릭
6. **Deployments** → **Retry deployment** 실행

### Option B: GitHub에서 재배포 트리거

**수정 후 자동 재배포**:
```bash
# 이미 커밋 완료: bc12402
# Cloudflare가 자동으로 빌드 시작
# 단, 빌드 명령이 올바른지 확인 필요
```

---

## 🧪 배포 후 검증 방법

### 1️⃣ 자동 검증 스크립트 실행
```bash
cd /home/user/webapp
node test_preview_vs_production.js
```

**성공 시 출력**:
```
✅ 프리뷰와 프로덕션이 100% 동일합니다!

🎯 Result: 5/5 endpoints match
   ✅ /api/auth/login
   ✅ /api/auth/signup
   ✅ /api/login
   ✅ /
   ✅ /login
```

### 2️⃣ 명령줄 테스트
```bash
# 프로덕션 API 상태 확인
curl -X POST https://superplacestudy.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# 기대 결과
HTTP/2 401   # ✅ Functions 작동 (인증 실패는 정상)
{"success":false,"message":"이메일 또는 비밀번호가 올바르지 않습니다"}
```

### 3️⃣ 브라우저 테스트
1. **시크릿 모드** 열기
2. https://superplacestudy.pages.dev/login/ 접속
3. 테스트 계정 로그인:
   - `admin@superplace.com` / `admin1234`
   - `director@superplace.com` / `director1234`
4. ✅ **로그인 성공** 확인

---

## 📊 현재 상태 요약

| 구분 | 상태 | 비고 |
|------|------|------|
| 로컬 빌드 | ✅ 완료 | functions 포함 확인 |
| Git 커밋 | ✅ 푸시 완료 | bc12402 |
| package.json | ✅ 수정 완료 | functions 복사 추가 |
| Cloudflare 빌드 명령 | 🔴 **확인 필요** | **`npm run pages:build`로 변경 필요** |
| 프로덕션 배포 | 🟡 대기 중 | Cloudflare 설정 확인 후 재배포 |

---

## ⚠️ 빌드 명령이 잘못되어 있으면?

만약 Cloudflare가 여전히 `npm run build`를 사용 중이라면:

### 증상
- 배포는 성공하지만 `/api/auth/*` 엔드포인트가 여전히 404 반환
- `out/functions/` 폴더가 배포 결과물에 없음

### 해결책
1. Cloudflare Dashboard에서 **빌드 명령을 `npm run pages:build`로 변경**
2. 또는 `build` 스크립트 자체를 수정:
   ```json
   "build": "next build && npx @cloudflare/next-on-pages && rm -rf out && cp -r .vercel/output/static out && cp -r functions out/functions"
   ```

---

## 🎯 최종 목표

### 프리뷰와 프로덕션 100% 동일

| 엔드포인트 | 프리뷰 | 프로덕션 (목표) |
|-----------|--------|-----------------|
| `/api/auth/login` | 401 ✅ | 401 ✅ |
| `/api/auth/signup` | 400 ✅ | 400 ✅ |
| `/` | 200 ✅ | 200 ✅ |
| `/login` | 308/200 ✅ | 308/200 ✅ |

### 로그인 기능 완전 복구
- ✅ D1 데이터베이스 연결
- ✅ Cloudflare Pages Functions 배포
- ✅ 테스트 계정 생성 완료
- ✅ SMS 메뉴 추가 (학원장)
- 🎯 **100+ 기존 사용자 로그인 가능**

---

## 📞 다음 단계

### 즉시 확인 (5분 내)
1. ✅ Cloudflare Dashboard 접속
2. ✅ **Settings** → **Builds & deployments** 확인
3. ✅ Build command가 **`npm run pages:build`**인지 확인
4. ❌ 만약 `npm run build`라면:
   - **Edit configuration** 클릭
   - **Build command**: `npm run pages:build` 입력
   - **Build output directory**: `out` 입력
   - **Save** 클릭
5. ✅ **Deployments** → **Retry deployment** 실행

### 배포 대기 (2-5분)
- 🟡 Cloudflare Pages 빌드 진행
- 🟡 Functions 포함된 배포 결과물 생성
- ✅ 글로벌 CDN 배포

### 배포 완료 후 검증 (1분)
```bash
cd /home/user/webapp
node test_preview_vs_production.js
# ✅ 5/5 endpoints match 확인
```

---

**현재 시각**: 2026-02-18 23:48 (KST)  
**중요도**: 🔴 **긴급 - Cloudflare 설정 즉시 확인 필요**  
**예상 완료**: 설정 확인 후 5-10분

---

## 📋 체크리스트

- [x] 로컬 빌드 스크립트 수정
- [x] Git 커밋 & 푸시
- [ ] **Cloudflare 빌드 명령 확인**
- [ ] Cloudflare 재배포
- [ ] 검증 스크립트 실행
- [ ] 프리뷰 vs 프로덕션 100% 일치 확인
- [ ] 브라우저 로그인 테스트
- [ ] 기존 사용자 로그인 확인
