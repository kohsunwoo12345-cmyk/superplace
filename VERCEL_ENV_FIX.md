# 🔧 Vercel 환경 변수 긴급 수정 가이드

## ❌ 문제: Configuration Error

URL에 `?error=Configuration`이 나타나는 경우:
- NextAuth 설정 오류
- 환경 변수 누락 또는 잘못된 값

---

## ✅ 해결 방법

### 1. Vercel 대시보드 접속
```
https://vercel.com/dashboard
→ 프로젝트 선택 (superplace)
→ Settings 탭
→ Environment Variables
```

### 2. 필수 환경 변수 확인 및 수정

#### ⚠️ **NEXTAUTH_URL** (가장 중요!)

**잘못된 예:**
```
❌ http://localhost:3000
❌ https://superplace.vercel.app (기본 도메인과 다름)
```

**올바른 예:**
```
✅ https://superplacestudy.vercel.app
```

**설정 방법:**
1. `NEXTAUTH_URL` 찾기
2. Edit 버튼 클릭
3. Value를 실제 배포된 도메인으로 변경:
   ```
   https://superplacestudy.vercel.app
   ```
4. Environment: **Production** 체크
5. Save 버튼 클릭

---

#### ✅ **NEXTAUTH_SECRET**

**확인:**
```
f51b85e6df8312e966068a9e8ac0e292
```

**없으면 추가:**
1. Add New 버튼
2. Name: `NEXTAUTH_SECRET`
3. Value: `f51b85e6df8312e966068a9e8ac0e292`
4. Environment: Production, Preview, Development 모두 체크
5. Save

---

#### ✅ **DATABASE_URL**

**확인:**
```
postgresql://neondb_owner:npg_YvDcNzWU3KR7@ep-empty-shadow-ahjjzdfv-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

---

#### ✅ **GOOGLE_GENERATIVE_AI_API_KEY**

**확인:**
```
YOUR_GOOGLE_GEMINI_API_KEY_HERE
```

---

#### ✅ **GOOGLE_GEMINI_API_KEY** (같은 값)

**확인:**
```
YOUR_GOOGLE_GEMINI_API_KEY_HERE
```

---

### 3. Redeploy (재배포)

환경 변수 변경 후 **반드시 재배포**:

**방법 A: Vercel 대시보드**
```
Deployments 탭
→ 최신 배포 클릭
→ ⋯ (점 3개) 메뉴
→ Redeploy
→ Redeploy 확인
```

**방법 B: Git Push**
```bash
# 코드 변경 후
git add .
git commit -m "Update config"
git push origin main
```

---

## 🧪 테스트

재배포 완료 후:

1. **로그인 페이지 접속**
   ```
   https://superplacestudy.vercel.app/auth/signin
   ```

2. **관리자 계정 로그인**
   ```
   이메일: admin@superplace.com
   비밀번호: admin123!@#
   ```

3. **성공 확인**
   - URL에 `?error=Configuration` 없음 ✅
   - `/dashboard`로 리다이렉트 ✅
   - 대시보드 정상 표시 ✅

---

## 🔍 추가 문제 해결

### A. 여전히 Configuration Error가 나타남

**1. Vercel 로그 확인**
```
Deployments → 최신 배포 → View Function Logs
```

**2. 환경 변수 다시 확인**
```
Settings → Environment Variables
→ 모든 변수가 Production에 체크되어 있는지 확인
```

**3. 캐시 클리어**
```
브라우저 시크릿 모드로 테스트
또는 브라우저 캐시 삭제
```

---

### B. 데이터베이스 연결 오류

**증상:**
- 로그인 시도 시 오류
- "Internal Server Error"

**해결:**
```
1. Neon 대시보드 접속
2. 프로젝트 상태 확인 (Active인지)
3. Connection String 재확인
4. Vercel DATABASE_URL 업데이트
5. Redeploy
```

---

### C. 세션 만료 문제

**증상:**
- 로그인 직후 다시 로그아웃됨

**해결:**
```
1. NEXTAUTH_SECRET이 설정되어 있는지 확인
2. 여러 환경(Production, Preview)에 모두 동일한 값 사용
3. Redeploy
```

---

## 📋 체크리스트

배포 전 확인사항:

- [ ] `NEXTAUTH_URL`이 실제 배포 도메인과 일치
- [ ] `NEXTAUTH_SECRET`이 설정됨 (32자 이상)
- [ ] `DATABASE_URL`이 유효한 PostgreSQL 연결 문자열
- [ ] `GOOGLE_GENERATIVE_AI_API_KEY` 설정
- [ ] `GOOGLE_GEMINI_API_KEY` 설정
- [ ] 모든 환경 변수가 Production 환경에 체크
- [ ] 환경 변수 변경 후 Redeploy 실행
- [ ] 로그인 테스트 성공

---

## 🎯 현재 설정 (참고용)

```env
# Vercel에 다음 값으로 설정하세요:

DATABASE_URL=postgresql://neondb_owner:npg_YvDcNzWU3KR7@ep-empty-shadow-ahjjzdfv-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

NEXTAUTH_URL=https://superplacestudy.vercel.app

NEXTAUTH_SECRET=f51b85e6df8312e966068a9e8ac0e292

GOOGLE_GENERATIVE_AI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY_HERE

GOOGLE_GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY_HERE
```

---

## 🆘 긴급 지원

문제가 계속되면:

1. **Vercel 로그 확인**
   - Deployments → Function Logs
   - Runtime Logs에서 에러 확인

2. **GitHub Issue 생성**
   - 에러 메시지 스크린샷
   - Vercel 로그 내용

3. **데이터베이스 상태 확인**
   - Neon Dashboard에서 프로젝트 상태 확인

---

**작성일**: 2025-01-19  
**버전**: 1.0  
**대상**: Vercel 배포 문제 해결
