# 🚨 프로덕션 배포 문제 해결 가이드

## 🔍 문제 진단 결과

### 테스트 결과
- **프리뷰 배포** (d8533809.superplacestudy.pages.dev): ✅ 정상 작동
  - `/api/auth/login`: 200 OK - 로그인 성공
  - `/api/auth/signup`: 500 (DB 연결 문제이지만 API는 작동)
  
- **프로덕션 배포** (superplacestudy.pages.dev): ❌ 문제 발생
  - `/api/auth/login`: 308 Permanent Redirect
  - `/api/auth/signup`: 308 Permanent Redirect
  - `/api/login`: 308 Permanent Redirect

### 원인 분석
**308 Permanent Redirect**는 다음 이유로 발생합니다:

1. **캐시된 이전 배포**: Cloudflare의 엣지 캐시에 이전 빌드가 저장됨
2. **도메인 리다이렉트 설정**: 프로덕션 도메인에 리다이렉트 규칙이 있음
3. **HTTPS 강제 리다이렉트**: 프로토콜 변경
4. **빌드 파일 불일치**: 프로덕션에 오래된 빌드가 배포됨

## ✅ 해결 방법

### 방법 1: Cloudflare Pages에서 캐시 제거 및 재배포 (권장)

#### 1단계: Cloudflare Dashboard 접속
```
https://dash.cloudflare.com/
→ Workers & Pages
→ superplacestudy (또는 프로젝트 이름)
```

#### 2단계: 캐시 제거
```
Settings → Functions → Clear deployment cache
또는
Settings → Builds & deployments → Clear build cache
```

#### 3단계: 프로덕션 재배포
```
Deployments 탭
→ [최신 배포] 옆의 "..." 메뉴
→ "Retry deployment"
또는
→ "Rollback to this deployment" (작동하는 프리뷰 배포 선택)
```

### 방법 2: Git에서 강제 재배포

```bash
# 빈 커밋으로 재배포 트리거
git commit --allow-empty -m "chore: force production deployment"
git push origin main
```

### 방법 3: Wrangler CLI로 재배포

```bash
# 프로젝트 빌드
npm run pages:build

# 프로덕션 배포
wrangler pages deploy .vercel/output/static --project-name=superplacestudy --branch=main

# 또는 특정 커밋 ID로 배포
wrangler pages deployment create superplacestudy main
```

### 방법 4: 도메인 리다이렉트 확인 및 제거

#### Cloudflare Dashboard에서:
```
Pages 프로젝트 → Settings → Domains
→ Custom domains 확인
→ 리다이렉트 규칙 제거
```

또는

```
Workers & Pages → superplacestudy → Settings → Functions
→ Routes 확인
→ 불필요한 리다이렉트 제거
```

## 🔧 즉시 실행할 명령어

### 로컬에서 강제 재배포
```bash
cd /home/user/webapp

# 1. 빈 커밋으로 재배포 트리거
git commit --allow-empty -m "fix: force production deployment to clear cache"

# 2. main 브랜치에 푸시
git push origin main

# 3. 배포 상태 확인
# Cloudflare Dashboard에서 배포 로그 확인
```

## 📊 배포 확인 방법

### 1. 배포 완료 대기 (약 2-5분)
```
https://dash.cloudflare.com/
→ Workers & Pages
→ superplacestudy
→ Deployments 탭
→ 최신 배포 상태 확인
```

### 2. API 테스트
```bash
# 프로덕션 URL로 테스트
curl -X POST https://superplacestudy.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@superplace.com","password":"admin1234"}'

# 예상 결과: 200 OK
# {
#   "success": true,
#   "message": "로그인 성공",
#   "data": { ... }
# }
```

### 3. 브라우저 테스트
1. 시크릿 모드로 https://superplacestudy.pages.dev/auth/signin 접속
2. 테스트 계정으로 로그인:
   - 이메일: admin@superplace.com
   - 비밀번호: admin1234

## 🎯 프리뷰 배포를 프로덕션으로 승격

프리뷰 배포(d8533809)가 정상 작동하므로 이를 프로덕션으로 승격:

```
Cloudflare Dashboard
→ Workers & Pages → superplacestudy
→ Deployments
→ d8533809 배포 찾기
→ "..." 메뉴 → "Promote to production"
```

## 🔍 D1 데이터베이스 연결 확인

프로덕션 배포 후에도 로그인 실패 시:

### 1. D1 바인딩 확인
```
Cloudflare Dashboard
→ Workers & Pages → superplacestudy
→ Settings → Functions → D1 database bindings
→ DB = webapp-production (8c106540-21b4-4fa9-8879-c4956e459ca1)
```

### 2. 환경 변수 확인
```
Settings → Environment variables → Production
→ 모든 변수가 설정되어 있는지 확인
```

### 3. D1에 테스트 계정 생성
D1 Console에서 `fix_d1_users.sql` 실행:
```sql
-- 이전에 생성한 SQL 스크립트 실행
-- 관리자, 학원장, 선생님, 일반 사용자 계정 생성
```

## 📝 체크리스트

배포 전:
- [ ] 로컬에서 `npm run build` 성공 확인
- [ ] Git 변경사항 모두 커밋
- [ ] main 브랜치로 푸시

배포 후:
- [ ] Cloudflare Pages 배포 상태 확인
- [ ] 프로덕션 URL에서 API 테스트
- [ ] 브라우저에서 로그인 테스트
- [ ] D1 데이터베이스 연결 확인
- [ ] 회원가입 테스트

## 🚨 긴급 해결 방법

### 즉시 프리뷰를 프로덕션으로 사용
프로덕션 수정이 오래 걸릴 경우:

```
1. 사용자에게 임시로 프리뷰 URL 안내:
   https://d8533809.superplacestudy.pages.dev/

2. Custom Domain 재설정:
   Cloudflare Dashboard → Custom domains
   → superplacestudy.pages.dev를 d8533809 배포로 연결
```

---

**작성일**: 2026-02-18  
**문제**: 프로덕션 배포 308 리다이렉트  
**해결**: 캐시 클리어 및 재배포  
**상태**: 해결 대기 중
