# SUPER PLACE - AI 기반 통합 마케팅 플랫폼

> 인공지능으로 모든 소셜미디어 플랫폼을 하나로 관리하는 차세대 마케팅 솔루션

## 🌟 주요 기능

### 1. AI 콘텐츠 생성
- **네이버 블로그**: AI가 SEO 최적화된 블로그 포스트 자동 생성
- **Instagram**: 매력적인 캡션과 해시태그 자동 생성
- **YouTube**: SEO 최적화된 제목, 설명, 태그 생성
- **TikTok**: 트렌드 분석 및 바이럴 콘텐츠 아이디어 제안
- **당근마켓**: 판매율을 높이는 상품 설명 자동 작성

### 2. AI 분석 및 인사이트
- **감정 분석**: 네이버 플레이스 리뷰의 긍정/부정/중립 자동 분류
- **통합 분석**: 모든 플랫폼의 성과를 한눈에 확인
- **AI 인사이트**: 실시간으로 마케팅 성과 분석 및 개선 방안 제시
- **자동 리포트**: 주간/월간/분기별 마케팅 리포트 AI 자동 생성

### 3. 마케팅 도구
- **키워드 분석**: 네이버 광고 API 연동으로 실시간 키워드 트렌드 분석
- **랜딩페이지 생성**: AI 기반 랜딩페이지 자동 생성
- **통합 대시보드**: 모든 플랫폼의 핵심 지표 실시간 모니터링

## 🚀 기술 스택

### Frontend
- **Next.js 15** (App Router)
- **React 18** (TypeScript)
- **Tailwind CSS** + **Radix UI** (shadcn/ui 패턴)
- **Recharts** (데이터 시각화)
- **SWR** (실시간 데이터 페칭)

### Backend
- **Next.js API Routes**
- **Prisma ORM** + **SQLite**
- **NextAuth.js** (JWT 기반 인증)
- **bcrypt** (비밀번호 암호화)

### AI & APIs
- **OpenAI API** (GPT-4o-mini)
- **Naver Search API** (블로그, 지역 검색)
- **Naver Ad API** (키워드 도구)
- Instagram Graph API (준비 중)
- YouTube Data API v3 (준비 중)
- TikTok API v2 (준비 중)

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd webapp
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 설정하세요:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="your-super-secret-key-change-this"

# OpenAI API (AI 기능용)
OPENAI_API_KEY="sk-..."

# Naver API
NAVER_CLIENT_ID="your-naver-client-id"
NAVER_CLIENT_SECRET="your-naver-client-secret"

# YouTube API
YOUTUBE_API_KEY="your-youtube-api-key"

# Toss Payments
TOSS_CLIENT_KEY="your-toss-client-key"
TOSS_SECRET_KEY="your-toss-secret-key"
```

### 4. 데이터베이스 설정
```bash
# Prisma 마이그레이션
npx prisma db push

