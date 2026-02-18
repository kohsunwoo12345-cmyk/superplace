# 랜딩페이지 시스템 - 완전 가이드

## 📍 페이지 구조 총정리

### 관리자 페이지 (인증 필요)

#### 1. 랜딩페이지 목록
```
URL: https://superplacestudy.pages.dev/dashboard/admin/landing-pages
```
**기능:**
- 생성된 모든 랜딩페이지 목록 보기
- 각 페이지의 통계 (조회수, 신청자 수)
- 페이지 URL 복사/열기
- 신청자 관리 페이지로 이동
- QR 코드 다운로드
- 페이지 삭제

**버튼:**
- 🆕 **새 랜딩페이지 만들기** → 빌더로 이동
- 📁 **폴더 관리** → 폴더 관리 페이지로 이동

---

#### 2. 랜딩페이지 빌더 (생성 도구)
```
URL: https://superplacestudy.pages.dev/dashboard/admin/landing-pages/builder
```
**기능:**
- ✏️ 제목, 부제목, 설명 입력
- 🖼️ 썸네일 이미지 업로드
- 📋 커스텀 폼 필드 추가 (텍스트, 이메일, 전화번호, 체크박스 등)
- 🎨 템플릿 선택 (기본, 학생 리포트, 이벤트, 커스텀 HTML)
- 📱 QR 코드 설정 (위치: 상단/하단/사이드바)
- 📊 픽셀 스크립트 추가 (당근 비즈니스, Facebook 등)
- 🔍 SEO 설정 (OG 태그)
- 📁 폴더 선택
- 👁️ 미리보기
- 💾 저장

**결과:**
저장하면 자동으로 **slug 생성** → 퍼블릭 URL 생성
```
예시: /lp/lp_1708267890_a3f7k2
```

---

#### 3. 폴더 관리
```
URL: https://superplacestudy.pages.dev/dashboard/admin/landing-pages/folders
```
**기능:**
- 폴더 생성 (이름, 설명)
- 폴더 수정
- 폴더 삭제 (비어있을 때만)
- 폴더별 랜딩페이지 개수 확인

---

#### 4. 신청자 관리
```
URL: https://superplacestudy.pages.dev/dashboard/admin/landing-pages/submissions
또는: ?slug=[특정-slug] (특정 페이지만 필터)
```
**기능:**
- 📋 제출자 목록 보기
- 📊 통계 (총 신청자, 오늘 신청자, 최근 제출 시간)
- 🔍 검색 (모든 필드에서 검색)
- 📥 **CSV 다운로드** (엑셀로 열기 가능)
- IP 주소, User-Agent 로깅
- 제출 일시 표시

---

### 퍼블릭 랜딩페이지 (누구나 접근 가능)

#### 실제 사용자가 보는 페이지
```
URL: https://superplacestudy.pages.dev/lp/[생성된-slug]
예시: https://superplacestudy.pages.dev/lp/lp_1708267890_a3f7k2
```

**이 페이지에서 볼 수 있는 것:**
1. 🖼️ **썸네일 이미지** (업로드한 이미지)
2. 📌 **제목** (큰 제목)
3. 📝 **부제목** (작은 설명)
4. 📄 **설명** (상세 내용)
5. 📱 **QR 코드** (설정한 위치에 표시)
6. 📋 **폼 양식** (빌더에서 추가한 커스텀 필드)
   - 텍스트 입력
   - 이메일 입력
   - 전화번호 입력
   - 긴 텍스트 (textarea)
   - 체크박스
   - 필수 입력 표시 (빨간 별표)
7. ✅ **제출 버튼**
8. 🎯 **픽셀 스크립트** (자동 실행 - 당근 비즈니스, Facebook Pixel 등)

**폼 제출 후:**
- 제출 완료 메시지 표시
- 데이터가 D1 데이터베이스에 저장됨
- 관리자는 "신청자 관리" 페이지에서 확인 가능

---

## 🔄 전체 플로우 (단계별)

### Phase 1: 랜딩페이지 만들기

```
1. 로그인
   https://superplacestudy.pages.dev/login
   (관리자 계정 필요)

2. 사이드바에서 "랜딩페이지" 클릭
   또는 직접 접속: /dashboard/admin/landing-pages

3. "새 랜딩페이지 만들기" 버튼 클릭
   → /dashboard/admin/landing-pages/builder

4. 랜딩페이지 설정
   ✓ 제목: "2024년 상반기 무료 체험"
   ✓ 부제목: "지금 신청하세요!"
   ✓ 썸네일: 이미지 업로드
   ✓ 폼 필드 추가:
     - 이름 (텍스트, 필수)
     - 이메일 (이메일, 필수)
     - 전화번호 (전화번호, 필수)
     - 문의사항 (긴 텍스트, 선택)
   ✓ QR 코드: 하단 표시
   ✓ 픽셀 스크립트: 당근 비즈니스 추가

5. 저장 버튼 클릭
   → slug 자동 생성: lp_1708267890_a3f7k2
   → URL 생성: /lp/lp_1708267890_a3f7k2
   → 목록 페이지로 리다이렉트
```

### Phase 2: 랜딩페이지 확인 및 공유

