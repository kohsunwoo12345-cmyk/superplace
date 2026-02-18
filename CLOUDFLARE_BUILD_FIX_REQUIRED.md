# ⚠️ Cloudflare Pages 빌드 설정 수정 필요

## 🔍 현재 상황

현재 Cloudflare Pages에서 로그인이 작동하지 않는 이유:

### 문제
1. **빌드 명령 불일치**: Dashboard에서 `npm run build` 사용 중
2. **출력 디렉터리 불일치**: Dashboard에서 `.next` 사용 중
3. **결과**: Next.js API Routes가 Cloudflare Pages Functions로 변환되지 않음
4. **증상**: 500 Internal Server Error 또는 404 Not Found

### 원인
- Cloudflare Pages는 `@cloudflare/next-on-pages` 빌더가 필요
- 기본 `npm run build`는 Node.js 서버용 빌드만 생성
- API Routes가 Edge Functions로 변환되지 않음

---

## ✅ 해결 방법

### 옵션 1: Cloudflare Pages Dashboard 설정 변경 (권장)

#### 1️⃣ Cloudflare Dashboard 접속
1. https://dash.cloudflare.com/ 로그인
2. **Workers & Pages** 선택
3. **superplacestudy** (또는 superplace-study) 프로젝트 클릭

#### 2️⃣ 빌드 설정 수정
1. **Settings** 탭 클릭
2. **Builds & deployments** 섹션으로 스크롤
3. **Configure Production deployments** 클릭
4. 아래와 같이 수정:

```
빌드 명령 (Build command):
npm run pages:build

빌드 출력 디렉터리 (Build output directory):
.vercel/output/static

루트 디렉터리 (Root directory):
(비워두기 - 기본값 유지)

환경 변수 (Environment variables):
NODE_VERSION = 20
```

#### 3️⃣ 저장 및 재배포
1. **Save** 버튼 클릭
2. **Deployments** 탭으로 이동
3. 가장 최근 배포의 **···** 메뉴 클릭
4. **Retry deployment** 선택

---

### 옵션 2: 임시 해결 (테스트용 하드코딩 계정 사용)

현재 코드에는 이미 하드코딩된 테스트 계정이 포함되어 있습니다:

#### 테스트 계정 정보
```
1. 관리자
   - 이메일: admin@superplace.com
   - 비밀번호: admin1234
   - 역할: SUPER_ADMIN

2. 원장
   - 이메일: director@superplace.com
   - 비밀번호: director1234
   - 역할: DIRECTOR

3. 선생님
   - 이메일: teacher@superplace.com
   - 비밀번호: teacher1234
   - 역할: TEACHER

4. 테스트
   - 이메일: test@test.com
   - 비밀번호: test1234
   - 역할: ADMIN
```

**하지만**: Cloudflare Pages 빌드 설정을 수정하지 않으면, 이 계정들도 작동하지 않습니다.

---

## 🔍 빌드 설정 확인 방법

### package.json의 빌드 스크립트
```json
{
  "scripts": {
    "build": "next build",                    // ❌ Node.js 서버용
    "pages:build": "npx @cloudflare/next-on-pages",  // ✅ Cloudflare Pages용
    "preview": "npm run pages:build && wrangler pages dev",
    "deploy": "npm run pages:build && wrangler pages deploy"
  }
}
```

### 올바른 빌드 결과 확인
`npm run pages:build` 실행 후:
```
✓ Completed `@cloudflare/next-on-pages` CLI
✓ Generated `.vercel/output/static` directory
✓ API Routes converted to _worker.js
✓ Functions directory processed
```

---

## 📋 체크리스트

### 배포 전 확인사항
- [ ] Cloudflare Pages Dashboard 빌드 명령: `npm run pages:build`
- [ ] Cloudflare Pages Dashboard 출력 디렉터리: `.vercel/output/static`
- [ ] 환경 변수 `NODE_VERSION` = 20 설정됨
- [ ] 모든 환경 변수 (DATABASE_URL, NEXTAUTH_SECRET 등) 설정됨

### 배포 후 테스트
- [ ] https://superplacestudy.pages.dev/login 페이지 로드됨
- [ ] 로그인 폼에 이메일/비밀번호 입력 가능
- [ ] 테스트 계정으로 로그인 성공
- [ ] Dashboard 페이지로 리다이렉트됨

---

## 🔧 로컬 테스트 방법

로컬에서 Cloudflare Pages 환경을 시뮬레이션하여 테스트:

```bash
# Cloudflare Pages 빌드
npm run pages:build

# 로컬 Cloudflare Pages 환경 실행
npx wrangler pages dev .vercel/output/static

# 브라우저에서 http://localhost:8788/login 접속
# 테스트 계정으로 로그인 시도
```

---

## 📞 추가 지원

빌드 설정을 변경한 후에도 문제가 계속되면:

1. **Cloudflare Pages 빌드 로그 확인**:
   - Dashboard > superplacestudy > Deployments
   - 가장 최근 배포 클릭
   - 빌드 로그 확인

2. **에러 메시지 확인**:
   - 브라우저 개발자 도구 (F12)
   - Console 탭 확인
   - Network 탭에서 API 요청 상태 확인

3. **환경 변수 확인**:
   - Settings > Environment variables
   - 모든 필수 변수가 설정되었는지 확인

---

## ⏰ 타임라인

### 완료된 작업
- ✅ Next.js API Routes 생성 (하드코딩 테스트 계정)
- ✅ 로그인 페이지 trailing slash 수정
- ✅ GitHub에 푸시 완료

### 필요한 작업
- ⚠️ **Cloudflare Pages Dashboard 빌드 설정 변경** (수동 작업 필요)
- ⏳ 설정 변경 후 자동 재배포
- ⏳ 로그인 기능 테스트

---

## 🎯 최종 목표

**Cloudflare Pages Dashboard 빌드 설정만 변경하면, 로그인이 즉시 작동합니다!**

설정 변경 후:
1. 자동으로 재배포됨 (약 2-3분 소요)
2. https://superplacestudy.pages.dev/login 접속
3. 테스트 계정으로 로그인
4. Dashboard로 리다이렉트 및 정상 작동 ✅

---

**마지막 업데이트**: 2026-02-18  
**상태**: Cloudflare Pages 빌드 설정 수정 대기 중