# (선택) Prisma Studio로 데이터 확인
npx prisma studio
```

### 5. 개발 서버 실행
```bash
npm run dev
```

애플리케이션이 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

## 👤 사용자 관리

### 회원가입
1. `/register` 페이지에서 이메일과 비밀번호로 가입
2. 기본적으로 `USER` 역할이 부여됨

### 관리자 권한 부여
```bash
node make-admin.js your-email@example.com
```

### 역할 종류
- **USER**: 일반 사용자
- **ADMIN**: 관리자 (통계 조회 가능)
- **SUPERADMIN**: 최고 관리자 (모든 권한)

## 🎨 페이지 구조

### 공개 페이지
- `/` - 메인 랜딩 페이지
- `/about` - 회사 소개
- `/login` - 로그인
- `/register` - 회원가입

### 대시보드 (인증 필요)
- `/dashboard` - 통합 대시보드 (AI 인사이트 포함)
- `/dashboard/tools/naver-keywords` - 키워드 분석
- `/dashboard/tools/landing-page-generator` - 랜딩페이지 생성
- `/dashboard/platforms/naver-blog` - 네이버 블로그 관리
- `/dashboard/platforms/naver-place` - 네이버 플레이스 관리
- `/dashboard/platforms/instagram` - Instagram 관리
- `/dashboard/platforms/youtube` - YouTube 관리
- `/dashboard/tiktok` - TikTok 관리
- `/dashboard/karrot` - 당근마켓 관리
- `/dashboard/analytics` - 통합 분석
- `/dashboard/reports` - 리포트
- `/dashboard/subscription` - 구독 관리
- `/dashboard/settings` - 설정
- `/dashboard/admin` - 관리자 페이지 (관리자 전용)

## 🤖 AI 기능 사용법

### OpenAI API 키 설정
1. [OpenAI Platform](https://platform.openai.com/)에서 API 키 발급
2. `.env` 파일에 `OPENAI_API_KEY` 설정
3. 애플리케이션 재시작

### AI 기능 없이 사용하기
- OpenAI API 키가 없어도 모든 기능 사용 가능
- AI 기능은 샘플 데이터로 대체됨
- 각 페이지에서 "실제 AI" vs "샘플 데이터" 표시

## 📚 API 연동 가이드

### 네이버 API 설정
자세한 가이드는 `COMPLETE_NAVER_API_GUIDE.md` 참조

1. **네이버 Search API** (블로그, 지역 검색)
   - [네이버 개발자 센터](https://developers.naver.com/)에서 애플리케이션 등록
   - Client ID, Client Secret 발급
   - 무료 사용 가능 (일 25,000회)

2. **네이버 Ad API** (키워드 도구)
   - [네이버 광고 API](https://api.naver.com/)에서 신청
   - HMAC SHA256 서명 방식 사용
   - 최소 10,000원 충전 필요

## 🔐 보안

- **비밀번호**: bcrypt로 암호화 저장
- **세션**: JWT 기반 무상태 인증
- **API 키**: 환경 변수로 안전하게 관리
- **역할 기반 접근 제어**: USER, ADMIN, SUPERADMIN

## 🎯 실제 사용 예시

### 1. 블로그 콘텐츠 생성
```
1. "네이버 블로그" 메뉴 클릭
2. 주제 입력: "디지털 마케팅 트렌드"
3. 키워드 입력: "SEO, 콘텐츠 마케팅, SNS"
4. "AI로 콘텐츠 생성하기" 클릭
5. 생성된 제목과 본문 확인/수정
6. "발행하기" 또는 "임시저장" 클릭
```

### 2. 리뷰 감정 분석
```
1. "네이버 플레이스" 메뉴 클릭
2. 분석할 리뷰를 한 줄에 하나씩 입력
3. "AI로 감정 분석하기" 클릭
4. 전체 평가 및 개별 리뷰 감정 확인
5. 인사이트를 바탕으로 개선 방안 도출
```

### 3. Instagram 캡션 생성
```
1. "인스타그램" 메뉴 클릭
2. 게시물 설명 입력
3. 분위기/톤 설정 (선택)
4. "AI로 캡션 & 해시태그 생성하기" 클릭
5. 생성된 캡션과 해시태그 확인
6. "전체 복사"로 Instagram에 바로 붙여넣기
```

## 🏢 회사 정보

**SUPER PLACE**
- 대표이사: 고희준 (Koh Hee-Jun) - 20년 교육 경력, 전 대학 교수
- 마케팅 이사: 고선우 (Koh Sun-Woo) - 통합 마케팅 전문가
- 위치: 인천광역시 서구 청라커넬로 270, 2층

## 📞 지원

### 문제 해결
1. 데이터베이스 초기화: `rm -rf prisma/dev.db && npx prisma db push`
2. 노드 모듈 재설치: `rm -rf node_modules && npm install`
3. 캐시 클리어: `rm -rf .next && npm run dev`

### 개발 도구
- Prisma Studio: `npx prisma studio` (데이터베이스 GUI)
- Type 체크: `npm run build` (빌드 시 타입 검증)

## 🚧 향후 계획

- [ ] 실제 SNS API 연동 (Instagram, TikTok)
- [ ] 스케줄링 기능 (예약 게시)
- [ ] 다국어 지원
- [ ] 모바일 앱 개발
- [ ] 팀 협업 기능
- [ ] AI 자동 응답 시스템
- [ ] 고급 분석 대시보드

## 📄 라이선스

Copyright © 2024 SUPER PLACE. All rights reserved.

---

**버전**: 1.0.0  
**최종 업데이트**: 2024년 12월

AI로 마케팅을 혁신하세요! 🚀
