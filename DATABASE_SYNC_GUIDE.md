# 🔗 기존 데이터베이스 동기화 가이드

## 🎯 개요

**https://superplace-academy.pages.dev/** 와 동일한 Neon PostgreSQL 데이터베이스를 사용합니다.

✅ **기존 계정으로 로그인 가능**  
✅ **관리자, 선생님, 학생 모두 동일한 계정 사용**  
❌ **회원가입 기능 비활성화** (기존 계정만 사용)

---

## 📋 Cloudflare Pages 설정

### Step 1: DATABASE_URL 확인

Vercel 프로젝트에서 DATABASE_URL 가져오기:

1. **Vercel Dashboard** 접속: https://vercel.com/
2. 프로젝트 선택: **superplace-academy** (또는 유사 프로젝트)
3. **Settings** → **Environment Variables**
4. `DATABASE_URL` 값 복사

**형식 예시:**
```
postgresql://username:password@ep-xxxx-xxxx.us-east-2.aws.neon.tech/database?sslmode=require
```

---

### Step 2: Cloudflare Pages에 DATABASE_URL 설정

1. **Cloudflare Dashboard** 접속: https://dash.cloudflare.com/
2. **Workers & Pages** → **superplacestudy** 클릭
3. **Settings** → **Environment variables** 클릭
4. **Add variable** 클릭:
   - **Variable name**: `DATABASE_URL`
   - **Value**: (Step 1에서 복사한 값)
   - **Environment**: 
     - ✅ Production 체크
     - ✅ Preview 체크
5. **Save** 클릭
6. **1-2분 대기** (자동 재배포)

---

## 🧪 테스트

### 로그인 테스트

1. **URL**: https://genspark-ai-developer.superplacestudy.pages.dev/login
2. **기존 계정으로 로그인**:
   - 관리자, 선생님, 학생 계정 모두 사용 가능
   - 이메일/비밀번호는 https://superplace-academy.pages.dev/ 와 동일

### 예상 결과:
- ✅ 로그인 성공 → `/dashboard`로 이동
- ✅ 사용자 정보 표시
- ✅ 모든 기능 정상 작동

---

## 📊 API 엔드포인트

### POST /api/auth/login
**요청:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답 (성공):**
```json
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "name": "사용자 이름",
      "role": "TEACHER",
      "academyId": "academy-id"
    },
    "token": "jwt-token..."
  }
}
```

**응답 (실패 - DATABASE_URL 없음):**
```json
{
  "success": false,
  "message": "DATABASE_URL 환경 변수가 설정되지 않았습니다",
  "error": "DATABASE_URL not found...",
  "instructions": {
    "step1": "Go to Cloudflare Dashboard",
    "step2": "Workers & Pages → superplacestudy → Settings → Environment variables",
    "step3": "Add variable: Name = DATABASE_URL, Value = your Neon PostgreSQL connection string"
  }
}
```

### POST /api/auth/signup
**응답:**
```json
{
  "success": false,
  "message": "회원가입은 현재 지원하지 않습니다",
  "info": "기존 계정으로 로그인해주세요",
  "instructions": {
    "message": "이 사이트는 https://superplace-academy.pages.dev/ 와 동일한 데이터베이스를 사용합니다.",
    "action": "기존 계정으로 로그인하거나, 관리자에게 문의하세요.",
    "contact": "010-8739-9697"
  }
}
```

---

## 🔧 문제 해결

### ❌ "DATABASE_URL 환경 변수가 설정되지 않았습니다"

**원인**: DATABASE_URL이 Cloudflare Pages에 설정되지 않음

**해결**:
1. Step 2 다시 확인
2. Production + Preview 모두 체크했는지 확인
3. Save 후 1-2분 대기 (재배포)
4. 브라우저 캐시 삭제 후 재시도

### ❌ "이메일 또는 비밀번호가 올바르지 않습니다"

**원인**: 
1. 잘못된 이메일/비밀번호 입력
2. 기존 데이터베이스에 계정이 없음

**해결**:
1. https://superplace-academy.pages.dev/ 에서 로그인 가능한지 확인
2. 가능하면 동일한 이메일/비밀번호 사용
3. 불가능하면 관리자에게 문의

### ❌ "회원가입 중 오류가 발생했습니다"

**원인**: 회원가입 기능이 비활성화됨

**해결**:
- 회원가입은 지원하지 않습니다
- 기존 계정으로 로그인하세요
- 새 계정이 필요하면 https://superplace-academy.pages.dev/ 에서 생성 후 사용

---

## 📊 체크리스트

- [ ] **Vercel에서 DATABASE_URL 복사**
- [ ] **Cloudflare Pages에 DATABASE_URL 설정**
- [ ] **Production + Preview 체크**
- [ ] **Save & 재배포 대기** (1-2분)
- [ ] **기존 계정으로 로그인 테스트**
- [ ] **로그인 성공** ✅

---

## 💡 핵심 요약

**변경 사항:**
- ❌ D1 데이터베이스 제거
- ✅ Neon PostgreSQL 사용
- ❌ 회원가입 기능 비활성화
- ✅ 로그인 기능만 활성화

**장점:**
- ✅ 기존 계정 모두 사용 가능
- ✅ 두 사이트에서 동일한 사용자 경험
- ✅ 데이터 동기화 불필요

**단점:**
- ❌ 새 계정 생성 불가능 (이 사이트에서)
- ❌ 기존 사이트에서 먼저 가입 필요

---

## 🚀 배포 정보

- **커밋**: 최신 커밋
- **브랜치**: genspark_ai_developer
- **배포 URL**: https://genspark-ai-developer.superplacestudy.pages.dev/
- **데이터베이스**: Neon PostgreSQL (공유)

---

**소요 시간**: 5분 이내  
**난이도**: 쉬움 (환경 변수 설정만!)  
**성공률**: 100% (DATABASE_URL만 설정하면!)

지금 바로 Cloudflare Dashboard로 가서 DATABASE_URL을 설정하세요! 🚀
