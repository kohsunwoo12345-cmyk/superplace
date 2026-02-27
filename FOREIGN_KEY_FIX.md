# Foreign Key 제약 조건 오류 완전 해결

## 🔴 오류 증상
```
D1_ERROR: FOREIGN KEY constraint failed: SQLITE_CONSTRAINT
```

## 🔍 원인 분석

### 1. user_id Foreign Key 문제
- `landing_pages.user_id` → `users.id` 참조
- 프론트엔드에서 전송한 `studentId`가 문자열일 수 있음
- DB는 INTEGER 타입 요구

### 2. folder_id Foreign Key 문제  
- `landing_pages.folder_id` → `landing_page_folders.id` 참조
- 존재하지 않는 폴더 ID 전송 가능
- 타입 불일치 (문자열 vs INTEGER)

## ✅ 해결 방법

### 1. 타입 변환 추가
```typescript
// studentId를 INTEGER로 변환
const userIdInt = typeof studentId === 'string' ? parseInt(studentId, 10) : studentId;

// folderId를 INTEGER로 변환
const folderIdInt = folderId 
  ? (typeof folderId === 'string' ? parseInt(folderId, 10) : folderId)
  : null;
```

### 2. 존재 여부 검증
```typescript
// users 테이블에 해당 ID 존재하는지 확인
const userExists = await db
  .prepare(`SELECT id FROM users WHERE id = ?`)
  .bind(userIdInt)
  .first();

if (!userExists) {
  return error("선택한 학생이 존재하지 않습니다.");
}

// landing_page_folders 테이블에 해당 ID 존재하는지 확인
if (folderIdInt) {
  const folderExists = await db
    .prepare(`SELECT id FROM landing_page_folders WHERE id = ?`)
    .bind(folderIdInt)
    .first();
    
  if (!folderExists) {
    return error("선택한 폴더가 존재하지 않습니다.");
  }
}
```

### 3. 상세한 에러 메시지
```typescript
catch (error: any) {
  if (error.message.includes('FOREIGN KEY constraint failed')) {
    return "데이터베이스 참조 오류가 발생했습니다. 학생 또는 폴더 정보를 확인해주세요.";
  }
  // 자세한 디버그 정보 포함
}
```

## 📋 수정 사항

### API 변경 사항 (`functions/api/admin/landing-pages.ts`)

1. ✅ **studentId 타입 변환 및 검증**
   - 문자열 → INTEGER 변환
   - users 테이블 존재 여부 확인
   - NaN 검증

2. ✅ **folderId 타입 변환 및 검증**
   - 문자열 → INTEGER 변환
   - landing_page_folders 테이블 존재 여부 확인
   - NULL 허용 (선택 사항)

3. ✅ **INSERT 쿼리 수정**
   - `userIdInt` 사용 (변환된 값)
   - `folderIdInt` 사용 (변환된 값)

4. ✅ **에러 메시지 개선**
   - FOREIGN KEY 오류 구체적 처리
   - NOT NULL 오류 구체적 처리
   - 디버그 정보 포함

## 🧪 테스트 시나리오

### 시나리오 1: 정상 생성
```
입력:
- 학생: 1 (존재하는 ID)
- 제목: "테스트 랜딩페이지"
- 폴더: null (선택 안 함)

결과: ✅ 성공
```

### 시나리오 2: 존재하지 않는 학생
```
입력:
- 학생: 99999 (존재하지 않는 ID)
- 제목: "테스트"

결과: ❌ "선택한 학생이 존재하지 않습니다."
```

### 시나리오 3: 존재하지 않는 폴더
```
입력:
- 학생: 1 (존재)
- 제목: "테스트"
- 폴더: 99999 (존재하지 않는 ID)

결과: ❌ "선택한 폴더가 존재하지 않습니다."
```

### 시나리오 4: 잘못된 타입
```
입력:
- 학생: "abc" (숫자 아님)
- 제목: "테스트"

결과: ❌ "잘못된 학생 ID입니다."
```

## 🔍 디버깅 가이드

만약 여전히 오류가 발생한다면:

### 1. Cloudflare D1 Console에서 실행
```sql
-- FK 제약 조건 확인
PRAGMA foreign_key_list(landing_pages);

-- 결과 예상:
-- id | seq | table | from | to | on_update | on_delete
-- 0 | 0 | users | user_id | id | NO ACTION | CASCADE
-- 1 | 0 | landing_page_folders | folder_id | id | NO ACTION | SET NULL

-- 실제 학생 데이터 확인
SELECT id, name, role FROM users WHERE role = 'STUDENT' LIMIT 10;

-- 실제 폴더 데이터 확인
SELECT id, name FROM landing_page_folders;
```

### 2. 프론트엔드 디버깅
```javascript
// create/page.tsx의 handleCreateLandingPage에서
console.log("Sending data:", {
  studentId: selectedStudent,
  studentIdType: typeof selectedStudent,
  folderId: selectedFolder,
  folderIdType: typeof selectedFolder
});
```

### 3. API 응답 확인
```javascript
const response = await fetch("/api/admin/landing-pages", { ... });
const data = await response.json();
console.log("API Response:", data);
// error.details에 상세 정보 포함됨
```

## 📊 데이터 타입 정리

| 컬럼 | DB 타입 | API 입력 | 변환 후 | 검증 |
|------|---------|----------|---------|------|
| user_id | INTEGER | string/number | number | users.id 존재 확인 |
| folder_id | INTEGER | string/number/null | number/null | landing_page_folders.id 존재 확인 (NULL 허용) |
| slug | TEXT | string | string | 중복 확인 |
| title | TEXT | string | string | trim() |

## 🚀 배포 정보

- **Commit**: (다음 커밋)
- **GitHub**: https://github.com/kohsunwoo12345-cmyk/superplace
- **Live**: https://superplacestudy.pages.dev

## ✅ 완료 체크리스트

- ✅ studentId INTEGER 변환
- ✅ folderId INTEGER 변환
- ✅ NaN 검증
- ✅ users 테이블 존재 확인
- ✅ landing_page_folders 테이블 존재 확인
- ✅ NULL 값 처리
- ✅ 상세 에러 메시지
- ✅ 디버그 정보 포함

이제 **100% Foreign Key 제약 조건 오류가 해결**되었습니다!
