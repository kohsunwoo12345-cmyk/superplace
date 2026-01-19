# 🚀 Vercel 배포 빠른 가이드

## 📋 1단계: 데이터베이스 준비 (5분)

### Neon (추천 - 무료)
1. https://console.neon.tech 접속
2. "Create a project" 클릭
3. Project name: `superplace`
4. Region: `Asia Pacific (Singapore)` 선택
5. "Create Project" 클릭
6. **Connection String** 복사 (나중에 사용)

```
postgresql://username:password@ep-xxx.region.neon.tech/database?sslmode=require
```

## 📋 2단계: Google AI API 키 발급 (2분)

1. https://makersuite.google.com/app/apikey 접속
2. "Create API key" 클릭
3. API 키 복사 (나중에 사용)

```
AIzaSy...
```

## 📋 3단계: NEXTAUTH_SECRET 생성 (1분)

터미널에서 실행:
```bash
openssl rand -base64 32
```

결과를 복사 (나중에 사용)

## 🚀 4단계: Vercel 배포 (5분)

### A. Vercel 대시보드 접속
1. https://vercel.com/dashboard 접속
2. GitHub 계정으로 로그인

### B. 프로젝트 Import
1. **"Add New..."** → **"Project"** 클릭
2. **"Import Git Repository"** 선택
3. 검색: `kohsunwoo12345-cmyk/superplace`
4. **"Import"** 클릭

### C. 프로젝트 설정
```
Project Name: superplace
Framework: Next.js (자동 감지)
Root Directory: ./
Build Command: prisma generate && next build (자동)
```

### D. 환경 변수 설정 ⚠️ **중요!**

**Environment Variables** 섹션에 다음을 추가:

#### 1. DATABASE_URL
```
Value: postgresql://username:password@ep-xxx.region.neon.tech/database?sslmode=require
Environment: Production, Preview, Development
```
(1단계에서 복사한 Neon 연결 문자열)

#### 2. NEXTAUTH_URL
```
Value: https://superplace.vercel.app
Environment: Production
```
(배포 후 실제 도메인으로 자동 설정됨)

#### 3. NEXTAUTH_SECRET
```
Value: (3단계에서 생성한 문자열)
Environment: Production, Preview, Development
```

#### 4. GOOGLE_GENERATIVE_AI_API_KEY
```
Value: AIzaSy...
Environment: Production, Preview, Development
```
(2단계에서 복사한 Google AI API 키)

#### 5. GOOGLE_GEMINI_API_KEY (동일한 값)
```
Value: AIzaSy...
Environment: Production, Preview, Development
```
(4번과 동일한 값)

### E. 배포
1. **"Deploy"** 버튼 클릭
2. 빌드 로그 확인 (약 2-3분)
3. 배포 완료!

## ✅ 5단계: 배포 확인

### A. 사이트 접속
배포 완료 후 표시되는 URL 클릭:
```
https://superplace-xxx.vercel.app
```

### B. 테스트
1. 홈페이지 로드 확인
2. 로그인 페이지 접근: `/auth/signin`
3. 회원가입 페이지 접근: `/auth/signup`
4. **학원장으로 회원가입**
   - 역할: DIRECTOR 선택
   - 이메일, 비밀번호, 이름 입력
   - 학원 자동 생성 확인
5. **초대 코드 확인**
   - 로그인
   - 학원 설정 → 초대 코드 복사
6. **선생님/학생 가입 테스트**
   - 새 브라우저/시크릿 모드
   - 초대 코드로 가입

## 🐛 문제 해결

### 빌드 실패
- Vercel 대시보드 → Deployments → 실패한 배포 클릭 → Logs 확인
- 환경 변수 누락 확인
- DATABASE_URL 형식 확인

### 데이터베이스 연결 오류
- DATABASE_URL이 올바른지 확인
- Neon 대시보드에서 프로젝트 상태 확인
- `?sslmode=require` 포함 확인

### 로그인 오류
- NEXTAUTH_URL이 실제 도메인과 일치하는지 확인
- NEXTAUTH_SECRET이 설정되었는지 확인

## 📚 상세 가이드

- **DEPLOYMENT_GUIDE.md** - 전체 배포 가이드
- **README.md** - 프로젝트 문서

## 🎉 완료!

축하합니다! SUPER PLACE가 성공적으로 배포되었습니다.

**배포 URL**: https://superplace.vercel.app

**다음 단계**:
- 학원장 계정 생성
- 선생님/학생 초대
- 수업 생성 및 관리
- 출석 체크

---

**문의**: GitHub Issues 또는 DEPLOYMENT_GUIDE.md 참고
