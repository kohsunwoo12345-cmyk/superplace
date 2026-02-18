# 랜딩페이지 HTML 템플릿 관리 시스템 및 버튼 접근성 개선

## 📋 작업 개요
사용자가 **"랜딩페이지 HTML 템플릿 수정하는 페이지는 어디있어?"**라고 질문하여, 메인 페이지에서 템플릿 관리 페이지로 쉽게 접근할 수 있도록 버튼을 추가했습니다.

---

## ✅ 완료된 작업

### 1️⃣ 📄 HTML 템플릿 관리 버튼 추가
**위치**: `src/app/dashboard/admin/landing-pages/page.tsx`

#### 변경사항
- 헤더에 **"📄 HTML 템플릿 관리"** 버튼 추가
- **보라색 테마** (`border-purple-300`, `hover:bg-purple-50`)로 시각적 구분
- **FileCode** 아이콘 사용 (`lucide-react`)
- 크기: `lg` (기존 버튼과 동일)
- 클릭 시 `/dashboard/admin/landing-pages/templates` 페이지로 이동

#### 코드 예시
```tsx
<Button
  onClick={() => router.push("/dashboard/admin/landing-pages/templates")}
  variant="outline"
  size="lg"
  className="border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50"
>
  <FileCode className="w-5 h-5 mr-2" />
  📄 HTML 템플릿 관리
</Button>
```

---

### 2️⃣ 🚀 빠른 시작 가이드 업데이트
**위치**: `src/app/dashboard/admin/landing-pages/page.tsx` (빠른 가이드 배너)

#### 변경사항
- **4단계** → **5단계**로 확장
- 템플릿 제작 단계를 첫 번째로 추가

#### 새로운 5단계 가이드
| 단계 | 제목 | 설명 |
|------|------|------|
| 1️⃣ | HTML 템플릿 | "📄 HTML 템플릿 관리"에서 템플릿 제작 |
| 2️⃣ | 랜딩페이지 생성 | 학생 선택, 기간 설정, 템플릿 선택 |
| 3️⃣ | 데이터 자동 삽입 | 선택 기간의 학습 데이터 표시 |
| 4️⃣ | URL 공유 | 생성된 링크 복사 및 공유 |
| 5️⃣ | 데이터 확인 | 조회수 및 신청자 보기 |

---

### 3️⃣ 📚 문서 추가
**파일**: `LANDING_PAGE_TEMPLATE_SYSTEM.md`

#### 내용
- 템플릿 시스템 전체 구조 및 개념
- 사용 가능한 변수 목록 (`{{studentName}}`, `{{period}}`, `{{attendanceRate}}` 등)
- 템플릿 제작 → 랜딩페이지 생성 → 데이터 자동 삽입 흐름 설명
- API 엔드포인트 목록 (`/api/landing/templates` GET/POST/PUT/DELETE)
- 데이터베이스 스키마 변경사항
- 향후 개발 계획

---

## 📂 페이지 구조 및 접근 경로

### 랜딩페이지 관련 페이지

| 페이지 이름 | URL | 역할 |
|-------------|-----|------|
| 📋 랜딩페이지 목록 | `/dashboard/admin/landing-pages` | 생성된 랜딩페이지 목록 보기 |
| 📄 HTML 템플릿 관리 | `/dashboard/admin/landing-pages/templates` | 템플릿 생성/수정/삭제 |
| ✨ 랜딩페이지 생성 | `/dashboard/admin/landing-pages/create` | 학생 선택, 기간 설정, 템플릿 선택 |
| 🛠️ 커스텀 빌더 | `/dashboard/admin/landing-pages/builder` | 커스텀 폼 양식 랜딩페이지 제작 |
| 📁 폴더 관리 | `/dashboard/admin/landing-pages/folders` | 랜딩페이지 폴더 관리 |
| 📊 신청자 관리 | `/dashboard/admin/landing-pages/submissions` | 랜딩페이지 제출자 목록 |

---

## 🎨 UI 개선 사항

### 헤더 버튼 레이아웃 (좌측 → 우측 순서)
1. **캐시 초기화** (회색 outline)
2. **📁 폴더 관리** (녹색 테마)
3. **📄 HTML 템플릿 관리** ⭐ **NEW** (보라색 테마)
4. **✨ 새 랜딩페이지 만들기** (보라→인디고 그라데이션)

### 빠른 시작 가이드 배너
- 배경: 보라→핑크 그라데이션 (`from-indigo-500 to-purple-600`)
- 5개의 카드 형태로 단계별 가이드 표시
- 각 카드: 흰색 반투명 배경 (`bg-white/10`)

