# SUPER PLACE - AI 기반 통합 마케팅 플랫폼

> 인공지능으로 모든 소셜미디어 플랫폼을 하나로 관리하는 차세대 마케팅 솔루션

## 🌟 주요 기능

### 1. 학원 관리 시스템 (LMS)
- **역할 기반 접근 제어**: SUPER_ADMIN, DIRECTOR, TEACHER, STUDENT
- **학원 자동 생성**: 학원장 가입 시 자동으로 학원 생성 및 초대 코드 발급
- **선생님/학생 관리**: 승인 워크플로우, AI 봇 권한 부여
- **수업 관리**: 수업 생성, 학생 등록, 시간표 설정 (요일별, 과목별)
- **출석 관리**: 일별 출석 체크, 실시간 통계 (출석/결석/지각/조퇴)
- **학생 상세 페이지**: 학습 진도, 과제 이력, 성적 추이, AI 사용 내역

### 2. 관리자 시스템
- **사용자 관리**: 전체 사용자 목록, 검색/필터, 상세 조회
- **포인트 시스템**: 포인트 지급/회수, 이력 관리
- **AI 권한 관리**: 학생별 AI 봇 권한 부여 (채팅, 숙제, 학습)
- **비밀번호 관리**: 관리자가 사용자 비밀번호 변경 가능
- **Impersonation**: 관리자가 다른 사용자로 로그인하여 확인

### 3. 학원 설정
- **학원 정보 관리**: 이름, 설명, 주소, 연락처 수정
- **초대 코드**: 선생님/학생 초대용 코드 자동 생성 및 복사
- **요금제 정보**: 현재 플랜, 제한 정보, 사용 통계
- **학원 통계**: 등록된 사용자 수, 활성 상태

## 🚀 기술 스택

### Frontend
- **Next.js 15** (App Router)
- **React 18** (TypeScript)
- **Tailwind CSS** + **Radix UI** (shadcn/ui)
- **Recharts** (데이터 시각화)
- **Lucide React** (아이콘)

### Backend
- **Next.js API Routes**
- **Prisma ORM** + **PostgreSQL**
- **NextAuth.js** (JWT 기반 인증)
- **bcrypt** (비밀번호 암호화)

### AI
- **Google Generative AI** (Gemini API)
- OpenAI API (선택)

### 배포
- **Vercel** (프론트엔드 & API)
- **Neon/Supabase/Vercel Postgres** (데이터베이스)

## 📦 설치 및 실행

### 1. 저장소 클론
```bash
git clone https://github.com/kohsunwoo12345-cmyk/superplace.git
cd superplace
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 설정하세요:

```env
# Database (PostgreSQL for production)
DATABASE_URL="postgresql://user:password@host:5432/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this"

# Google Generative AI (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-key"

# OpenAI API (선택)
OPENAI_API_KEY="sk-..."

# Naver API (선택)
NAVER_CLIENT_ID="your-naver-client-id"
NAVER_CLIENT_SECRET="your-naver-client-secret"
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

## 🚀 Vercel 배포

### 1. Vercel 설치
```bash
npm install -g vercel
```

### 2. Vercel 로그인
```bash
vercel login
```

### 3. 환경 변수 설정
Vercel 대시보드 또는 CLI로 환경 변수를 설정하세요:

```bash
vercel env add DATABASE_URL
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
vercel env add GOOGLE_GENERATIVE_AI_API_KEY
```

