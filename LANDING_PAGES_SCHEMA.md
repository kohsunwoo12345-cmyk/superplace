# Landing Pages 테이블 스키마 완전 정리

## 실제 DB 스키마 (Cloudflare D1)

| cid | name | type | notnull | dflt_value | pk |
|-----|------|------|---------|------------|-----|
| 0 | id | INTEGER | 0 | NULL | 1 (PK) |
| 1 | **user_id** | **INTEGER** | **1** | NULL | 0 |
| 2 | **slug** | **TEXT** | **1** | NULL | 0 |
| 3 | **title** | **TEXT** | **1** | NULL | 0 |
| 4 | **template_type** | **TEXT** | **1** | NULL | 0 |
| 5 | **content_json** | **TEXT** | **1** | NULL | 0 |
| 6 | **html_content** | **TEXT** | **1** | NULL | 0 |
| 7 | qr_code_url | TEXT | 0 | NULL | 0 |
| 8 | view_count | INTEGER | 0 | 0 | 0 |
| 9 | status | TEXT | 0 | 'active' | 0 |
| 10 | created_at | DATETIME | 0 | CURRENT_TIMESTAMP | 0 |
| 11 | updated_at | DATETIME | 0 | CURRENT_TIMESTAMP | 0 |
| 12 | folder_id | INTEGER | 0 | NULL | 0 |
| 13 | thumbnail_url | TEXT | 0 | NULL | 0 |
| 14 | og_title | TEXT | 0 | NULL | 0 |
| 15 | og_description | TEXT | 0 | NULL | 0 |
| 16 | form_template_id | INTEGER | 0 | NULL | 0 |
| 17 | form_id | INTEGER | 0 | NULL | 0 |
| 18 | header_pixel | TEXT | 0 | NULL | 0 |
| 19 | body_pixel | TEXT | 0 | NULL | 0 |
| 20 | conversion_pixel | TEXT | 0 | NULL | 0 |

## NOT NULL 제약이 있는 컬럼 (필수 입력)

1. **user_id** (INTEGER) - 학생 ID
2. **slug** (TEXT) - URL 슬러그 (고유값)
3. **title** (TEXT) - 랜딩페이지 제목
4. **template_type** (TEXT) - 템플릿 타입
5. **content_json** (TEXT) - 콘텐츠 JSON 데이터
6. **html_content** (TEXT) - HTML 콘텐츠

## API INSERT 쿼리 수정 내역

### Before (오류 발생)
```sql
INSERT INTO landing_pages (slug, title, user_id, created_at, updated_at)
VALUES (?, ?, ?, datetime('now'), datetime('now'))
```
❌ 오류: `template_type`, `content_json`, `html_content` NOT NULL 제약 위반

### After (수정 완료)
```sql
INSERT INTO landing_pages (
  slug, title, user_id, template_type, 
  content_json, html_content,
  qr_code_url, folder_id, thumbnail_url,
  og_title, og_description
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

## 기본값 설정

| 컬럼 | 기본값 | 설명 |
|------|--------|------|
| template_type | 'basic' | 기본 템플릿 |
| content_json | `{"templateType":"basic","data":{},"sections":[]}` | 빈 JSON 구조 |
| html_content | 생성된 HTML | title, subtitle, description 포함한 기본 HTML |
| qr_code_url | QR 서버 URL | showQrCode가 true일 때만 |
| folder_id | NULL | 폴더 미선택 시 |
| thumbnail_url | NULL | 썸네일 미제공 시 |
| og_title | NULL | OG 타이틀 미제공 시 |
| og_description | NULL | OG 설명 미제공 시 |

## 완료 체크리스트

- ✅ user_id (studentId 매핑)
- ✅ slug (고유 슬러그)
- ✅ title (제목)
- ✅ template_type ('basic' 기본값)
- ✅ content_json (JSON.stringify로 생성)
- ✅ html_content (HTML 템플릿 생성)
- ✅ qr_code_url (옵션)
- ✅ folder_id (옵션)
- ✅ thumbnail_url (옵션)
- ✅ og_title (옵션)
- ✅ og_description (옵션)
- ✅ created_at (CURRENT_TIMESTAMP 자동)
- ✅ updated_at (CURRENT_TIMESTAMP 자동)

## 테스트 시나리오

1. **최소 입력 테스트**
   - 학생 선택
   - 제목 입력
   - 생성하기 클릭
   - ✅ 성공 예상

2. **전체 입력 테스트**
   - 학생 선택
   - 제목, 부제목, 설명 입력
   - 템플릿 선택
   - 폴더 선택
   - OG 태그 입력
   - 생성하기 클릭
   - ✅ 성공 예상

3. **중복 슬러그 테스트**
   - 동일한 슬러그로 재생성
   - ❌ "이미 사용 중인 slug입니다." 오류 예상

## 배포 정보

- Commit: be179ea → (다음 커밋)
- GitHub: https://github.com/kohsunwoo12345-cmyk/superplace
- Live: https://superplacestudy.pages.dev
