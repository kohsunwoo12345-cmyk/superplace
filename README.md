# SUPER PLACE - 마케팅 플랫폼

통합 소셜미디어 마케팅 모니터링 및 관리 플랫폼

## 주요 기능

### 🔐 인증 및 사용자 관리
- 회원가입 / 로그인 시스템
- NextAuth.js 기반 인증
- 역할 기반 접근 제어 (USER, ADMIN, SUPERADMIN)

### 📊 플랫폼 연동
- **네이버 블로그**: 게시글 모니터링, 조회수/좋아요/댓글 추적
- **네이버 플레이스**: 리뷰 관리, 평점 모니터링
- **인스타그램**: 게시물 분석, 참여도 추적
- **유튜브**: 비디오 통계, 구독자 분석
- **틱톡**: 비디오 성과, 인게이지먼트 추적
- **당근마켓**: 상품 조회수, 채팅/좋아요 관리

### 💳 결제 시스템
- 토스페이먼츠 연동
- 구독 관리 (FREE, BASIC, PREMIUM, ENTERPRISE)
- 자동 갱신 기능
- 결제 내역 관리

### 📈 실시간 모니터링
- 통합 대시보드
- 실시간 데이터 동기화
- 플랫폼별 성과 지표
- 최근 활동 추적

### 📑 분석 및 리포트
- 통합 분석 도구
- 맞춤형 리포트 생성
- 데이터 시각화
- 성과 비교

## 기술 스택

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **ORM**: Prisma
- **Database**: SQLite (개발용) / PostgreSQL (프로덕션)
- **Authentication**: NextAuth.js

### API 연동
- Naver Open API
- Instagram Graph API
- YouTube Data API v3
- TikTok API v2
- 토스페이먼츠 API

## 설치 및 실행

### 1. 의존성 설치

