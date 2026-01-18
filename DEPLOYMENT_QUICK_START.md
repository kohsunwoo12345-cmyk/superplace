# Cloudflare Pages 배포 설정 요약

## 🎯 빠른 설정 가이드

### Cloudflare Dashboard 설정값

#### 1. 기본 설정
```
프로젝트 이름: superplace_study
프레임워크: Next.js
```

#### 2. 빌드 설정
```
빌드 명령 (Build command):
npm run build

빌드 출력 디렉토리 (Build output directory):
.next

루트 디렉토리 (Root directory):
/
```

#### 3. 필수 환경 변수

프로덕션 환경:
```
DATABASE_URL=file:./prisma/dev.db
NEXTAUTH_URL=https://superplace-study.pages.dev
NEXTAUTH_SECRET=[32자 이상의 랜덤 문자열]
```

NEXTAUTH_SECRET 생성 명령어:
```bash
openssl rand -base64 32
```

#### 4. 선택 환경 변수 (기능 사용 시)
```
OPENAI_API_KEY=sk-...
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
```

### ⚡ CLI로 배포하기

```bash
# 1. Cloudflare 로그인
npx wrangler login

# 2. 빌드
npm run build

# 3. 배포
npx wrangler pages deploy .next --project-name=superplace_study
```

### 🔗 배포 후 URL
```
프로덕션: https://superplace-study.pages.dev
프리뷰: https://[commit-hash].superplace-study.pages.dev
```

### ⚠️ 중요 사항

1. **데이터베이스**: 
   - SQLite는 Cloudflare Pages에서 제한적
   - Cloudflare D1 또는 외부 DB 사용 권장

2. **환경 변수**:
   - Dashboard에서 설정 필수
   - 배포 전/후 모두 설정 가능

3. **자동 배포**:
   - GitHub 연동 시 푸시할 때마다 자동 배포
   - main 브랜치 = 프로덕션
   - 다른 브랜치 = 프리뷰

### 📋 체크리스트

배포 전:
- [ ] GitHub에 코드 푸시 완료
- [ ] wrangler.toml 파일 존재
- [ ] 환경 변수 준비 완료
- [ ] NEXTAUTH_SECRET 생성 완료

배포 후:
- [ ] 빌드 성공 확인
- [ ] 환경 변수 설정 완료
- [ ] 메인 페이지 접속 테스트
- [ ] 로그인 기능 테스트
- [ ] 대시보드 접속 테스트

### 📚 자세한 내용
전체 가이드는 `CLOUDFLARE_DEPLOYMENT.md` 참조
