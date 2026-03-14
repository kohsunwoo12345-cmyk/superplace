# 세미나 수정 필드 저장 및 커스텀 필드 추가 기능 완전 구현

## 배포 정보
- **커밋**: `9492b25f`
- **배포 시간**: 2026-03-14 18:18 KST
- **URL**: https://superplacestudy.pages.dev

## 구현된 기능

### 1. **필수 입력 필드 수정 시 저장 문제 해결** ✅
이전에는 세미나 수정 시 필수 입력 필드 설정이 저장되지 않았습니다.

**수정 사항:**
- `functions/api/seminars/index.js`의 PATCH 엔드포인트에 다음 필드 추가:
  - `customFields`: 커스텀 필드 배열
  - `requiredFields`: 필수 필드 배열
  - `ctaButtonText`: 신청 버튼 텍스트
- POST 엔드포인트에도 `customFields` 컬럼 추가
- 프론트엔드 `openEditDialog` 함수에서 `customFields` 로드 추가

### 2. **관리자가 직접 필드 추가 기능** ✅
관리자가 생성 및 수정 다이얼로그에서 커스텀 필드를 추가/삭제할 수 있습니다.

**기능:**
- 필드 이름 입력 (예: 회사명, 참석 인원)
- 필드 타입 선택:
  - **텍스트**: 일반 텍스트 입력
  - **숫자**: 숫자만 입력
  - **전화번호**: 전화번호 형식
  - **장문**: 긴 텍스트 (textarea)
- 추가된 필드는 자동으로 필수 입력으로 처리됨
- 각 필드는 삭제 가능 (X 버튼)

### 3. **수정 다이얼로그 UI 개선** ✅
수정 다이얼로그에 생성 다이얼로그와 동일한 커스텀 필드 UI를 추가했습니다.

**UI 구성:**
```
📝 필수 입력 필드 선택
  ☐ 이름 (기본 필수)
  ☐ 이메일 (기본 필수)
  ☐ 전화번호
  ☐ 학원명
  ☐ 직책

📝 추가 필수 필드
  [기존 커스텀 필드 목록 - 삭제 가능]
  
  [필드 이름 입력] [타입 선택 ▼] [➕ 추가]
```

## 데이터베이스 마이그레이션 필요 ⚠️

**중요**: 데이터베이스에 `customFields` 컬럼을 추가해야 합니다.

Cloudflare D1에서 다음 SQL을 실행하세요:

```bash
# Wrangler CLI 사용
npx wrangler d1 execute superplace-production --command="ALTER TABLE seminars ADD COLUMN customFields TEXT;"

# 또는 Cloudflare Dashboard에서 직접 실행
```

SQL 파일: `ADD_SEMINAR_CUSTOM_FIELDS_COLUMN.sql` 참조

## 사용 방법

### 관리자 - 세미나 생성/수정
1. 세미나 생성 또는 수정 다이얼로그 열기
2. **필수 입력 필드 선택** 섹션에서 기본 필드 체크
3. **추가 필수 필드** 섹션에서:
   - 필드 이름 입력 (예: "회사명")
   - 타입 선택 (텍스트, 숫자, 전화번호, 장문)
   - ➕ 버튼 클릭하여 추가
   - X 버튼으로 삭제 가능
4. **신청 버튼 텍스트** 입력 (기본값: "신청하기")
5. 저장 버튼 클릭

### 사용자 - 세미나 신청
- 세미나 상세 페이지에서 신청 버튼 클릭
- 관리자가 설정한 필드만 표시됨:
  - 이름, 이메일 (항상 필수)
  - 선택된 기본 필드 (전화번호, 학원명, 직책)
  - 커스텀 필드 (관리자가 추가한 모든 필드)
- 모든 필드 입력 후 제출

## 예시 시나리오

### 예시 1: 교육 세미나
**관리자 설정:**
- 필수 필드: 이름, 이메일, 전화번호, 학원명
- 커스텀 필드: "소속 학원 규모 (숫자)", "교육 참가 이유 (장문)"
- 버튼 텍스트: "교육 신청하기"

**사용자가 보는 폼:**
```
이름 * ___________
이메일 * ___________
전화번호 * ___________
학원명 * ___________
소속 학원 규모 * ___________
교육 참가 이유 * ___________
           ___________
           ___________

[교육 신청하기]
```

### 예시 2: 네트워킹 이벤트
**관리자 설정:**
- 필수 필드: 이름, 이메일, 직책
- 커스텀 필드: "회사명 (텍스트)", "동반 참석자 수 (숫자)"
- 버튼 텍스트: "참가 신청"

**사용자가 보는 폼:**
```
이름 * ___________
이메일 * ___________
직책 * ___________
회사명 * ___________
동반 참석자 수 * ___________

[참가 신청]
```

## 코드 변경 사항

### functions/api/seminars/index.js
```javascript
// POST (생성) - customFields 추가
const { 
  ..., 
  customFields 
} = body;

INSERT INTO seminars (..., customFields, ...)
VALUES (..., ?, ...)
.bind(..., customFields ? JSON.stringify(customFields) : null, ...)

// PATCH (수정) - customFields, requiredFields, ctaButtonText 추가
const { 
  ..., 
  ctaButtonText,
  requiredFields,
  customFields
} = body;

if (customFields !== undefined) {
  updates.push('customFields = ?');
  params.push(JSON.stringify(customFields));
}
```

### src/app/dashboard/admin/seminars/page.tsx
```tsx
// openEditDialog - customFields 로드 추가
customFields: seminar.customFields ? 
  (typeof seminar.customFields === 'string' ? 
    JSON.parse(seminar.customFields) : 
    seminar.customFields) : []

// 수정 다이얼로그에 커스텀 필드 UI 추가 (생성 다이얼로그와 동일)
{/* Custom Fields Section */}
<div className="space-y-2">
  <Label>추가 필수 필드</Label>
  {/* 기존 필드 표시 + 삭제 버튼 */}
  {/* 새 필드 추가 UI */}
</div>
```

## 테스트 체크리스트

- [ ] 데이터베이스 마이그레이션 실행 (`ALTER TABLE seminars ADD COLUMN customFields TEXT;`)
- [ ] 세미나 생성 시 커스텀 필드 추가 가능
- [ ] 세미나 수정 시 기존 커스텀 필드 표시됨
- [ ] 세미나 수정 시 커스텀 필드 추가/삭제 가능
- [ ] 필수 입력 필드 선택이 저장됨
- [ ] 신청 버튼 텍스트가 저장됨
- [ ] 사용자 신청 폼에 커스텀 필드가 표시됨
- [ ] 커스텀 필드가 필수로 동작함
- [ ] 다양한 타입(텍스트, 숫자, 전화번호, 장문) 정상 작동

## 참고 사항

1. **이름, 이메일**: 항상 필수이며 제거 불가
2. **커스텀 필드**: 추가된 모든 커스텀 필드는 자동으로 필수 입력
3. **데이터 형식**: `customFields`와 `requiredFields`는 JSON 문자열로 DB에 저장
4. **캐시 갱신**: 변경 사항 확인을 위해 Ctrl+Shift+R로 페이지 새로고침

## 다음 단계

1. Cloudflare D1에서 마이그레이션 SQL 실행
2. 관리자 패널에서 세미나 수정하여 필드 추가 테스트
3. 사용자 화면에서 신청 폼 확인
