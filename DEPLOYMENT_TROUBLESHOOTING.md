# Vercel 배포 문제 해결 가이드

## 현재 배포 상태

### 최근 배포
- **날짜**: 2026-02-01
- **커밋**: a071589 (chore: force Vercel redeployment)
- **변경사항**: 관리자 대시보드 사용자 관리 기능 개선

## 배포 확인 방법

### 1. Vercel 대시보드에서 확인
1. https://vercel.com/dashboard 접속
2. superplace 프로젝트 선택
3. Deployments 탭에서 최신 배포 상태 확인

### 2. 명령줄에서 확인
```bash
# 사이트 응답 확인
curl -I https://superplace-study.vercel.app

# 최근 커밋 확인
git log --oneline -5

# GitHub PR 체크 상태 확인
gh pr checks [PR번호]
```

## 일반적인 배포 문제 및 해결

### 문제 1: 빌드 실패
**증상**: Vercel에서 빌드가 실패함

**해결 방법**:
```bash
# 로컬에서 빌드 테스트
npm run build

# TypeScript 오류 확인
npx tsc --noEmit

# ESLint 오류 확인
npm run lint
```

### 문제 2: 환경 변수 누락
**증상**: 배포는 성공했지만 기능이 작동하지 않음

**해결 방법**:
1. Vercel Dashboard → Settings → Environment Variables
2. 필수 환경 변수 확인:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `GOOGLE_GEMINI_API_KEY`

### 문제 3: 캐시 문제
**증상**: 코드 변경이 반영되지 않음

**해결 방법**:
```bash
# 강제 재배포 트리거
date > .vercel-force-deploy
git add .vercel-force-deploy
git commit -m "chore: force Vercel redeployment"
git push origin main
```

### 문제 4: 데이터베이스 연결 실패
**증상**: 500 에러 또는 데이터베이스 관련 오류

**해결 방법**:
1. DATABASE_URL 형식 확인:
   ```
   postgresql://user:password@host:port/database?sslmode=require
   ```
2. Prisma 스키마 동기화:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

## 배포 프로세스

### 정상적인 배포 흐름
1. 코드 변경 및 커밋
   ```bash
   git add .
   git commit -m "feat: 새로운 기능 추가"
   ```

2. PR 생성 (선택사항)
   ```bash
   git push origin feature-branch
   gh pr create --base main --head feature-branch
   ```

3. Main 브랜치에 병합
   ```bash
   git checkout main
   git merge feature-branch
   git push origin main
   ```

4. Vercel 자동 배포 대기 (2-5분)

5. 배포 확인
   ```bash
   curl https://superplace-study.vercel.app
   ```

## 긴급 배포 (Emergency Deployment)

배포가 계속 실패할 경우:

### 옵션 1: Vercel CLI 사용
```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 수동 배포
vercel --prod
```

### 옵션 2: GitHub Actions 설정
1. `.github/workflows/deploy.yml` 생성
2. Vercel 배포 워크플로우 추가
3. 자동 배포 설정

### 옵션 3: Vercel Git Integration 재연결
1. Vercel Dashboard → Settings → Git
2. Disconnect 후 다시 Connect
3. main 브랜치 재설정

## 배포 후 확인 사항

### 체크리스트
- [ ] 사이트 접속 가능 (https://superplace-study.vercel.app)
- [ ] 로그인 기능 작동
- [ ] 관리자 대시보드 접근 가능
- [ ] 새로운 기능 정상 작동
- [ ] API 엔드포인트 응답 확인
- [ ] 데이터베이스 연결 확인

### 기능별 테스트
```bash
# 관리자 대시보드 - 최근 가입 사용자
curl -X GET https://superplace-study.vercel.app/api/admin/stats \
  -H "Cookie: your-session-cookie"

# 사용자 목록 API
curl -X GET https://superplace-study.vercel.app/api/admin/users \
  -H "Cookie: your-session-cookie"
```

## 모니터링

### Vercel 로그 확인
1. Vercel Dashboard → Deployments
2. 특정 배포 클릭
3. Runtime Logs 확인

### 에러 추적
- Vercel Analytics 활성화
- Sentry 연동 (선택사항)
- Custom 에러 로깅

## 롤백 방법

### 이전 배포로 롤백
1. Vercel Dashboard → Deployments
2. 이전 성공한 배포 선택
3. "Promote to Production" 클릭

### Git 롤백
```bash
# 이전 커밋으로 되돌리기
git revert HEAD
git push origin main

# 또는 특정 커밋으로 되돌리기
git reset --hard <commit-hash>
git push -f origin main
```

## 연락처

배포 문제가 지속될 경우:
- GitHub Issues: https://github.com/kohsunwoo12345-cmyk/superplace/issues
- Vercel Support: https://vercel.com/support

---

**최종 업데이트**: 2026-02-01
**작성자**: GenSpark AI Developer
