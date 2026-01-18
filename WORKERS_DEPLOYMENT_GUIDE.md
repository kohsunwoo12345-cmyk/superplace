# 🔧 Cloudflare Workers 생성 가이드

> Cloudflare Workers에서 Next.js 프로젝트를 배포하는 방법

---

## ⚠️ 중요: Workers vs Pages

**현재 프로젝트는 Next.js이므로 Cloudflare Pages를 사용하는 것이 권장됩니다.**

하지만 Workers를 사용하시려면 아래 가이드를 따라주세요.

---

## 📋 Cloudflare Workers 설정 양식

### 1️⃣ Workers 생성 화면

**경로**: Cloudflare Dashboard > Workers & Pages > Create application > Create Worker

---

## 🔨 빌드 명령 (Build command)

**입력하지 않음** (비워둠)

> Workers는 빌드를 로컬에서 완료한 후 업로드하는 방식입니다.

---

## 🚀 배포 명령 (Deploy command)

```bash
npx wrangler deploy
```

> 또는 프로젝트에 따라:
```bash
npx wrangler pages deploy .next --project-name=superplace_study
```

---

## 📦 실제 배포 방법 (로컬에서)

Cloudflare Workers는 GUI가 아닌 **CLI(명령줄)**를 통해 배포합니다.

### Step 1: 로컬에서 빌드
```bash
cd /home/user/webapp
npm run build
```

### Step 2: Wrangler 로그인
```bash
npx wrangler login
```
- 브라우저가 열리고 Cloudflare 로그인 요청
- 승인하면 CLI가 인증됨

### Step 3: 배포 실행
```bash
npx wrangler pages deploy .next --project-name=superplace_study
```

---

## 🔐 환경 변수 설정 (Workers)

### 방법 1: wrangler.toml 파일에 추가

프로젝트에 이미 `wrangler.toml` 파일이 있습니다:

```toml
name = "superplace-study"
compatibility_date = "2024-01-18"
pages_build_output_dir = ".vercel/output/static"

[env.production]
compatibility_flags = ["nodejs_compat"]

[env.preview]
compatibility_flags = ["nodejs_compat"]
```

**환경 변수를 추가하려면:**

```toml
name = "superplace-study"
compatibility_date = "2024-01-18"
pages_build_output_dir = ".next"

# 환경 변수 (보안에 민감하지 않은 것만)
[vars]
NEXT_PUBLIC_APP_URL = "https://superplace-study.pages.dev"

[env.production]
compatibility_flags = ["nodejs_compat"]

[env.preview]
compatibility_flags = ["nodejs_compat"]
```

### 방법 2: CLI로 비밀 변수 추가 (권장)

보안이 중요한 변수는 CLI로 추가:

```bash
# DATABASE_URL 추가
npx wrangler pages secret put DATABASE_URL
# 프롬프트가 나오면 값 입력: file:./prisma/dev.db

# NEXTAUTH_URL 추가
npx wrangler pages secret put NEXTAUTH_URL
# 프롬프트가 나오면 값 입력: https://superplace-study.pages.dev

# NEXTAUTH_SECRET 추가
npx wrangler pages secret put NEXTAUTH_SECRET
# 프롬프트가 나오면 생성한 비밀 키 입력
```

### 방법 3: Dashboard에서 추가

1. Cloudflare Dashboard 접속
2. Workers & Pages > 프로젝트 선택
3. Settings > Variables and Secrets
4. Add variable 클릭

---

## 📝 변수 이름과 값 목록

### 필수 환경 변수

| 변수 이름 | 변수 값 | 설정 방법 |
|----------|---------|----------|
| `DATABASE_URL` | `file:./prisma/dev.db` | CLI 또는 Dashboard |
| `NEXTAUTH_URL` | `https://superplace-study.pages.dev` | CLI 또는 Dashboard |
| `NEXTAUTH_SECRET` | [생성한 32자 비밀 키] | CLI 또는 Dashboard (비밀) |

### 선택 환경 변수

| 변수 이름 | 변수 값 | 용도 |
|----------|---------|------|
| `OPENAI_API_KEY` | `sk-...` | AI 기능 |
| `NAVER_CLIENT_ID` | `your_client_id` | 네이버 API |
| `NAVER_CLIENT_SECRET` | `your_client_secret` | 네이버 API |

