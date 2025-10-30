# 🔑 네이버 API 완벽 연동 가이드

## 📋 목차
1. [네이버 검색 API (블로그)](#1-네이버-검색-api)
2. [네이버 플레이스 API](#2-네이버-플레이스-api)
3. [네이버 광고 API (키워드 도구)](#3-네이버-광고-api)
4. [실제 코드 적용 방법](#4-실제-코드-적용)

---

## 1. 네이버 검색 API

### 🎯 용도
- 블로그 검색
- 뉴스 검색
- 이미지 검색
- 카페 검색

### 📝 발급 방법

#### STEP 1: 네이버 개발자 센터 접속
```
🌐 https://developers.naver.com
```

#### STEP 2: 애플리케이션 등록
1. "Application" → "애플리케이션 등록" 클릭
2. 애플리케이션 정보 입력:
   - 애플리케이션 이름: `SUPER PLACE 마케팅`
   - 사용 API: `검색` 체크
   - 비로그인 오픈 API 서비스 환경: `WEB 설정` 
   - 웹 서비스 URL: `http://localhost:3000` (개발용)

#### STEP 3: API 키 확인
등록 완료 후 표시되는 정보:
```
Client ID: abcdef1234567890
Client Secret: XYZ123ABC456
```

### 💻 .env 파일 설정
```bash
# 네이버 검색 API
NAVER_CLIENT_ID="abcdef1234567890"
NAVER_CLIENT_SECRET="XYZ123ABC456"
```

### 🧪 테스트 코드
```bash
curl -X GET "https://openapi.naver.com/v1/search/blog.json?query=학원마케팅&display=10" \
  -H "X-Naver-Client-Id: {CLIENT_ID}" \
  -H "X-Naver-Client-Secret: {CLIENT_SECRET}"
```

### ✅ 주요 API 엔드포인트

#### 블로그 검색
```
GET https://openapi.naver.com/v1/search/blog.json
파라미터:
- query: 검색어
- display: 검색 결과 출력 건수 (기본값 10, 최대 100)
- start: 검색 시작 위치 (기본값 1, 최대 1000)
- sort: 정렬 옵션 (sim: 정확도순, date: 날짜순)
```

---

## 2. 네이버 플레이스 API

### 🎯 용도
- 업체/장소 검색
- 리뷰 조회
- 위치 정보

### 📝 발급 방법

#### STEP 1: 네이버 개발자 센터 접속
```
🌐 https://developers.naver.com
```

#### STEP 2: 애플리케이션 등록
1. "Application" → "애플리케이션 등록"
2. 애플리케이션 정보 입력:
   - 사용 API: `지도`, `검색` 체크
   - 서비스 환경: `WEB 설정`

#### STEP 3: API 키는 검색 API와 동일
```
Client ID: (검색 API와 동일)
Client Secret: (검색 API와 동일)
```

### ✅ 주요 API 엔드포인트

#### 지역 검색 (로컬)
```
GET https://openapi.naver.com/v1/search/local.json
파라미터:
- query: 검색어
- display: 검색 결과 출력 건수
- start: 검색 시작 위치
- sort: random (랜덤), comment (리뷰순)
```

### ⚠️ 제한사항
- 네이버 플레이스의 **상세 리뷰 데이터**는 공식 API로 제공되지 않음
- 리뷰 크롤링은 네이버 이용약관 위반 가능
- 대안: 네이버 플레이스 파트너 센터 API (별도 신청 필요)

---

## 3. 네이버 광고 API

### 🎯 용도
- 키워드 검색량 조회
- 경쟁 강도 분석
- 연관 키워드 추천
- 광고 입찰가 정보

### 📝 발급 방법

#### STEP 1: 네이버 광고 계정 생성
```
🌐 https://searchad.naver.com
```

1. **회원가입/로그인**
   - 네이버 계정으로 로그인
   - 사업자 정보 등록 (개인/법인)

2. **광고 계정 개설**
   - 최소 금액 충전: **10,000원 이상**
   - 결제 수단 등록 (신용카드/계좌이체)

#### STEP 2: API 사용 신청

1. **고객센터 접속**
   - 네이버 광고 로그인
   - 상단 메뉴 → "고객센터"

2. **1:1 문의하기**
   - 제목: `광고 API 사용 신청`
   - 내용 예시:
```
안녕하세요.

네이버 검색광고 API 사용을 신청합니다.

[신청 정보]
- 사용 목적: 키워드 분석 도구 개발
- 회사명: SUPER PLACE
- 사업자등록번호: 123-45-67890
- 담당자명: 고선우
- 연락처: 010-8532-8739
- 이메일: kohsunwoo12345@gmail.com

키워드 도구 API 사용 권한 부여 부탁드립니다.
감사합니다.
```

3. **승인 대기**
   - 처리 기간: 1-3 영업일
   - 승인 시 이메일 통보

#### STEP 3: API 인증 정보 확인

승인 후 제공되는 정보:
```
Customer ID: 1234567890
API License: 01000000a1b2c3d4e5f6g7h8
Secret Key: AaBbCcDdEeFfGgHhIiJj123456789=
```

### 💻 .env 파일 설정
```bash
# 네이버 광고 API
NAVER_AD_CUSTOMER_ID="1234567890"
NAVER_AD_API_KEY="01000000a1b2c3d4e5f6g7h8"
NAVER_AD_SECRET_KEY="AaBbCcDdEeFfGgHhIiJj123456789="
```

### 🔐 인증 방식 (HMAC)

네이버 광고 API는 **HMAC SHA256** 서명 인증을 사용합니다.

#### 서명 생성 방법
```javascript
const crypto = require('crypto');

const timestamp = Date.now().toString();
const method = 'GET';
const path = '/keywordstool';
const message = `${timestamp}.${method}.${path}`;

const signature = crypto
  .createHmac('sha256', SECRET_KEY)
  .update(message)
  .digest('base64');
```

#### 요청 헤더
```javascript
headers: {
  'X-Timestamp': timestamp,
  'X-API-KEY': API_KEY,
  'X-Customer': CUSTOMER_ID,
  'X-Signature': signature,
  'Content-Type': 'application/json'
}
```

### ✅ 주요 API 엔드포인트

#### 키워드 도구 API
```
GET https://api.searchad.naver.com/keywordstool
파라미터:
- hintKeywords: 조회할 키워드
- showDetail: 1 (상세 정보 포함)

응답 예시:
{
  "keywordList": [
    {
      "relKeyword": "학원 마케팅",
      "monthlyPcQcCnt": 3450,
      "monthlyMobileQcCnt": 5470,
      "compIdx": 65
    }
  ]
}
```

---

## 4. 실제 코드 적용

### 📁 프로젝트 구조
```
/home/user/webapp/
├── .env                    # API 키 설정 파일
├── src/
│   ├── services/
│   │   ├── naver.ts       # 네이버 검색 API
│   │   ├── naver-ad.ts    # 네이버 광고 API
│   │   └── naver-place.ts # 네이버 플레이스 API
│   └── app/
│       └── api/
│           └── tools/
│               └── naver-keywords/
│                   └── route.ts
```

### 🔧 .env 전체 설정

```bash
# 데이터베이스
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="super-secret-key-for-development"

# ========================================
# 네이버 API 키
# ========================================

# 네이버 검색 API (블로그, 플레이스)
NAVER_CLIENT_ID="발급받은_CLIENT_ID"
NAVER_CLIENT_SECRET="발급받은_CLIENT_SECRET"

# 네이버 광고 API (키워드 도구)
NAVER_AD_CUSTOMER_ID="발급받은_CUSTOMER_ID"
NAVER_AD_API_KEY="발급받은_API_KEY"
NAVER_AD_SECRET_KEY="발급받은_SECRET_KEY"

# ========================================
# 기타 소셜미디어 API
# ========================================

# Instagram Graph API
INSTAGRAM_CLIENT_ID=""
INSTAGRAM_CLIENT_SECRET=""

# YouTube Data API v3
YOUTUBE_API_KEY=""

# TikTok API v2
TIKTOK_CLIENT_KEY=""
TIKTOK_CLIENT_SECRET=""

# 토스페이먼츠
TOSS_CLIENT_KEY=""
TOSS_SECRET_KEY=""

# 당근마켓 API
KARROT_API_KEY=""
```

### 🚀 서버 재시작

API 키 설정 후 반드시 서버를 재시작해야 합니다:

```bash
# 개발 서버 종료 (Ctrl + C)

# 다시 시작
cd /home/user/webapp
npm run dev
```

---

## 5. 테스트 체크리스트

### ✅ 네이버 검색 API
- [ ] 개발자 센터 애플리케이션 등록 완료
- [ ] Client ID, Secret 발급 받음
- [ ] .env 파일에 설정 완료
- [ ] 서버 재시작 완료
- [ ] 블로그 검색 테스트 성공

### ✅ 네이버 광고 API
- [ ] 네이버 광고 계정 생성 (10,000원 충전)
- [ ] 고객센터에 API 사용 신청
- [ ] 승인 완료 (1-3일 소요)
- [ ] API 키 3종 발급 받음
- [ ] .env 파일에 설정 완료
- [ ] 키워드 검색 테스트 성공

---

## 6. 문제 해결

### ❓ Q1: API 키가 작동하지 않아요

**A:** 다음을 확인하세요:

1. **환경 변수 확인**
   ```bash
   # .env 파일 내용 확인
   cat .env | grep NAVER
   ```

2. **따옴표 확인**
   ```bash
   # ✅ 올바른 형식
   NAVER_CLIENT_ID="abcdef123"
   
   # ❌ 잘못된 형식
   NAVER_CLIENT_ID=abcdef123  (따옴표 없음)
   NAVER_CLIENT_ID= "abcdef123" (공백 있음)
   ```

3. **서버 재시작**
   - 환경 변수 변경 후 반드시 재시작

### ❓ Q2: 403 Forbidden 오류

**A:** API 사용 권한 문제:
- 네이버 개발자 센터에서 API 활성화 확인
- 웹 서비스 URL 등록 확인
- 광고 API의 경우 승인 여부 확인

### ❓ Q3: 일일 할당량 초과

**A:** 네이버 API 호출 제한:
- 검색 API: 일일 25,000건
- 광고 API: 계정별 상이

해결책:
- API 호출 최적화
- 캐싱 구현
- 필요시 여러 계정 사용

---

## 7. 보안 권장사항

### 🔒 중요!

1. **API 키 보안**
   ```bash
   # .env 파일은 절대 Git에 올리지 마세요
   # .gitignore에 포함되어 있는지 확인
   
   cat .gitignore | grep .env
   # 출력: .env
   ```

2. **프로덕션 환경**
   - 환경 변수를 서버 설정에 저장
   - Vercel: Environment Variables 섹션
   - AWS: Systems Manager Parameter Store

3. **API 키 정기 갱신**
   - 보안을 위해 3-6개월마다 재발급

---

## 8. 비용 안내

### 💰 네이버 검색 API
- **무료**
- 일일 호출 제한: 25,000건

### 💰 네이버 광고 API
- **무료** (광고 계정만 있으면 됨)
- 최소 계정 잔액: 10,000원
- API만 사용 시 잔액 소진 안 됨

### 💰 네이버 플레이스 파트너 API
- **별도 협의** (기업용)
- 일반 검색 API로는 상세 리뷰 불가

---

## 9. 참고 자료

### 📚 공식 문서
- 네이버 개발자 센터: https://developers.naver.com
- 네이버 검색 API 가이드: https://developers.naver.com/docs/search/blog/
- 네이버 광고 API 가이드: https://naver.github.io/searchad-apidoc/

### 🎓 튜토리얼
- 네이버 API 시작하기: https://developers.naver.com/docs/common/openapiguide/
- 광고 API 인증: https://naver.github.io/searchad-apidoc/#/guides

---

## 10. 빠른 시작 (30초)

```bash
# 1. 네이버 개발자 센터에서 API 키 발급
# https://developers.naver.com

# 2. .env 파일 수정
nano .env

# 3. API 키 입력
NAVER_CLIENT_ID="발급받은키"
NAVER_CLIENT_SECRET="발급받은시크릿"

# 4. 저장 후 서버 재시작
npm run dev

# 5. 브라우저에서 테스트
# https://localhost:3000/dashboard/tools/naver-keywords
```

---

## 📞 지원

API 연동 관련 문의:

**SUPER PLACE 기술 지원**
- 📧 kohsunwoo12345@gmail.com
- 📞 010-8532-8739
- 🕐 평일 09:00 - 18:00

**네이버 고객센터**
- 검색 API: https://developers.naver.com/support/helpme
- 광고 API: 네이버 광고 고객센터 > 1:1 문의

---

**✅ 체크포인트**: 
이 가이드를 따라 하면 30분 내에 네이버 API를 완벽히 연동할 수 있습니다!