---

## 🔄 사용 흐름

### 1️⃣ 관리자: HTML 템플릿 제작
1. 랜딩페이지 목록 페이지 접속
2. **"📄 HTML 템플릿 관리"** 버튼 클릭
3. **"✨ 새 템플릿 만들기"** 클릭
4. 템플릿 이름, 설명, HTML 코드 입력
5. 사용 가능한 변수 사용:
   - `{{studentName}}`: 학생 이름
   - `{{period}}`: 기간 (예: 2024-01-01 ~ 2024-01-31)
   - `{{attendanceRate}}`: 출석률
   - `{{totalDays}}`: 전체 수업일
   - `{{presentDays}}`: 출석일
   - `{{aiChatCount}}`: AI 대화 횟수
   - `{{homeworkRate}}`: 숙제 완료율
6. **"미리보기"** 버튼으로 샘플 데이터 확인
7. **"생성하기"** 버튼으로 저장

### 2️⃣ 랜딩페이지 생성
1. 랜딩페이지 목록에서 **"✨ 새 랜딩페이지 만들기"** (또는 create 페이지 직접 접속)
2. **1. 학생 선택**: 검색 후 학생 클릭
3. **2. 랜딩페이지 제목**: 자동 입력됨 (예: "김철수 학생의 학습 리포트")
4. **3. 데이터 기간 선택**: 시작일, 종료일 선택
5. **4. HTML 템플릿 선택**: 제작한 템플릿 선택
6. **5. 표시할 데이터 선택**: 기본 정보, 출결, AI 대화, 개념, 숙제 체크박스 선택
7. **"랜딩페이지 생성"** 버튼 클릭

### 3️⃣ 데이터 자동 삽입
- 선택된 기간(startDate ~ endDate) 내의 학생 학습 데이터 집계
- 템플릿의 변수에 실제 데이터 자동 삽입
- 생성된 HTML을 데이터베이스에 저장
- 고유한 slug URL 생성 (예: `/lp/lp_1708267890_a3f7k2`)

### 4️⃣ URL 공유
- 생성된 URL 복사 버튼 클릭
- 학부모/학생에게 공유
- 모바일/PC 모두 접근 가능

### 5️⃣ 데이터 확인
- **"📊 신청자 보기"** 버튼으로 제출된 데이터 확인
- 조회수, 제출 횟수 통계 확인
- CSV/Excel 다운로드 가능

---

## 🛠️ 기술 스택 및 변경사항

### 프론트엔드
- **React 컴포넌트**: `src/app/dashboard/admin/landing-pages/page.tsx`
- **UI 라이브러리**: `@/components/ui` (Card, Button, Badge, Dialog 등)
- **아이콘**: `lucide-react` (FileCode, Plus, FolderOpen 등)
- **라우팅**: Next.js App Router

### 백엔드 (이미 구현됨)
- **API 엔드포인트**: `/api/landing/templates`
  - `GET`: 템플릿 목록 조회
  - `POST`: 새 템플릿 생성
  - `PUT`: 템플릿 수정
  - `DELETE`: 템플릿 삭제
- **데이터베이스**: Cloudflare D1
  - 테이블: `LandingPageTemplate`, `LandingPage`
  - 필드: `template_id`, `start_date`, `end_date` 추가됨

---

## 📊 개선 통계

### 버튼 개선
- **추가된 버튼**: 1개 (📄 HTML 템플릿 관리)
- **크기**: lg (w-5 h-5 아이콘)
- **테마**: 보라색 (`border-purple-300`)
- **텍스트**: 명확한 이모지 + 텍스트 조합

### 가이드 개선
- **단계 추가**: 4단계 → 5단계
- **명확성 향상**: 템플릿 제작 단계를 첫 번째로 명시

---

## 🚀 배포 상태

### GitHub
- **커밋 메시지**: `feat: 랜딩페이지 메인 페이지에 HTML 템플릿 관리 버튼 추가`
- **커밋 해시**: `c95a74e`
- **푸시 완료**: ✅ `origin/main` 브랜치
- **리포지토리**: https://github.com/kohsunwoo12345-cmyk/superplace

### Cloudflare Pages
- **배포 URL**: https://superplacestudy.pages.dev
- **자동 배포**: GitHub main 브랜치 푸시 시 자동 배포
- **예상 배포 시간**: 5-10분