```
1. 목록 페이지에서 확인
   /dashboard/admin/landing-pages
   → 방금 만든 페이지가 목록 맨 위에 표시됨

2. URL 확인
   표시되는 URL: https://superplacestudy.pages.dev/lp/lp_1708267890_a3f7k2
   
3. 버튼 기능:
   - 📋 복사: URL 클립보드에 복사
   - 🔗 새 탭에서 열기: 퍼블릭 페이지 확인
   - 👥 신청자 보기: 제출 데이터 확인
   - QR 다운로드: QR 코드 이미지 저장

4. URL 공유
   - 카카오톡에 전송
   - SMS로 전송
   - 이메일로 전송
   - QR 코드 인쇄하여 오프라인 배포
```

### Phase 3: 사용자 제출

```
1. 사용자가 URL 접속
   https://superplacestudy.pages.dev/lp/lp_1708267890_a3f7k2

2. 페이지 내용 확인
   - 썸네일 이미지 보임
   - 제목 "2024년 상반기 무료 체험"
   - 부제목 "지금 신청하세요!"
   - QR 코드 (하단)

3. 폼 작성
   - 이름: 홍길동
   - 이메일: hong@example.com
   - 전화번호: 010-1234-5678
   - 문의사항: 수업 시간을 알고 싶습니다

4. 제출 버튼 클릭
   → 데이터 저장됨 (D1 데이터베이스)
   → "제출되었습니다" 메시지
   → 픽셀 스크립트 자동 실행 (전환 추적)
```

### Phase 4: 신청자 데이터 확인

```
1. 관리자 로그인

2. 랜딩페이지 목록에서
   "신청자 보기" 버튼 클릭

3. 신청자 관리 페이지
   /dashboard/admin/landing-pages/submissions?slug=lp_1708267890_a3f7k2
   
   표시되는 정보:
   - ID: sub_123
   - 제출일시: 2024-02-18 15:30:25
   - IP: 1.2.3.4
   - 이름: 홍길동
   - 이메일: hong@example.com
   - 전화번호: 010-1234-5678
   - 문의사항: 수업 시간을 알고 싶습니다

4. CSV 다운로드 버튼 클릭
   → submissions_lp_1708267890_a3f7k2_1708267890.csv 다운로드
   → 엑셀에서 열기 가능 (UTF-8 인코딩)
```

---

## ⚠️ 중요: D1 데이터베이스 설정 필수!

랜딩페이지를 **생성하려면** 먼저 데이터베이스 테이블이 있어야 합니다.

### 설정 방법:

```bash
# 1. Wrangler 로그인 (처음 한 번만)
npx wrangler login

# 2. D1 스키마 적용
npx wrangler d1 execute DB --file=./cloudflare-worker/schema.sql

# 3. 테이블 생성 확인
npx wrangler d1 execute DB --command="SELECT name FROM sqlite_master WHERE type='table';"
```

**생성되어야 할 테이블:**
- ✅ LandingPage
- ✅ LandingPageFolder
- ✅ LandingPageSubmission
- ✅ LandingPagePixelScript

### 테이블이 없으면:
- 랜딩페이지 생성 시 "생성 중 오류" 발생
- 폴더 생성 불가
- 신청자 데이터 저장 불가

---

## 🧪 테스트 시나리오

### 1단계: 데이터베이스 확인
```bash
npx wrangler d1 execute DB --command="SELECT COUNT(*) FROM LandingPage;"
```
- 결과: 0 → 아직 랜딩페이지 없음 (정상)
- 오류 → 테이블 없음 → 스키마 적용 필요

### 2단계: 테스트 랜딩페이지 생성
```
1. /dashboard/admin/landing-pages/builder 접속
2. 제목: "테스트 랜딩페이지"
3. 필드 추가: 이름, 이메일
4. 저장
5. 목록에서 URL 확인
```

### 3단계: 퍼블릭 페이지 테스트
```
1. 생성된 URL 접속 (새 탭)
2. 폼 작성 및 제출
3. "제출되었습니다" 확인
```

### 4단계: 신청자 데이터 확인
```
1. 목록에서 "신청자 보기" 클릭
2. 방금 제출한 데이터 확인
3. CSV 다운로드
```

---

## 📊 전체 URL 맵

| 페이지 | URL | 설명 |
|--------|-----|------|
| 로그인 | `/login` | 관리자 로그인 |
| 목록 | `/dashboard/admin/landing-pages` | 모든 랜딩페이지 목록 |
| 빌더 | `/dashboard/admin/landing-pages/builder` | 새 랜딩페이지 만들기 |
| 폴더 | `/dashboard/admin/landing-pages/folders` | 폴더 관리 |
| 신청자 | `/dashboard/admin/landing-pages/submissions` | 제출 데이터 보기 |
| **퍼블릭** | `/lp/[slug]` | 실제 사용자가 보는 페이지 |

---

## 🎯 요약

### 각 페이지의 역할

1. **목록 페이지** (`/dashboard/admin/landing-pages`)
   - 생성된 랜딩페이지 관리
   - URL 복사/공유
   - 통계 확인

2. **빌더 페이지** (`/dashboard/admin/landing-pages/builder`)
   - 랜딩페이지 생성 도구
   - 썸네일, 폼, 픽셀 설정

3. **폴더 페이지** (`/dashboard/admin/landing-pages/folders`)
   - 랜딩페이지 분류

4. **신청자 페이지** (`/dashboard/admin/landing-pages/submissions`)
   - 제출 데이터 확인
   - CSV 다운로드

5. **퍼블릭 페이지** (`/lp/[slug]`)
   - 실제 사용자가 보는 페이지
   - 썸네일, 폼 양식 표시
   - 데이터 제출

---

**모든 기능이 구현되어 있으며, D1 스키마만 적용하면 즉시 사용 가능합니다!**