---

## 🎯 추천: Cloudflare Pages 사용

**Next.js 프로젝트는 Cloudflare Pages가 더 적합합니다!**

### Pages를 사용해야 하는 이유:
- ✅ GUI에서 쉽게 설정 가능
- ✅ GitHub 자동 배포 지원
- ✅ Next.js 완벽 지원
- ✅ 무료 티어로 충분
- ✅ 빌드 자동화

### Workers를 사용하는 경우:
- 🔧 커스텀 로직이 필요할 때
- 🔧 서버리스 함수만 필요할 때
- 🔧 Edge에서 실행해야 할 때

---

## 💡 결론: 어떤 걸 선택해야 하나?

### 👉 Cloudflare Pages 선택 (권장)

**이유:**
- Next.js 프로젝트에 최적화
- 설정이 더 쉬움
- GitHub 연동으로 자동 배포
- GUI에서 모든 설정 가능

**설정 방법:**
`DEPLOYMENT_FOR_BEGINNERS.md` 참조

### 👉 Cloudflare Workers 선택

**이유:**
- 더 많은 제어가 필요함
- 커스텀 로직 필요
- CLI 환경에 익숙함

**설정 방법:**
아래 CLI 가이드 참조

---

## 🚀 CLI로 배포하기 (Workers/Pages 공통)

### 1단계: Wrangler 설치 확인
```bash
npx wrangler --version
```

### 2단계: Cloudflare 로그인
```bash
npx wrangler login
```
- 브라우저가 열리고 로그인 요청
- "Allow" 버튼 클릭

### 3단계: 프로젝트 빌드
```bash
cd /home/user/webapp
npm run build
```

### 4단계: Pages에 배포
```bash
npx wrangler pages deploy .next --project-name=superplace_study
```

### 5단계: 환경 변수 추가
```bash
# 비밀 변수 추가
npx wrangler pages secret put DATABASE_URL --project-name=superplace_study
npx wrangler pages secret put NEXTAUTH_URL --project-name=superplace_study
npx wrangler pages secret put NEXTAUTH_SECRET --project-name=superplace_study
```

---

## 📋 빠른 참조

### Cloudflare Dashboard 양식 입력

**Workers 생성 시:**
```
Worker 이름: superplace-study
```

**변수 추가 (Settings > Variables and Secrets):**

| 변수 이름 | 타입 | 값 |
|----------|------|-----|
| DATABASE_URL | Secret | `file:./prisma/dev.db` |
| NEXTAUTH_URL | Variable | `https://superplace-study.pages.dev` |
| NEXTAUTH_SECRET | Secret | [생성한 비밀 키] |

---

## ⚠️ 중요 팁

### 1. Secret vs Variable
- **Secret**: 비밀번호, API 키 등 민감한 정보
- **Variable**: 공개되어도 괜찮은 정보

### 2. 프로젝트 이름
- Dashboard에서: `superplace-study` (하이픈)
- CLI에서: `superplace_study` (언더바도 가능)

### 3. 환경 변수 형식
```bash
# CLI에서 입력할 때 따옴표 없이 입력
DATABASE_URL
file:./prisma/dev.db

# Dashboard에서는 입력창에 그대로 입력
```

---

## 🆘 문제 해결

### "Project not found" 에러
```bash
# 프로젝트 이름 확인
npx wrangler pages project list

# 올바른 이름으로 다시 시도
npx wrangler pages deploy .next --project-name=[실제-프로젝트-이름]
```

### 인증 실패
```bash
# 다시 로그인
npx wrangler logout
npx wrangler login
```

### 빌드 실패
```bash
# 캐시 삭제 후 재빌드
rm -rf .next
npm run build
```

---

## 📞 어떤 방법을 선택하시나요?

**1. GUI로 쉽게 배포하고 싶다면:**
- → `DEPLOYMENT_FOR_BEGINNERS.md` 참조
- → Cloudflare Pages 사용

**2. CLI로 직접 배포하고 싶다면:**
- → 위의 "CLI로 배포하기" 섹션 참조
- → `npx wrangler` 명령어 사용

**3. 자동 배포를 원한다면:**
- → GitHub 연동으로 Pages 사용
- → 코드 푸시하면 자동 배포

---

**어떤 방법을 선택하시겠어요? 더 자세히 알려드릴까요?** 😊
