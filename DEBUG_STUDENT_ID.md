# 학생 ID 디버깅 가이드

## 문제 증상
```
"잘못된 학생 ID입니다." 팝업 발생
```

## 원인 분석

### 가능한 원인들:
1. `studentId`가 `null` 또는 `undefined`
2. `studentId`가 문자열이지만 숫자로 변환 불가
3. `studentId`가 소수점 숫자 (INTEGER 아님)
4. `parseInt` 또는 `Number` 변환 시 `NaN` 발생

## 디버깅 방법

### 1. 브라우저 콘솔 확인 (개발자 도구)

랜딩페이지 생성 시 다음 로그 확인:

```javascript
🔍 Sending to API: {
  studentId: 1,
  studentIdType: "number",
  folderId: null,
  folderIdType: "object"
}
```

**확인 사항:**
- `studentId` 값이 있는가?
- `studentIdType`이 "number" 또는 "string"인가?
- 값이 `null`, `undefined`, `NaN`이 아닌가?

### 2. Cloudflare Workers 로그 확인

Cloudflare 대시보드 → Workers & Pages → superplace → Logs

```
🔍 API Received Data: {
  studentId: 1,
  studentIdType: "number",
  folderId: null,
  folderIdType: "object",
  slug: "lp_...",
  title: "..."
}

🔍 After conversion: {
  original: 1,
  originalType: "number",
  converted: 1,
  convertedType: "number",
  isNaN: false
}
```

**확인 사항:**
- `studentId`가 올바르게 전달되는가?
- 변환 후 `isNaN`이 `false`인가?
- `isInteger`가 `true`인가?

### 3. 네트워크 탭 확인

개발자 도구 → Network → `/api/admin/landing-pages` POST 요청

**Request Payload:**
```json
{
  "slug": "lp_1234567890_abc123",
  "studentId": 1,
  "title": "테스트 랜딩페이지",
  "folderId": null,
  ...
}
```

**Response (오류 시):**
```json
{
  "error": "잘못된 학생 ID입니다.",
  "details": "studentId: 1 (type: number) → converted: 1 → isNaN: false, isInteger: true"
}
```

## 해결 방법

### API 수정 사항

1. **null/undefined 체크 강화**
```typescript
if (!studentId && studentId !== 0) {
  return error("학생을 선택해주세요.");
}
```

2. **Number() 사용으로 변환 개선**
```typescript
// Before
const userIdInt = typeof studentId === 'string' ? parseInt(studentId, 10) : studentId;

// After
const userIdInt = typeof studentId === 'string' ? parseInt(studentId, 10) : Number(studentId);
```

3. **isInteger 추가 검증**
```typescript
if (isNaN(userIdInt) || !Number.isInteger(userIdInt)) {
  return error("잘못된 학생 ID입니다.");
}
```

4. **상세한 에러 메시지**
```typescript
details: `studentId: ${studentId} (type: ${typeof studentId}) → converted: ${userIdInt} → isNaN: ${isNaN(userIdInt)}, isInteger: ${Number.isInteger(userIdInt)}`
```

## 테스트 시나리오

### 시나리오 1: 정상 (number)
```javascript
Input: studentId = 1
Expected: ✅ 통과 → userIdInt = 1
```

### 시나리오 2: 정상 (string)
```javascript
Input: studentId = "1"
Expected: ✅ 통과 → userIdInt = 1
```

### 시나리오 3: null
```javascript
Input: studentId = null
Expected: ❌ "학생을 선택해주세요."
```

### 시나리오 4: undefined
```javascript
Input: studentId = undefined
Expected: ❌ "학생을 선택해주세요."
```

### 시나리오 5: 잘못된 문자열
```javascript
Input: studentId = "abc"
Expected: ❌ "잘못된 학생 ID입니다."
```

### 시나리오 6: 소수점
```javascript
Input: studentId = 1.5
Expected: ❌ "잘못된 학생 ID입니다." (isInteger 실패)
```

### 시나리오 7: 0
```javascript
Input: studentId = 0
Expected: ❌ "잘못된 학생 ID입니다." (users.id는 보통 1부터 시작)
```

## 실제 테스트 방법

### 1. 학생 선택 전
```
동작: "생성하기" 클릭
예상: "학생을 선택해주세요." 팝업
```

### 2. 학생 선택 후
```
동작:
1. 학생 카드 클릭 (예: "홍길동")
2. 콘솔에서 studentId 확인
3. "생성하기" 클릭

예상: 
- 콘솔: 🔍 Sending to API: { studentId: 1, ... }
- API 로그: 🔍 After conversion: { converted: 1, isNaN: false }
- 결과: ✅ 성공
```

### 3. 수동으로 잘못된 값 테스트 (개발자 전용)
```javascript
// 브라우저 콘솔에서
const response = await fetch("/api/admin/landing-pages", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_TOKEN",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    slug: "test-slug",
    title: "테스트",
    studentId: "abc", // 잘못된 값
  })
});

const data = await response.json();
console.log(data);
// { error: "잘못된 학생 ID입니다.", details: "..." }
```

## 현재 상태 확인

### Commit: 7bc8dc4 (디버깅 로그 추가)
- ✅ 프론트엔드 로그 추가
- ✅ API 로그 추가
- ✅ details 필드에 디버그 정보 포함

### 다음 Commit (이 파일과 함께 배포)
- ✅ null/undefined 체크 강화
- ✅ Number() 변환 사용
- ✅ isInteger 검증 추가
- ✅ 중복 체크 제거

## 배포 후 확인 사항

1. https://superplacestudy.pages.dev/dashboard/admin/landing-pages/create 접속
2. 학생 선택 없이 "생성하기" → "학생을 선택해주세요." 확인
3. 학생 선택 후 "생성하기" → 브라우저 콘솔 로그 확인
4. 오류 발생 시 `error.details` 확인하여 정확한 원인 파악

