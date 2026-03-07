# 🗄️ 랜딩페이지 테이블 설정 가이드

## 📋 문제 원인
1. **테이블 이름 불일치**: 
   - 코드: `landing_page_templates`
   - 기존 스크립트: `LandingPageTemplate`
   
2. **필수 컬럼 누락**:
   - `html_content` 컬럼 없음 → 랜딩페이지 HTML 저장 불가
   - `user_id` 컬럼 없음 → 생성자 추적 불가

## ✅ 수정 내용
- 테이블 이름을 `landing_page_templates`로 통일
- `landing_pages` 테이블에 `html_content`, `user_id` 컬럼 추가
- ALTER TABLE로 기존 테이블에 컬럼 자동 추가

## 📦 배포 정보
- **커밋**: 9534a1df
- **URL**: https://superplacestudy.pages.dev
- **배포 시작**: 2026-03-07 14:41 UTC
- **배포 완료 예상**: 2026-03-07 14:46 UTC

## 🧪 테스트 절차 (5분 후)

### 1️⃣ 테이블 생성
```bash
curl -X POST https://superplacestudy.pages.dev/api/setup/create-tables \
  -H "Content-Type: application/json" \
  -d '{"password":"setup-tables-2026"}'
```

**예상 응답**:
```json
{
  "success": true,
  "results": [
    {"table": "landing_page_templates", "status": "created"},
    {"index": "landing_page_templates indexes", "status": "created"},
    {"table": "landing_pages", "status": "created"},
    {"column": "html_content", "status": "added"},
    {"column": "user_id", "status": "added"}
  ],
  "tables": [
    {"name": "landing_page_templates", "sql": "..."},
    {"name": "landing_pages", "sql": "..."}
  ]
}
```

### 2️⃣ 기본 템플릿 생성
```bash
curl -X POST https://superplacestudy.pages.dev/api/test/create-default-template
```

**예상 응답**:
```json
{
  "success": true,
  "message": "기본 템플릿이 생성되었습니다",
  "template": {
    "id": "tpl_xxxxx",
    "name": "기본 학습 리포트 템플릿",
    "htmlLength": 4500,
    "isDefault": true
  }
}
```

### 3️⃣ 랜딩페이지 생성
1. 브라우저에서 https://superplacestudy.pages.dev/dashboard/admin/landing-pages/create
2. 학생 선택
3. 제목: "템플릿 테스트"
4. 기간: 2024-01-01 ~ 2024-03-31
5. "생성" 클릭

### 4️⃣ 결과 확인
생성된 페이지 URL 접속 (예: `/lp/lp_xxxxx`)

**✅ 정상 표시**:
- 보라색 그라데이션 배경
- "학습 리포트" 제목
- 학생 이름, 학습 기간
- 출석률, 출석일, 숙제 완료율, AI 대화 4개 카드
- 학원명, 원장 이름

**❌ 빈 페이지인 경우**:
```bash
# 디버그 API로 HTML 확인
curl "https://superplacestudy.pages.dev/api/debug/landing-page-content?slug=lp_xxxxx"
```

## 📊 테이블 구조

### landing_page_templates
```sql
CREATE TABLE landing_page_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  html TEXT NOT NULL,              -- 템플릿 HTML
  variables TEXT,                   -- 사용 가능한 변수 목록
  isDefault INTEGER DEFAULT 0,      -- 기본 템플릿 여부
  usageCount INTEGER DEFAULT 0,
  createdById TEXT NOT NULL,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
);
```

### landing_pages
```sql
CREATE TABLE landing_pages (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  html_content TEXT,                -- ⭐ 최종 HTML (변수 치환 완료)
  user_id INTEGER,                  -- ⭐ 생성자 ID (해시)
  templateHtml TEXT,                -- 원본 템플릿 HTML
  isActive INTEGER DEFAULT 1,
  ...
);
```

## 🎯 핵심 변경사항
1. ✅ 테이블 이름 통일: `landing_page_templates`
2. ✅ `html_content` 컬럼 추가 → 렌더링용 HTML 저장
3. ✅ `user_id` 컬럼 추가 → 생성자 추적
4. ✅ ALTER TABLE로 기존 테이블에도 자동 적용

---

**⏰ 5분 후 위 절차를 순서대로 실행하세요!**
