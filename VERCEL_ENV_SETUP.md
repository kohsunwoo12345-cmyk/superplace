# ⚙️ Vercel 환경 변수 설정 가이드

## 🔴 긴급: 반드시 설정해야 할 환경 변수

Vercel에서 다음 5개 환경 변수를 설정하지 않으면 **로그인 페이지가 작동하지 않습니다.**

## 📋 설정 방법

### 1. Vercel 대시보드 접속
```
https://vercel.com/dashboard
→ superplace 프로젝트 선택
→ Settings
→ Environment Variables
```

### 2. 필수 환경 변수 추가

#### 변수 1: NEXTAUTH_URL
```env
Name: NEXTAUTH_URL
Value: https://superplacestudy.vercel.app
Environment: ✅ Production, ✅ Preview, ✅ Development
```

#### 변수 2: NEXTAUTH_SECRET
```bash
# 로컬 터미널에서 생성
openssl rand -base64 32

# 결과 예시 (새로 생성하세요!)
f51b85e6df8312e966068a9e8ac0e292
```

```env
Name: NEXTAUTH_SECRET
Value: (위에서 생성한 값)
Environment: ✅ Production, ✅ Preview, ✅ Development
```

#### 변수 3: DATABASE_URL
```env
Name: DATABASE_URL
Value: postgresql://neondb_owner:npg_YvDcNzWU3KR7@ep-empty-shadow-ahjjzdfv-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
Environment: ✅ Production, ✅ Preview, ✅ Development
```

#### 변수 4: GOOGLE_GENERATIVE_AI_API_KEY
```env
Name: GOOGLE_GENERATIVE_AI_API_KEY
Value: AIzaSyAAu9N0kySmg_AAQZ6huNqIuc-aCykYSaw
Environment: ✅ Production, ✅ Preview, ✅ Development
```

#### 변수 5: GOOGLE_GEMINI_API_KEY
```env
Name: GOOGLE_GEMINI_API_KEY
Value: AIzaSyAAu9N0kySmg_AAQZ6huNqIuc-aCykYSaw (변수 4와 동일)
Environment: ✅ Production, ✅ Preview, ✅ Development
```

## 🖼️ 설정 화면 예시

```
┌─────────────────────────────────────────────────────┐
│ Add Environment Variable                             │
├─────────────────────────────────────────────────────┤
│ Name:                                                │
│ ┌─────────────────────────────────────────────────┐ │
│ │ NEXTAUTH_URL                                    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ Value:                                               │
│ ┌─────────────────────────────────────────────────┐ │
│ │ https://superplacestudy.vercel.app              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ Environment:                                         │
│ ☑ Production  ☑ Preview  ☑ Development             │
│                                                      │
│                         [Add]  [Cancel]              │
└─────────────────────────────────────────────────────┘
```

## ✅ 설정 확인

### 모든 변수가 추가되었는지 확인
```
Environment Variables (5)

✅ NEXTAUTH_URL                    Production, Preview, Development
✅ NEXTAUTH_SECRET                 Production, Preview, Development
✅ DATABASE_URL                    Production, Preview, Development
✅ GOOGLE_GENERATIVE_AI_API_KEY    Production, Preview, Development
✅ GOOGLE_GEMINI_API_KEY           Production, Preview, Development
```

## 🚀 재배포

### 방법 1: Redeploy 버튼 (권장)
```
1. Deployments 탭 클릭
2. 최신 배포 선택
3. "⋯" (점 3개) 클릭
4. "Redeploy" 선택
5. "Redeploy" 버튼 클릭
```

### 방법 2: GitHub 푸시
```bash
# 이미 푸시 완료되어 있음
# 환경 변수 추가 후 자동으로 재배포됨
```

## 🧪 배포 후 테스트

### 1. 로그인 페이지 접근
```
https://superplacestudy.vercel.app/auth/signin
```

**예상 결과**: 로그인 폼이 정상 표시됨

### 2. 관리자 로그인
```
이메일: admin@superplace.com
비밀번호: admin123!@#
```

**예상 결과**: 로그인 성공 → /dashboard로 이동

### 3. 홈페이지 링크
```
https://superplacestudy.vercel.app
→ "로그인" 버튼 클릭
→ /auth/signin으로 이동 확인
```

## ❌ 환경 변수가 없을 때 발생하는 문제

### NEXTAUTH_URL 누락
```
Error: Configuration
또는
Error: Invalid configuration
```

### NEXTAUTH_SECRET 누락
```
[auth][error] MissingSecret
```

### DATABASE_URL 누락
```
PrismaClientInitializationError
Cannot reach database server
```

### API 키 누락
```
AI 기능 사용 시 에러 발생
```

## 🔍 환경 변수 설정 확인 방법

### Vercel CLI (선택사항)
```bash
# Vercel CLI로 환경 변수 확인
npx vercel env pull .env.vercel

# 파일 내용 확인
cat .env.vercel
```

### 브라우저 개발자 도구
```
1. F12 → Network 탭
2. 로그인 시도
3. /api/auth/signin 요청 확인
4. Response 확인
```

## 📞 문제 발생 시

### 1. Vercel 빌드 로그 확인
```
Deployments → 최신 배포 → Building → View Logs
```

### 2. 런타임 로그 확인
```
Deployments → 최신 배포 → Functions → Logs
```

### 3. 환경 변수 재확인
```
Settings → Environment Variables
→ 5개 변수 모두 있는지
→ Production에 적용되어 있는지
```

## 🎯 요약

| 단계 | 작업 | 상태 |
|------|------|------|
| 1 | Vercel 대시보드 접속 | 👈 여기부터 시작 |
| 2 | Settings → Environment Variables | |
| 3 | 5개 변수 추가 | |
| 4 | Redeploy | |
| 5 | /auth/signin 테스트 | |
| 6 | 로그인 테스트 | |

---

**중요**: 환경 변수를 추가한 후 반드시 **Redeploy**를 해야 적용됩니다!

현재 로컬에서는 모든 기능이 정상 작동합니다. ✅  
Vercel에 환경 변수만 설정하면 바로 작동합니다! 🚀
