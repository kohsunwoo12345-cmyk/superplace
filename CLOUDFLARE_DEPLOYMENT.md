# Cloudflare Pages 배포 가이드

## 📋 프로젝트 정보
- **프로젝트 이름**: `superplace_study`
- **프레임워크**: Next.js 15
- **데이터베이스**: SQLite (Prisma ORM)

## 🚀 배포 단계별 가이드

### 1️⃣ GitHub 저장소 준비
현재 코드가 이미 GitHub에 푸시되어 있습니다:
```
Repository: kohsunwoo12345-cmyk/superplace
Branch: genspark_ai_developer (또는 main)
```

### 2️⃣ Cloudflare Pages 프로젝트 생성

1. **Cloudflare Dashboard 접속**
   - https://dash.cloudflare.com/ 로그인
   - Workers & Pages > Create application > Pages > Connect to Git 선택

2. **GitHub 저장소 연결**
   - GitHub 계정 연결 (처음이라면)
   - `kohsunwoo12345-cmyk/superplace` 저장소 선택
   - 배포할 브랜치 선택 (main 또는 genspark_ai_developer)

3. **빌드 설정**
   
   **프로젝트 이름** (필수):
   ```
   superplace_study
   ```

   **프레임워크 프리셋**:
   ```
   Next.js
   ```

   **빌드 명령** (Build command):
   ```
   npm run build
   ```

   **빌드 출력 디렉토리** (Build output directory):
   ```
   .next
   ```

   **루트 디렉토리** (Root directory):
   ```
   /
   ```

### 3️⃣ 환경 변수 설정

배포 후 Cloudflare Dashboard에서 환경 변수를 설정해야 합니다:

**Settings > Environment variables > Add variable**

필수 환경 변수:

| 변수 이름 | 설명 | 예시 값 |
|----------|------|--------|
| `DATABASE_URL` | 데이터베이스 연결 문자열 | `file:./prisma/dev.db` |
| `NEXTAUTH_URL` | NextAuth URL | `https://superplace-study.pages.dev` |
| `NEXTAUTH_SECRET` | NextAuth 비밀 키 | 랜덤 문자열 (32자 이상) |

선택 환경 변수 (기능 활성화 시):

| 변수 이름 | 설명 | 예시 값 |
|----------|------|--------|
| `OPENAI_API_KEY` | OpenAI API 키 | `sk-...` |
| `NAVER_CLIENT_ID` | 네이버 API 클라이언트 ID | `your_client_id` |
| `NAVER_CLIENT_SECRET` | 네이버 API 클라이언트 시크릿 | `your_client_secret` |

#### 📝 환경 변수 생성 방법

**NEXTAUTH_SECRET 생성**:
```bash
openssl rand -base64 32
```
또는 온라인 생성기 사용: https://generate-secret.vercel.app/32

### 4️⃣ 데이터베이스 설정

⚠️ **중요**: Cloudflare Pages는 SQLite 파일을 직접 지원하지 않습니다.

**옵션 1: Cloudflare D1 사용 (권장)**
```bash
# D1 데이터베이스 생성
npx wrangler d1 create superplace-study-db

# wrangler.toml에 D1 바인딩 추가
[[d1_databases]]
binding = "DB"
database_name = "superplace-study-db"
database_id = "your-database-id"

# Prisma 스키마 변경 (datasource db)
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**옵션 2: 외부 데이터베이스 사용**
- PostgreSQL: Neon, Supabase, Railway
- MySQL: PlanetScale
- MongoDB: MongoDB Atlas

환경 변수에 연결 문자열 설정:
```
DATABASE_URL="postgresql://user:password@host:5432/database"
```

### 5️⃣ 배포 확인

1. **빌드 로그 확인**
   - Cloudflare Dashboard > Pages > 프로젝트 선택
   - Deployments 탭에서 빌드 진행 상황 확인

2. **배포 URL 확인**
   - 성공하면 자동으로 URL이 생성됩니다
   - 기본 URL: `https://superplace-study.pages.dev`

3. **커스텀 도메인 설정 (선택)**
   - Custom domains > Set up a custom domain
   - 도메인 입력 후 DNS 레코드 추가

### 6️⃣ 배포 후 확인사항

✅ **체크리스트**:
- [ ] 메인 페이지가 정상적으로 로드되는가?
- [ ] 로그인 페이지가 작동하는가?
- [ ] 회원가입이 가능한가?
- [ ] 대시보드에 접근할 수 있는가?
- [ ] 환경 변수가 올바르게 설정되었는가?

## 🔧 수동 배포 (Wrangler CLI)

GitHub 연동 없이 로컬에서 직접 배포하는 방법:

### 사전 준비

```bash
# Wrangler CLI 설치 (이미 설치됨)
npm install -g wrangler

# Cloudflare 로그인
npx wrangler login
```

### 배포 명령어

```bash
# 프로젝트 빌드
npm run build

# Cloudflare Pages에 배포
npx wrangler pages deploy .next --project-name=superplace_study
```

## 🔄 자동 배포 설정

GitHub에 푸시하면 자동으로 배포됩니다:

1. **프로덕션 배포**
   - `main` 브랜치에 푸시하면 자동 배포
   - URL: `https://superplace-study.pages.dev`

2. **프리뷰 배포**
   - 다른 브랜치에 푸시하면 프리뷰 URL 생성
   - 예: `https://abc123.superplace-study.pages.dev`

## 🐛 문제 해결

### 빌드 실패 시

**1. Node.js 버전 확인**
```bash
# Cloudflare Pages는 Node.js 18+ 필요
# package.json에 추가:
"engines": {
  "node": ">=18.0.0"
}
```

**2. 빌드 타임아웃**
- 빌드 명령을 최적화하거나
- 불필요한 의존성 제거

**3. 환경 변수 오류**
- Cloudflare Dashboard에서 환경 변수가 올바르게 설정되었는지 확인

### 데이터베이스 연결 오류

**SQLite 사용 시**:
- Cloudflare Pages에서는 파일 시스템 접근이 제한됨
- D1 (Cloudflare의 SQLite) 또는 외부 데이터베이스 사용 권장

**PostgreSQL/MySQL 사용 시**:
- CONNECTION_LIMIT를 줄여보세요
- 연결 풀링 설정 확인

## 📚 추가 리소스

- [Cloudflare Pages 문서](https://developers.cloudflare.com/pages/)
- [Next.js on Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)
- [Cloudflare D1 문서](https://developers.cloudflare.com/d1/)
- [Wrangler CLI 문서](https://developers.cloudflare.com/workers/wrangler/)

## 📞 지원

문제가 발생하면:
1. Cloudflare Dashboard의 빌드 로그 확인
2. GitHub Issues에 문의
3. Cloudflare Discord 커뮤니티 참여

---

**마지막 업데이트**: 2024-01-18
**작성자**: GenSpark AI Developer
