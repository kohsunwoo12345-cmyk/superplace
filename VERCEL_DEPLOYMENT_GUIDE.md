# Vercel 배포 가이드

## 🚨 현재 문제

프로덕션 환경에서 NextAuth 500 에러 발생:
- `CLIENT_FETCH_ERROR`: 서버 구성 문제
- `/api/auth/session`: 500 Internal Server Error
- `/api/auth/_log`: 500 Internal Server Error

## 원인

Vercel 환경 변수가 올바르게 설정되지 않았습니다.

## ✅ 해결 방법

### 1. Vercel 대시보드에서 환경 변수 설정

https://vercel.com/kohsunwoo12345-cmyk/superplace/settings/environment-variables

다음 환경 변수를 **반드시** 설정해야 합니다:

#### 필수 환경 변수

1. **NEXTAUTH_URL**
   ```
   https://superplacestudy.vercel.app
   ```
   - Production, Preview, Development 모두 체크

2. **NEXTAUTH_SECRET**
   ```
   f51b85e6df8312e966068a9e8ac0e292
   ```
   - Production, Preview, Development 모두 체크
   - ⚠️ 프로덕션에서는 새로운 시크릿 생성 권장:
     ```bash
     openssl rand -base64 32
     ```

3. **DATABASE_URL**
   ```
   postgresql://neondb_owner:npg_YvDcNzWU3KR7@ep-empty-shadow-ahjjzdfv-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```
   - Production, Preview, Development 모두 체크

4. **GOOGLE_GENERATIVE_AI_API_KEY**
   ```
   (현재 값 사용)
   ```

5. **GOOGLE_GEMINI_API_KEY**
   ```
   (현재 값 사용)
   ```

### 2. 환경 변수 설정 후 재배포

환경 변수를 설정한 후:

1. Vercel 대시보드에서 "Deployments" 탭으로 이동
2. 최신 배포 찾기
3. "..." 메뉴 → "Redeploy" 클릭
4. "Use existing Build Cache" 체크 해제
5. "Redeploy" 버튼 클릭

또는 Git push로 자동 배포:
```bash
git add .
git commit -m "fix: Vercel 환경 변수 설정 가이드 추가"
git push origin main
```

### 3. 배포 확인

배포 완료 후 테스트:

1. **로그인 페이지 접속**
   ```
   https://superplacestudy.vercel.app/auth/signin
   ```

2. **관리자 계정으로 로그인**
   - 이메일: `admin@superplace.com`
   - 비밀번호: `admin123!@#`

3. **대시보드 접근 확인**
   ```
   https://superplacestudy.vercel.app/dashboard
   ```

## 🔍 문제 해결

### 여전히 500 에러가 발생하는 경우

1. **Vercel 로그 확인**
   - Vercel 대시보드 → Deployments → 최신 배포 클릭
   - "Function Logs" 탭에서 에러 로그 확인

2. **환경 변수 확인**
   - Settings → Environment Variables에서 모든 변수가 설정되었는지 확인
   - 각 환경(Production, Preview, Development)에 적용되었는지 확인

3. **데이터베이스 연결 확인**
   - Neon PostgreSQL이 정상 작동하는지 확인
   - DATABASE_URL이 올바른지 확인

4. **캐시 삭제 후 재배포**
   - Redeploy 시 "Use existing Build Cache" 체크 해제

### 로그인은 되지만 리다이렉트 오류가 발생하는 경우

`NEXTAUTH_URL`이 올바르게 설정되었는지 확인:
- ❌ 잘못된 예: `http://localhost:3000`
- ✅ 올바른 예: `https://superplacestudy.vercel.app`

## 📝 체크리스트

배포 전 확인 사항:

- [ ] `NEXTAUTH_URL` 설정 (https://superplacestudy.vercel.app)
- [ ] `NEXTAUTH_SECRET` 설정
- [ ] `DATABASE_URL` 설정
- [ ] `GOOGLE_GENERATIVE_AI_API_KEY` 설정
- [ ] `GOOGLE_GEMINI_API_KEY` 설정
- [ ] 모든 환경 변수가 Production 환경에 적용됨
- [ ] 캐시 없이 재배포 완료
- [ ] 로그인 페이지 정상 로드 확인
- [ ] 관리자 계정 로그인 성공
- [ ] 대시보드 접근 성공

## 🎯 예상 결과

모든 설정이 완료되면:

1. ✅ `https://superplacestudy.vercel.app/auth/signin` - 로그인 페이지 정상 로드
2. ✅ 관리자 계정으로 로그인 성공
3. ✅ `/dashboard`로 자동 리다이렉트
4. ✅ 세션 유지 및 인증 정상 작동
5. ✅ 모든 대시보드 페이지 접근 가능

## 📞 추가 지원

문제가 계속되면:
1. Vercel Function Logs 스크린샷 공유
2. 브라우저 콘솔 에러 메시지 공유
3. 설정한 환경 변수 목록 확인

---

**최종 업데이트**: 2026-01-21
**작성자**: GenSpark AI Developer