또는 Vercel 대시보드에서:
1. 프로젝트 설정 → Environment Variables
2. 다음 환경 변수들을 추가:
   - `DATABASE_URL`: PostgreSQL 연결 문자열 (Vercel Postgres, Neon, Supabase 등)
   - `NEXTAUTH_URL`: 배포된 도메인 (예: https://your-app.vercel.app)
   - `NEXTAUTH_SECRET`: 무작위 문자열 (openssl rand -base64 32)
   - `GOOGLE_GENERATIVE_AI_API_KEY`: Google AI API 키

### 4. 데이터베이스 설정 (Production)

**옵션 1: Vercel Postgres**
```bash
# Vercel 대시보드에서 Postgres 추가
vercel postgres create
```

**옵션 2: Neon (추천)**
1. [Neon Console](https://console.neon.tech/)에서 프로젝트 생성
2. 연결 문자열 복사
3. Vercel 환경 변수에 `DATABASE_URL` 추가

**옵션 3: Supabase**
1. [Supabase](https://supabase.com/)에서 프로젝트 생성
2. Database 설정에서 연결 문자열 복사
3. Vercel 환경 변수에 `DATABASE_URL` 추가

### 5. 배포
```bash
# 첫 배포
vercel

# Production 배포
vercel --prod
```

### 6. 배포 후 데이터베이스 마이그레이션
```bash
# Vercel CLI로 프로덕션 환경에서 실행
vercel env pull .env.production
npx prisma db push
```

### 배포 체크리스트
- [ ] PostgreSQL 데이터베이스 준비
- [ ] 모든 환경 변수 설정
- [ ] `DATABASE_URL` 연결 확인
- [ ] `NEXTAUTH_URL`을 프로덕션 도메인으로 설정
- [ ] `NEXTAUTH_SECRET` 강력한 키로 생성
- [ ] Prisma 마이그레이션 완료
- [ ] 빌드 오류 확인
- [ ] 배포 후 로그인/회원가입 테스트

## 👤 사용자 관리

### 역할별 회원가입
1. `/auth/signup` 페이지에서 역할 선택:
   - **DIRECTOR**: 학원장 (학원 자동 생성)
   - **TEACHER**: 선생님 (학원 코드 필요)
   - **STUDENT**: 학생 (학원 코드 필요)
2. 이메일, 비밀번호, 이름 입력
3. 선생님/학생은 학원 코드 입력 필요
4. 가입 후 학원장 승인 대기

### 역할 종류
- **SUPER_ADMIN**: 최고 관리자 (전체 시스템 관리)
  - 모든 학원 및 사용자 관리
  - 사용자 포인트 지급/회수
  - AI 봇 권한 부여
  - Impersonation (다른 사용자로 로그인)
  
- **DIRECTOR**: 학원장
  - 소속 학원의 선생님/학생 관리
  - 수업 생성 및 관리
  - 출석 체크
  - 학원 설정 및 초대 코드 관리
  
- **TEACHER**: 선생님
  - 소속 학원의 학생 조회
  - 담당 수업의 출석 체크
  - 과제 및 성적 관리
  
- **STUDENT**: 학생
  - 내 학습 진도 확인
  - 과제 제출
  - AI 도우미 사용 (권한 부여 시)

## 🎨 페이지 구조

### 공개 페이지
- `/` - 메인 랜딩 페이지
- `/about` - 회사 소개
- `/auth/signin` - 로그인
- `/auth/signup` - 회원가입 (역할 선택)

### 관리자 대시보드 (SUPER_ADMIN)
- `/dashboard/admin/users` - 사용자 관리
- `/dashboard/admin/users/[id]` - 사용자 상세 (포인트, AI 권한, 비밀번호 변경)
- `/dashboard/academies` - 학원 관리
- `/dashboard/plans` - 요금제 관리
- `/dashboard/contacts` - 문의 관리
- `/dashboard/stats` - 전체 통계

### 학원장 대시보드 (DIRECTOR)
- `/dashboard` - 학원 대시보드
- `/dashboard/teachers` - 선생님 관리 (승인/거부)
- `/dashboard/students` - 학생 관리 (승인/거부, AI 봇 권한)
- `/dashboard/students/[id]` - 학생 상세 (학습 진도, 과제, 성적, AI 사용 내역)
- `/dashboard/classes` - 수업 관리 (생성, 수정, 삭제)
- `/dashboard/classes/[id]` - 수업 상세 (학생 등록, 시간표 설정)
- `/dashboard/attendance` - 출석 관리 (일별 출석 체크, 통계)
- `/dashboard/materials` - 학습 자료
- `/dashboard/assignments` - 과제 관리
- `/dashboard/grades` - 성적 관리
- `/dashboard/analytics` - 학원 통계
- `/dashboard/academy-settings` - 학원 설정 (정보 수정, 초대 코드)
- `/dashboard/settings` - 개인 설정

### 선생님 대시보드 (TEACHER)
- `/dashboard` - 내 대시보드
- `/dashboard/students` - 학생 목록
- `/dashboard/classes` - 담당 수업
- `/dashboard/attendance` - 출석 체크
- `/dashboard/materials` - 학습 자료
- `/dashboard/assignments` - 과제 관리
- `/dashboard/grades` - 성적 입력
- `/dashboard/settings` - 개인 설정

### 학생 대시보드 (STUDENT)
- `/dashboard` - 내 대시보드
- `/dashboard/my-learning` - 내 학습
- `/dashboard/materials` - 학습 자료
- `/dashboard/my-assignments` - 내 과제
- `/dashboard/my-grades` - 내 성적
- `/dashboard/ai-assistant` - AI 도우미 (권한 부여 시)
- `/dashboard/settings` - 개인 설정

## 🤖 AI 기능

### Google Generative AI (Gemini) 설정
1. [Google AI Studio](https://makersuite.google.com/app/apikey)에서 API 키 발급
2. `.env` 파일에 `GOOGLE_GENERATIVE_AI_API_KEY` 설정
3. 애플리케이션 재시작

### AI 봇 권한 부여
- 학원장 또는 관리자가 학생별로 AI 봇 권한 부여
- **AI 채팅 봇**: 일반 학습 상담 및 질문 응답
- **AI 숙제 도우미**: 숙제 문제 해결 지원
- **AI 학습 도우미**: 학습 계획 및 진도 관리

## 🔐 보안

- **비밀번호**: bcrypt로 암호화 저장
- **세션**: JWT 기반 무상태 인증
- **API 키**: 환경 변수로 안전하게 관리
- **역할 기반 접근 제어**: USER, ADMIN, SUPERADMIN

## 🎯 실제 사용 시나리오

### 1. 학원장 - 학원 개설 및 운영
```
1. 학원장으로 회원가입
   → 학원 자동 생성 및 초대 코드 발급
2. 학원 설정에서 학원 정보 입력
   → 이름, 주소, 연락처 등
3. 선생님/학생에게 초대 코드 공유
4. 승인 요청 확인 및 승인
5. 수업 생성 및 학생 배정
6. 시간표 설정 (요일별, 과목별)
7. AI 봇 권한 부여 (필요한 학생에게)
```

### 2. 선생님 - 수업 및 출석 관리
```
1. 학원 코드로 선생님 가입
2. 학원장 승인 대기
3. 로그인 후 담당 수업 확인
4. 출석 관리 메뉴에서 수업 선택
5. 날짜 선택 (오늘/이전/다음)
6. 각 학생의 출석 체크
   → 출석/결석/지각/조퇴
7. 실시간 통계 확인
```

### 3. 학생 - 학습 및 AI 도우미 활용
```
1. 학원 코드로 학생 가입
2. 학원장 승인 대기
3. 로그인 후 내 대시보드 확인
4. 내 학습 진도 확인
5. 과제 제출
6. AI 도우미 사용 (권한 부여 시)
   → 학습 도우미, 숙제 도우미
7. 내 성적 확인
```

### 4. 관리자 - 시스템 관리
```
1. SUPER_ADMIN으로 로그인
2. 사용자 관리에서 전체 사용자 조회
3. 사용자 상세에서 정보 확인
   → 학습 진도, 포인트, AI 사용 내역
4. 포인트 지급/회수
5. AI 봇 권한 부여/회수
6. 비밀번호 변경 (필요 시)
7. Impersonation으로 사용자 환경 확인
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

### 학원 관리 시스템
- [x] 역할 기반 회원가입 (학원장/선생님/학생)
- [x] 학원 자동 생성 및 초대 코드
- [x] 선생님/학생 관리 (승인 워크플로우)
- [x] 수업 관리 (생성, 학생 등록, 시간표)
- [x] 출석 관리 (일별 체크, 통계)
- [x] 학생 상세 페이지 (진도, 과제, 성적, AI 사용)
- [x] 학원 설정 페이지
- [ ] 과제 관리 시스템 (생성, 제출, 채점)
- [ ] 성적 관리 시스템 (시험, 과목별 통계)
- [ ] 과목별 대시보드
- [ ] 문의 관리 시스템

### AI 기능
- [x] Google Gemini API 연동
- [ ] AI 학습 도우미 (학생용)
- [ ] AI 숙제 도우미
- [ ] AI 성적 분석 및 추천
- [ ] AI 자동 응답 시스템

### 시스템 개선
- [ ] 실시간 알림 시스템
- [ ] 모바일 앱 개발
- [ ] 다국어 지원
- [ ] 팀 협업 기능
- [ ] 고급 분석 대시보드
- [ ] 엑셀 내보내기 기능

## 📄 라이선스

Copyright © 2024-2025 SUPER PLACE. All rights reserved.

---

**버전**: 2.0.0  
**최종 업데이트**: 2025년 1월  
**GitHub**: https://github.com/kohsunwoo12345-cmyk/superplace

AI 기반 학원 관리 시스템으로 교육을 혁신하세요! 🚀
