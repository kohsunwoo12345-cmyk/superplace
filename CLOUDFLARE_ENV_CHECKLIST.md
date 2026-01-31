# CloudFlare Pages 환경 변수 체크리스트

## 필수 환경 변수 (반드시 설정)

### 1. DATABASE_URL
```
postgresql://username:password@host.region.neon.tech:5432/database?sslmode=require
```
- **용도**: PostgreSQL 데이터베이스 연결
- **발급처**: Neon (https://neon.tech) 또는 Supabase (https://supabase.com)
- ⚠️ **중요**: `?sslmode=require` 파라미터 필수

### 2. NEXTAUTH_URL
```
https://superplace-study.pages.dev
```
- **용도**: NextAuth.js 인증 URL
- **설정값**: 배포된 CloudFlare Pages URL
- 커스텀 도메인 사용 시: `https://your-domain.com`

### 3. NEXTAUTH_SECRET
```
생성 명령어: openssl rand -base64 32
```
- **용도**: NextAuth.js 세션 암호화 키
- **요구사항**: 최소 32자 이상의 무작위 문자열
- **온라인 생성기**: https://generate-secret.vercel.app/32

### 4. GOOGLE_GEMINI_API_KEY
```
AIzaSyD1234567890abcdefghijklmnopqrstuvwx
```
- **용도**: Google Gemini AI API 호출
- **발급처**: https://aistudio.google.com/app/apikey

### 5. GEMINI_API_KEY
```
AIzaSyD1234567890abcdefghijklmnopqrstuvwx (GOOGLE_GEMINI_API_KEY와 동일)
```
- **용도**: Google Gemini AI API 호출 (백업)
- **설정값**: GOOGLE_GEMINI_API_KEY와 동일한 값

---

## 선택적 환경 변수

### 6. OPENAI_API_KEY (선택)
```
sk-1234567890abcdefghijklmnopqrstuvwxyz
```
- **용도**: OpenAI API 호출 (GPT 모델 사용 시)
- **발급처**: https://platform.openai.com/api-keys

### 7. NAVER_CLIENT_ID (선택)
```
your_client_id
```
- **용도**: 네이버 API 호출
- **발급처**: https://developers.naver.com/apps/#/register

### 8. NAVER_CLIENT_SECRET (선택)
```
your_client_secret
```
- **용도**: 네이버 API 호출
- **발급처**: NAVER_CLIENT_ID와 함께 발급

---

## 환경 변수 설정 방법

### CloudFlare Dashboard에서 설정
1. https://dash.cloudflare.com/ 로그인
2. **Workers & Pages** 선택
3. **superplace-study** 프로젝트 선택
4. **Settings** 탭 클릭
5. **Environment variables** 섹션으로 이동
6. **Add variable** 버튼 클릭
7. Variable name과 Value 입력
8. 적용 환경 선택:
   - ✅ **Production** (필수)
   - ⚠️ **Preview** (선택)

---

## 설정 완료 체크리스트

배포 전 확인:
- [ ] DATABASE_URL 설정 완료
- [ ] NEXTAUTH_URL 설정 완료 (배포된 도메인)
- [ ] NEXTAUTH_SECRET 생성 및 설정 완료 (최소 32자)
- [ ] GOOGLE_GEMINI_API_KEY 설정 완료
- [ ] GEMINI_API_KEY 설정 완료 (GOOGLE_GEMINI_API_KEY와 동일)
- [ ] 모든 환경 변수가 Production 환경에 적용됨
- [ ] 데이터베이스 마이그레이션 완료 (`npx prisma db push`)

배포 후 확인:
- [ ] 메인 페이지 로드 정상
- [ ] 로그인/회원가입 기능 정상
- [ ] 데이터베이스 연결 정상
- [ ] AI 기능 정상 (Gemini API)

---

## 빠른 복사 템플릿

```env
# 필수 환경 변수
DATABASE_URL=postgresql://username:password@host.region.neon.tech:5432/database?sslmode=require
NEXTAUTH_URL=https://superplace-study.pages.dev
NEXTAUTH_SECRET=[openssl rand -base64 32로 생성한 값]
GOOGLE_GEMINI_API_KEY=[Google AI Studio에서 발급]
GEMINI_API_KEY=[GOOGLE_GEMINI_API_KEY와 동일]

# 선택적 환경 변수
OPENAI_API_KEY=sk-[선택사항]
NAVER_CLIENT_ID=[선택사항]
NAVER_CLIENT_SECRET=[선택사항]
```

---

**작성자**: GenSpark AI Developer  
**최종 업데이트**: 2025-01-31
