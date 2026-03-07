# 🧪 랜딩페이지 최종 테스트 가이드

## ✅ 적용된 수정 (커밋: 142887f2)

### 핵심 변경사항
**동적 컬럼 감지 시스템 도입**
- 실행 시점에 `PRAGMA table_info`로 테이블 구조 확인
- 존재하는 컬럼만 사용해서 INSERT SQL 동적 생성
- 어떤 테이블 구조에서도 작동 보장

### 지원하는 컬럼명 변환
| 구 스키마 | 신 스키마 | 설명 |
|-----------|-----------|------|
| html_content | templateHtml | HTML 내용 |
| template_type | templateType | 템플릿 타입 |
| content_json | customFields | 커스텀 필드 |
| qr_code_url | qrCodeUrl | QR 코드 URL |
| thumbnail_url | thumbnailUrl | 썸네일 URL |
| og_title | metaTitle | OG 제목 |
| og_description | metaDescription | OG 설명 |
| status | isActive | 활성 상태 |

## 🧪 테스트 순서

### 1단계: 테이블 구조 확인
```bash
curl https://superplace-academy.pages.dev/api/test-db-structure
```

**예상 응답**:
```json
{
  "success": true,
  "columns": ["id", "title", "created_at", ...],
  "fullStructure": [...],
  "sampleData": {...},
  "columnCount": 10
}
```

**확인 사항**:
- `columns` 배열에 어떤 컬럼들이 있는지 확인
- `id`, `title`은 필수
- `slug`, `html_content`, `template_type` 등 존재 여부 확인

### 2단계: 랜딩페이지 목록 확인
**브라우저에서**:
```
https://superplace-academy.pages.dev/dashboard/landing-pages
```

**예상 결과**:
- 기존 랜딩페이지 목록 표시
- slug가 없는 경우 자동으로 'lp-{id}' 형식으로 표시

### 3단계: 새 랜딩페이지 생성 테스트
**브라우저에서**:
1. "새 랜딩페이지 만들기" 버튼 클릭
2. 다음 정보 입력:
   - **제목**: "테스트 랜딩페이지"
   - **Slug**: "test-landing-page"
   - **템플릿 선택**: 아무거나
3. "저장" 버튼 클릭

**예상 결과**:
- ✅ 생성 성공 메시지
- ✅ 목록에 즉시 표시
- ✅ 오류 팝업 없음

**만약 오류 발생 시**:
- 브라우저 개발자 도구 (F12) → Console 탭 확인
- 오류 메시지 전체 복사
- 다음 정보 제공:
  1. 오류 메시지
  2. 1단계에서 확인한 테이블 구조

### 4단계: 생성된 랜딩페이지 접근
```
https://superplace-academy.pages.dev/lp/test-landing-page
```

**예상 결과**:
- 생성한 랜딩페이지 정상 표시
- 404 오류 없음

## 🔍 추가 디버그 API

### 테이블 구조 상세 확인
```bash
curl https://superplace-academy.pages.dev/api/admin/debug-landing-pages
```

**응답 내용**:
- 테이블 구조 (PRAGMA table_info)
- 전체 데이터 (최근 10개)
- slug 컬럼 존재 확인
- DIRECTOR 사용자 목록

## 📊 예상되는 시나리오별 동작

### 시나리오 1: slug 컬럼이 없는 경우
```sql
-- 테이블 구조
CREATE TABLE landing_pages (
  id INTEGER PRIMARY KEY,
  title TEXT,
  html_content TEXT,
  created_at TEXT
)
```

**동작**:
- INSERT: slug 컬럼 제외하고 생성
- SELECT: COALESCE로 'lp-{id}' 자동 생성
- 결과: ✅ 정상 동작

### 시나리오 2: 구 스키마 (snake_case)
```sql
-- 테이블 구조
CREATE TABLE landing_pages (
  id INTEGER PRIMARY KEY,
  title TEXT,
  html_content TEXT,
  template_type TEXT,
  qr_code_url TEXT,
  created_at TEXT
)
```

**동작**:
- INSERT: html_content, template_type, qr_code_url 사용
- 결과: ✅ 정상 동작

### 시나리오 3: 신 스키마 (camelCase)
```sql
-- 테이블 구조
CREATE TABLE landing_pages (
  id TEXT PRIMARY KEY,
  title TEXT,
  slug TEXT,
  templateHtml TEXT,
  templateType TEXT,
  qrCodeUrl TEXT,
  created_at TEXT
)
```

**동작**:
- INSERT: slug, templateHtml, templateType, qrCodeUrl 사용
- 결과: ✅ 정상 동작

## ⚠️ 주의사항

### 필수 컬럼
다음 컬럼은 반드시 있어야 합니다:
- `id` (INTEGER 또는 TEXT)
- `title` (TEXT)

만약 이 컬럼들이 없다면:
1. Cloudflare D1 콘솔에서 확인
2. 테이블 재생성 필요

### 생성 후 확인
생성 후 반드시:
1. 목록 페이지에서 새 항목 확인
2. URL 접근 테스트
3. 수정 가능 여부 확인

## 🚨 문제 해결

### 문제: 여전히 생성이 안 됨
**확인 순서**:
1. `/api/test-db-structure` 호출해서 컬럼 목록 확인
2. 브라우저 Console에서 오류 메시지 확인
3. Cloudflare Pages 로그 확인:
   - Dashboard → Workers & Pages → superplace-academy → Logs
   - "📝 동적 INSERT SQL" 로그 찾기
   - 실제 생성된 SQL 확인

### 문제: 목록에 안 보임
**확인 순서**:
1. 브라우저 새로고침 (Ctrl+Shift+R)
2. `/api/admin/debug-landing-pages` 호출해서 데이터 존재 확인
3. SELECT 쿼리 오류 확인

### 문제: slug 관련 오류
**해결**:
```sql
ALTER TABLE landing_pages ADD COLUMN slug TEXT;
UPDATE landing_pages SET slug = 'lp-' || id WHERE slug IS NULL;
```

## 📋 테스트 체크리스트

배포 완료 후 (약 5분) 다음을 확인:

- [ ] `/api/test-db-structure` 호출 → 테이블 구조 확인
- [ ] `/dashboard/landing-pages` 접속 → 기존 목록 표시
- [ ] 새 랜딩페이지 생성 → 성공 메시지
- [ ] 목록에 새 항목 표시 확인
- [ ] `/lp/{slug}` 접근 → 정상 표시
- [ ] 오류 팝업 없음

**모두 체크되면 복구 완료!** ✅

## 🔄 최종 확인 명령어

```bash
# 1. 테이블 구조
curl https://superplace-academy.pages.dev/api/test-db-structure

# 2. 디버그 정보
curl https://superplace-academy.pages.dev/api/admin/debug-landing-pages

# 3. 브라우저 테스트
# - https://superplace-academy.pages.dev/dashboard/landing-pages
# - 새 랜딩페이지 생성
# - 생성된 페이지 접근
```

---

**작성일**: 2026-03-07  
**커밋**: 142887f2  
**상태**: 배포 대기 중