\`\`\`bash
npm install
\`\`\`

### 2. 환경 변수 설정

\`.env\` 파일을 생성하고 다음 값들을 설정하세요:

\`\`\`env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/superplace"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key"

# Naver API
NAVER_CLIENT_ID="your-naver-client-id"
NAVER_CLIENT_SECRET="your-naver-client-secret"

# Instagram API
INSTAGRAM_CLIENT_ID="your-instagram-client-id"
INSTAGRAM_CLIENT_SECRET="your-instagram-client-secret"

# YouTube API
YOUTUBE_API_KEY="your-youtube-api-key"

# TikTok API
TIKTOK_CLIENT_KEY="your-tiktok-client-key"
TIKTOK_CLIENT_SECRET="your-tiktok-client-secret"

# Toss Payments
TOSS_CLIENT_KEY="your-toss-client-key"
TOSS_SECRET_KEY="your-toss-secret-key"

# Karrot (당근) API
KARROT_API_KEY="your-karrot-api-key"
\`\`\`

### 3. 데이터베이스 설정

\`\`\`bash
# Prisma 클라이언트 생성 및 데이터베이스 동기화
npx prisma generate
npx prisma db push

# Prisma Studio 실행 (선택사항)
npm run db:studio
\`\`\`

**참고**: 현재 SQLite를 사용하여 즉시 실행 가능합니다. 별도의 데이터베이스 서버 설치가 필요 없습니다!

### 4. 개발 서버 실행

\`\`\`bash
npm run dev
\`\`\`

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 5. 회원가입 테스트

회원가입 기능이 정상 작동하는지 테스트:

**브라우저에서:**
1. http://localhost:3000/register 접속
2. 회원정보 입력 (이메일, 비밀번호, 이름 등)
3. "회원가입" 버튼 클릭
4. 성공 시 로그인 페이지로 리다이렉트

**API 테스트 (curl):**
\`\`\`bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "홍길동",
    "phone": "010-1234-5678",
    "company": "테스트 회사"
  }'
\`\`\`

성공 응답:
\`\`\`json
{
  "message": "회원가입이 완료되었습니다",
  "user": {
    "id": "...",
    "email": "user@example.com",
    "name": "홍길동",
    "createdAt": "..."
  }
}
\`\`\`

## 프로젝트 구조

\`\`\`
webapp/
├── prisma/
│   └── schema.prisma          # 데이터베이스 스키마
├── public/                    # 정적 파일
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/           # 인증 페이지
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── api/              # API Routes
│   │   │   ├── auth/
│   │   │   ├── payment/
│   │   │   └── register/
│   │   ├── dashboard/        # 대시보드 페이지
│   │   │   ├── analytics/
│   │   │   ├── naver-blog/
│   │   │   ├── naver-place/
│   │   │   ├── instagram/
│   │   │   ├── youtube/
│   │   │   ├── tiktok/
│   │   │   ├── karrot/
│   │   │   └── subscription/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx           # 랜딩 페이지
│   ├── components/            # React 컴포넌트
│   │   ├── dashboard/
│   │   └── ui/
│   ├── lib/                   # 유틸리티 함수
│   │   ├── auth.ts
│   │   ├── prisma.ts
│   │   └── utils.ts
│   ├── services/              # API 서비스
│   │   ├── naver.ts
│   │   ├── instagram.ts
│   │   ├── youtube.ts
│   │   ├── tiktok.ts
│   │   └── payment.ts
│   └── types/                 # TypeScript 타입
├── .env                       # 환경 변수
├── .env.example              # 환경 변수 예제
├── next.config.js            # Next.js 설정
├── package.json
├── tailwind.config.ts        # Tailwind 설정
└── tsconfig.json             # TypeScript 설정
\`\`\`

## API 키 발급 가이드

### Naver API
1. [네이버 개발자 센터](https://developers.naver.com) 방문
2. 애플리케이션 등록
3. Client ID 및 Client Secret 발급

### Instagram API
1. [Meta for Developers](https://developers.facebook.com) 방문
2. 앱 생성 및 Instagram Graph API 활성화
3. 액세스 토큰 발급

### YouTube API
1. [Google Cloud Console](https://console.cloud.google.com) 방문
2. 프로젝트 생성 및 YouTube Data API v3 활성화
3. API 키 발급

### TikTok API
1. [TikTok for Developers](https://developers.tiktok.com) 방문
2. 앱 등록 및 권한 요청
3. Client Key 및 Secret 발급

### 토스페이먼츠
1. [토스페이먼츠](https://www.tosspayments.com) 가입
2. 개발자 센터에서 API 키 발급
3. 테스트/운영 키 설정

## 주요 페이지

### 랜딩 페이지 (`/`)
- 서비스 소개
- 주요 기능 안내
- 요금제 정보

### 로그인 (`/login`)
- 이메일/비밀번호 로그인
- 비밀번호 찾기

### 회원가입 (`/register`)
- 신규 사용자 등록
- 이메일 인증

### 대시보드 (`/dashboard`)
- 통합 성과 대시보드
- 플랫폼별 현황
- 최근 활동 내역

### 플랫폼별 페이지
- `/dashboard/naver-blog` - 네이버 블로그 관리
- `/dashboard/naver-place` - 네이버 플레이스 관리
- `/dashboard/instagram` - 인스타그램 관리
- `/dashboard/youtube` - 유튜브 관리
- `/dashboard/tiktok` - 틱톡 관리
- `/dashboard/karrot` - 당근마켓 관리

### 구독 관리 (`/dashboard/subscription`)
- 플랜 선택 및 변경
- 결제 처리
- 결제 내역 조회

## 데이터베이스 스키마

### 주요 모델
- **User**: 사용자 정보
- **Subscription**: 구독 정보
- **Payment**: 결제 내역
- **NaverBlog / NaverPlace**: 네이버 플랫폼 연동
- **Instagram / Youtube / TikTok / Karrot**: 각 플랫폼 연동
- **Analytics**: 통합 분석 데이터

## 보안

- 비밀번호 암호화 (bcrypt)
- JWT 기반 세션 관리
- CSRF 보호
- SQL Injection 방지 (Prisma ORM)
- XSS 방지
- 환경 변수를 통한 민감 정보 관리

## 배포

### Vercel 배포
\`\`\`bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
\`\`\`

### Docker 배포
\`\`\`dockerfile
# Dockerfile 생성 후
docker build -t superplace .
docker run -p 3000:3000 superplace
\`\`\`

## 라이선스

MIT License

## 문의

프로젝트 관련 문의사항은 이슈를 통해 남겨주세요.

---

© 2024 SUPER PLACE. All rights reserved.