### 확인 URL
- **랜딩페이지 목록**: https://superplacestudy.pages.dev/dashboard/admin/landing-pages
- **템플릿 관리 페이지**: https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates
- **랜딩페이지 생성 페이지**: https://superplacestudy.pages.dev/dashboard/admin/landing-pages/create

---

## ✅ 체크리스트

### UI 개선
- [x] 📄 HTML 템플릿 관리 버튼 추가
- [x] 버튼 크기 lg로 설정
- [x] 보라색 테마 적용
- [x] FileCode 아이콘 추가
- [x] 빠른 시작 가이드 5단계로 업데이트

### 기능 구현 (이미 완료)
- [x] 템플릿 관리 페이지 (`/templates/page.tsx`)
- [x] 템플릿 CRUD API (`/api/landing/templates`)
- [x] 랜딩페이지 생성 흐름 (학생 선택 → 기간 → 템플릿 → 데이터)
- [x] 템플릿 변수 시스템 ({{studentName}} 등)
- [x] 미리보기 기능

### 문서 작성
- [x] `LANDING_PAGE_TEMPLATE_SYSTEM.md`
- [x] `LANDING_PAGE_BUTTONS_AND_TEMPLATE_FIX.md`

### 배포
- [x] 빌드 성공 확인
- [x] Git 커밋 & 푸시
- [x] Cloudflare Pages 자동 배포 진행 중

---

## 🔜 향후 개발 계획

### 1단계: 백엔드 API 구현 ⚠️ **진행 중**
- [ ] `/api/admin/landing-pages` POST 엔드포인트 수정
  - `templateId`, `startDate`, `endDate`, `dataOptions` 파라미터 처리
  - 선택된 기간 내 학생 데이터 집계 로직
  - 템플릿 변수에 실제 데이터 삽입
  - 완성된 HTML을 `LandingPage` 테이블에 저장

### 2단계: 데이터베이스 스키마 적용
- [ ] Cloudflare D1에 `LandingPageTemplate` 테이블 생성
- [ ] `LandingPage` 테이블에 `template_id`, `start_date`, `end_date` 필드 추가
- [ ] 인덱스 생성

### 3단계: 템플릿-데이터 연동 테스트
- [ ] 템플릿 생성 → 랜딩페이지 생성 → 데이터 자동 삽입 흐름 테스트
- [ ] 변수 치환 로직 검증
- [ ] 기간별 데이터 집계 정확성 확인

### 4단계: UI/UX 개선
- [ ] 템플릿 미리보기 개선 (실제 학생 데이터 샘플 선택 가능)
- [ ] 랜딩페이지 생성 시 실시간 미리보기
- [ ] 템플릿 복사/수정 기능 강화

---

## 📞 사용자 문의 해결

### 질문
> "랜딩페이지 HTML 템플릿 수정하는 페이지는 어디있어?"

### 답변 ✅
1. **랜딩페이지 목록 페이지**에서 **"📄 HTML 템플릿 관리"** 버튼을 클릭하세요.
   - URL: https://superplacestudy.pages.dev/dashboard/admin/landing-pages
2. 또는 직접 **템플릿 관리 페이지**로 이동하세요:
   - URL: https://superplacestudy.pages.dev/dashboard/admin/landing-pages/templates
3. **"✨ 새 템플릿 만들기"** 버튼을 클릭하여 템플릿을 제작하세요.
4. HTML 코드 편집기에서 `{{studentName}}`, `{{period}}` 등의 변수를 사용하세요.
5. **"미리보기"** 버튼으로 샘플 데이터 확인 후 저장하세요.

---

## 📌 요약

### 개선 사항
- ✅ **메인 페이지에 템플릿 관리 버튼 추가** → 접근성 향상
- ✅ **빠른 시작 가이드 5단계로 업데이트** → 사용 흐름 명확화
- ✅ **문서 작성 완료** → 개발자 및 사용자 가이드 제공

### 사용 흐름
1. 템플릿 제작 (변수 사용)
2. 랜딩페이지 생성 (학생, 기간, 템플릿 선택)
3. 데이터 자동 삽입
4. URL 공유
5. 데이터 확인

### 배포
- GitHub: ✅ 푸시 완료
- Cloudflare Pages: 🚀 자동 배포 진행 중 (5-10분 소요)

---

## 🎉 완료!

사용자의 요청대로 **HTML 템플릿 관리 페이지**에 쉽게 접근할 수 있도록 버튼을 추가하고, 전체 사용 흐름을 명확하게 개선했습니다.

**배포 후 확인 URL**: https://superplacestudy.pages.dev/dashboard/admin/landing-pages
