# 랜딩페이지 생성기 사용 가이드

## 📋 목차
1. [기능 개요](#기능-개요)
2. [데이터베이스 스키마 적용](#데이터베이스-스키마-적용)
3. [주요 기능 사용법](#주요-기능-사용법)
4. [API 엔드포인트](#api-엔드포인트)
5. [문제 해결](#문제-해결)

---

## 🎯 기능 개요

완전히 작동하는 랜딩페이지 생성기가 구현되었습니다:

### ✅ 구현된 기능

1. **폴더 관리**
   - 랜딩페이지를 폴더별로 분류
   - 폴더 생성, 수정, 삭제
   - 폴더별 페이지 개수 통계

2. **랜딩페이지 빌더**
   - HTML 템플릿 직접 편집 가능
   - 썸네일 이미지 업로드 (제목, 부제목 포함)
   - QR 코드 자동 생성 및 위치 설정
   - 픽셀 스크립트 삽입 (당근 비즈니스, Facebook 등)
   - OG 메타 태그 설정 (소셜 미디어 공유)
   - 커스텀 폼 필드 생성
   - 실시간 미리보기

3. **퍼블릭 랜딩페이지**
   - `/lp/[slug]` 경로로 접근
   - 서버사이드 렌더링 (Cloudflare Functions)
   - 픽셀 스크립트 자동 삽입
   - 조회수 자동 증가
   - 반응형 디자인

4. **폼 제출 관리**
   - 신청자 데이터 저장 (Cloudflare D1)
   - IP 주소 및 User-Agent 로깅
   - CSV/Excel 다운로드
   - 검색 및 필터링
   - 실시간 통계

---

## 🗄️ 데이터베이스 스키마 적용

### 1. Cloudflare D1 데이터베이스 확인

```bash
# wrangler를 사용하여 D1 데이터베이스 목록 확인
npx wrangler d1 list
```

### 2. 스키마 적용

```bash
# 로컬 D1 데이터베이스에 스키마 적용 (개발용)
npx wrangler d1 execute DB --local --file=./cloudflare-worker/schema.sql

# 프로덕션 D1 데이터베이스에 스키마 적용
npx wrangler d1 execute DB --file=./cloudflare-worker/schema.sql
```

### 3. 생성된 테이블 확인

```sql
-- 모든 테이블 목록
SELECT name FROM sqlite_master WHERE type='table';

-- Landing Page 테이블 구조
PRAGMA table_info(LandingPage);

-- Landing Page Folder 테이블 구조
PRAGMA table_info(LandingPageFolder);

-- Landing Page Submission 테이블 구조
PRAGMA table_info(LandingPageSubmission);

-- Landing Page Pixel Script 테이블 구조
PRAGMA table_info(LandingPagePixelScript);
```

### 4. wrangler.toml 바인딩 확인

`wrangler.toml` 파일에 D1 바인딩이 있는지 확인:

```toml
[[d1_databases]]
binding = "DB"
database_name = "superplace-db"
database_id = "your-database-id"
```

---

## 📱 주요 기능 사용법

### 1️⃣ 폴더 관리

**경로**: `/dashboard/admin/landing-pages/folders`

#### 폴더 생성
1. "새 폴더 만들기" 버튼 클릭
2. 폴더 이름 입력
3. 설명 입력 (선택사항)
4. 저장

#### 폴더 수정
1. 폴더 카드의 "편집" 버튼 클릭
2. 내용 수정
3. 저장

#### 폴더 삭제
- 폴더 안에 랜딩페이지가 없을 때만 삭제 가능
- "삭제" 버튼 클릭 후 확인

---

### 2️⃣ 랜딩페이지 만들기

**경로**: `/dashboard/admin/landing-pages/builder`

#### 기본 설정
1. **템플릿 선택**
   - 기본 템플릿
   - 학생 리포트
   - 이벤트 페이지
   - 커스텀 HTML ✨

2. **기본 정보 입력**
   - 제목 (필수)
   - 부제목 (선택)
   - 설명
   - 폴더 선택

#### 썸네일 업로드
1. 이미지 업로드 영역 클릭
2. JPG, PNG 파일 선택
3. 미리보기 확인
4. 제거 버튼으로 삭제 가능

#### QR 코드 설정
1. QR 코드 표시 체크박스
2. 위치 선택 (상단/하단/사이드바)
3. 저장 시 자동 생성

#### 픽셀 스크립트 추가
1. "픽셀 스크립트 추가" 버튼 클릭
2. 스크립트 이름 입력 (예: "당근 비즈니스 픽셀")
3. 위치 선택 (`<head>`, `<body>` 시작, `<body>` 끝)
4. 스크립트 코드 붙여넣기

**예시: 당근 비즈니스 픽셀**
```html
<script>
!function(e,t,n,s,a,c,i,o,p){e[a]=e[a]||{},e[a][c]=e[a][c]||function(){...}
</script>
```

**예시: Facebook Pixel**
```html
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){...}}
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
</script>
```

#### 커스텀 폼 필드 추가
1. 필드 타입 선택
   - 텍스트 입력
   - 긴 텍스트
   - 이메일
   - 전화번호
   - 체크박스

2. 필드 설정
   - 라벨 (예: "학생 이름", "연락처")
   - 플레이스홀더
   - 필수 입력 여부

3. 순서 조정 (드래그 기능은 향후 업데이트 예정)

#### SEO & 소셜 미디어
1. OG 제목 입력 (소셜 공유 시 표시)
2. OG 설명 입력
3. 비워두면 페이지 제목/설명 사용

#### 저장 및 미리보기
1. "미리보기" 버튼으로 실시간 확인
2. "저장하기" 버튼으로 랜딩페이지 생성
3. 생성된 URL 확인

---

### 3️⃣ 랜딩페이지 관리

**경로**: `/dashboard/admin/landing-pages`

#### 통계 카드
- 총 랜딩페이지 개수
- 활성 페이지 개수
- 총 조회수
- 총 신청자 수

#### 페이지 목록
각 랜딩페이지 카드에서:
- URL 복사
- 외부 링크로 열기
- 신청자 보기
- QR 코드 다운로드
- 삭제

---

### 4️⃣ 신청자 관리

**경로**: `/dashboard/admin/landing-pages/submissions?slug=[slug]`

#### 통계 확인
- 총 신청자 수
- 오늘 신청자 수
- 최근 신청 시간

#### 신청자 검색
- 검색창에 키워드 입력
- 모든 필드에서 검색

#### CSV 다운로드
1. "CSV 다운로드" 버튼 클릭
2. 파일명: `submissions_[slug]_[timestamp].csv`
3. UTF-8 인코딩 (Excel에서 한글 정상 표시)
4. 포함 데이터:
   - ID
   - 제출일시
   - IP 주소
   - 모든 폼 필드 데이터

---

## 🌐 API 엔드포인트

모든 API는 Cloudflare Pages Functions로 구현되어 있습니다.

### 인증
모든 관리자 API는 `Authorization: Bearer <token>` 헤더 필요

### 1. 랜딩페이지 관리

#### 목록 조회
```http
GET /api/admin/landing-pages
Authorization: Bearer <token>
```

**응답 예시:**
```json
{
  "success": true,
  "landingPages": [
    {
      "id": "lp_123",
      "slug": "lp_1234567890_abc123",
      "title": "학생 성적 리포트",
      "subtitle": "2024년 1학기",
      "url": "/lp/lp_1234567890_abc123",
      "viewCount": 42,
      "submissions": 15,
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

#### 랜딩페이지 생성
```http
POST /api/admin/landing-pages
Authorization: Bearer <token>
Content-Type: application/json

{
  "slug": "lp_1234567890_abc123",
  "title": "새 랜딩페이지",
  "subtitle": "부제목",
  "description": "설명",
  "templateType": "basic",
  "templateHtml": "<div>...</div>",
  "inputData": [
    {
      "id": "field_1",
      "type": "text",
      "label": "이름",
      "placeholder": "홍길동",
      "required": true,
      "order": 0
    }
  ],
  "ogTitle": "OG 제목",
  "ogDescription": "OG 설명",
  "thumbnail": "data:image/png;base64,...",
  "folderId": "folder_123",
  "showQrCode": true,
  "qrCodePosition": "bottom",
  "pixelScripts": [
    {
      "id": "script_1",
      "name": "당근 비즈니스 픽셀",
      "scriptType": "header",
      "scriptCode": "<script>...</script>"
    }
  ]
}
```

**응답 예시:**
```json
{
  "success": true,
  "message": "랜딩페이지가 생성되었습니다.",
  "landingPage": {
    "id": "lp_123",
    "slug": "lp_1234567890_abc123",
    "url": "/lp/lp_1234567890_abc123",
    "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/..."
  }
}
```

#### 랜딩페이지 삭제
```http
DELETE /api/admin/landing-pages/[id]
Authorization: Bearer <token>
```

---

### 2. 폴더 관리

#### 폴더 목록
```http
GET /api/landing/folders
Authorization: Bearer <token>
```

**응답 예시:**
```json
{
  "success": true,
  "folders": [
    {
      "id": "folder_123",
      "name": "2024년 1학기",
      "description": "1학기 학생 리포트",
      "pagesCount": 5,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

#### 폴더 생성
```http
POST /api/landing/folders
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "새 폴더",
  "description": "설명"
}
```

#### 폴더 수정
```http
PUT /api/landing/folders
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "folder_123",
  "name": "수정된 이름",
  "description": "수정된 설명"
}
```

#### 폴더 삭제
```http
DELETE /api/landing/folders?id=folder_123
Authorization: Bearer <token>
```

---

### 3. 퍼블릭 API

#### 랜딩페이지 조회 (조회수 증가)
```http
GET /api/landing/view?slug=lp_1234567890_abc123
```

**응답 예시:**
```json
{
  "success": true,
  "landingPage": {
    "id": "lp_123",
    "slug": "lp_1234567890_abc123",
    "title": "학생 성적 리포트",
    "subtitle": "2024년 1학기",
    "description": "설명",
    "templateType": "basic",
    "templateHtml": null,
    "inputData": [...],
    "thumbnail": "data:image/png;base64,...",
    "showQrCode": true,
    "qrCodePosition": "bottom",
    "pixelScripts": [...]
  }
}
```

#### 폼 제출
```http
POST /api/landing/submit
Content-Type: application/json

{
  "slug": "lp_1234567890_abc123",
  "data": {
    "name": "홍길동",
    "email": "hong@example.com",
    "phone": "010-1234-5678"
  }
}
```

**응답 예시:**
```json
{
  "success": true,
  "message": "제출되었습니다.",
  "submissionId": "sub_123"
}
```

#### 신청자 목록 조회
```http
GET /api/landing/submit?slug=lp_1234567890_abc123
Authorization: Bearer <token>
```

**응답 예시:**
```json
{
  "success": true,
  "submissions": [
    {
      "id": "sub_123",
      "slug": "lp_1234567890_abc123",
      "data": {
        "name": "홍길동",
        "email": "hong@example.com"
      },
      "ipAddress": "1.2.3.4",
      "userAgent": "Mozilla/5.0...",
      "submittedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

---

## 🐛 문제 해결

### 1. "생성 중 오류가 발생했습니다" 에러

**원인:**
- 데이터베이스 스키마가 적용되지 않음
- D1 바인딩 설정 오류
- 인증 토큰 만료

**해결 방법:**
```bash
# 1. 데이터베이스 스키마 적용 (로컬)
npx wrangler d1 execute DB --local --file=./cloudflare-worker/schema.sql

# 2. 프로덕션 스키마 적용
npx wrangler d1 execute DB --file=./cloudflare-worker/schema.sql

# 3. 개발 서버 재시작
npm run dev

# 4. Cloudflare Pages 재배포
git push origin genspark_ai_developer
```

### 2. 픽셀 스크립트가 작동하지 않음

**확인 사항:**
1. 스크립트 코드가 완전한지 확인
2. 위치 설정이 올바른지 확인 (`<head>`, `<body>` 시작, `<body>` 끝)
3. 브라우저 개발자 도구에서 스크립트 로드 확인
4. 광고 차단기 비활성화

**디버깅:**
```javascript
// 브라우저 콘솔에서 확인
console.log(document.head.innerHTML); // <head> 스크립트 확인
console.log(document.body.innerHTML); // <body> 스크립트 확인
```

### 3. CSV 다운로드 시 한글 깨짐

**해결됨:**
- UTF-8 BOM 자동 추가 (`\uFEFF`)
- Excel에서 정상 표시됨

### 4. QR 코드가 생성되지 않음

**확인 사항:**
1. `showQrCode` 설정이 `true`인지 확인
2. 외부 API 접근 가능 여부 확인 (https://api.qrserver.com)

### 5. 폴더 삭제가 안됨

**원인:**
- 폴더 안에 랜딩페이지가 있음

**해결 방법:**
1. 해당 폴더의 모든 랜딩페이지를 다른 폴더로 이동 또는 삭제
2. 빈 폴더가 되면 삭제 가능

---

## 📊 테스트 체크리스트

### ✅ 기능 테스트

- [x] 폴더 생성, 수정, 삭제
- [x] 랜딩페이지 생성
- [x] HTML 템플릿 편집
- [x] 썸네일 업로드
- [x] QR 코드 생성
- [x] 픽셀 스크립트 삽입
- [x] 커스텀 폼 필드 추가
- [x] 퍼블릭 랜딩페이지 접근 (`/lp/[slug]`)
- [x] 폼 제출
- [x] 신청자 목록 조회
- [x] CSV 다운로드
- [x] 조회수 증가
- [x] 검색 및 필터링

### ⏳ 프로덕션 검증 필요

- [ ] Cloudflare D1 스키마 적용
- [ ] Cloudflare Pages 배포
- [ ] 실제 랜딩페이지 생성 테스트
- [ ] 픽셀 스크립트 실제 작동 확인
- [ ] 당근 비즈니스 픽셀 연동
- [ ] Facebook Pixel 연동
- [ ] 모바일 반응형 확인
- [ ] SEO 메타 태그 확인
- [ ] OG 태그 소셜 공유 확인

---

## 🎨 디자인 가이드

### 템플릿 타입

1. **기본 템플릿** (`basic`)
   - 간단한 폼 입력
   - 제목, 부제목, 설명
   - 커스텀 필드

2. **학생 리포트** (`student_report`)
   - 학습 데이터 전달
   - 성적, 출석, AI 채팅 기록 등

3. **이벤트 페이지** (`event`)
   - 세미나/행사 안내
   - 신청 접수

4. **커스텀 HTML** (`custom`)
   - 완전한 HTML 편집
   - 자유로운 디자인

### 색상 가이드

- Primary: `#4F46E5` (Indigo 600)
- Success: `#10B981` (Green 600)
- Danger: `#EF4444` (Red 600)
- Warning: `#F59E0B` (Amber 600)
- Background: `#F9FAFB` (Gray 50)

---

## 🚀 배포 가이드

### 1. 로컬 테스트

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 접속
# http://localhost:3000/dashboard/admin/landing-pages
```

### 2. Cloudflare Pages 배포

```bash
# 변경사항 커밋
git add -A
git commit -m "feat: 랜딩페이지 생성기 테스트"

# GitHub에 푸시
git push origin genspark_ai_developer

# Cloudflare Pages 자동 배포 (GitHub 연동)
```

### 3. 데이터베이스 마이그레이션

```bash
# 프로덕션 D1 스키마 적용
npx wrangler d1 execute DB --file=./cloudflare-worker/schema.sql

# 확인
npx wrangler d1 execute DB --command="SELECT name FROM sqlite_master WHERE type='table';"
```

---

## 📞 지원

문제가 발생하면:
1. 브라우저 개발자 도구 콘솔 확인
2. Cloudflare Pages 로그 확인
3. D1 데이터베이스 연결 확인
4. wrangler.toml 바인딩 확인

---

## 🎉 완료!

모든 기능이 정상적으로 작동하면:
- ✅ 관리자는 HTML 템플릿을 수정할 수 있습니다
- ✅ 각 사용자는 나눠진 데이터로 제작한 랜딩페이지를 볼 수 있습니다
- ✅ 폴더로 분류할 수 있습니다
- ✅ 썸네일 이미지 (제목, 부제목) 지원
- ✅ 당근 비즈니스 메타 픽셀 및 기타 스크립트 삽입 가능
- ✅ 폼 양식과 제출 명단 엑셀 다운로드 가능

**랜딩페이지 생성기 완성! 🎊**
