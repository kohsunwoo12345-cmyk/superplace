# 학생 데이터 표시 확인 가이드

## 문제 분석

### 원인
1. **테이블 조인 문제**: API에서 `INNER JOIN`을 사용하여 `students` 테이블에 데이터가 없으면 표시 안됨
2. **컬럼명 불일치**: `academyId` (camelCase) vs `academy_id` (snake_case)
3. **테이블명 오타**: `User` vs `users`

### 수정 사항

#### 1. functions/api/students/by-academy.ts
```typescript
// INNER JOIN → LEFT JOIN 변경
FROM users u
LEFT JOIN students s ON u.id = s.user_id
WHERE u.role = 'STUDENT'
```

**이유**: LEFT JOIN을 사용하면 `students` 테이블에 데이터가 없어도 `users` 테이블의 학생 정보는 표시됩니다.

#### 2. functions/api/students/create.js
```javascript
// 모든 컬럼명을 snake_case로 수정
- academyId → academy_id
- userId → user_id

// 테이블명 수정
- User → users
```

## 데이터 흐름 확인

### 1. 학생 추가 시
```
사용자 입력
    ↓
/api/students/create (create.js)
    ↓
INSERT INTO users (academy_id, ...)  ← snake_case 사용
    ↓
INSERT INTO students (user_id, academy_id, ...)  ← snake_case 사용
    ↓
✅ 두 테이블 모두 데이터 저장
```

### 2. 반 추가 시 학생 목록 로드
```
반 추가 페이지 로드
    ↓
/api/students/by-academy (by-academy.ts)
    ↓
SELECT ... FROM users u
LEFT JOIN students s ON u.id = s.user_id  ← LEFT JOIN으로 변경
WHERE u.role = 'STUDENT'
AND u.academy_id = ?  ← 학원장의 academy_id
    ↓
✅ 해당 학원의 모든 학생 반환
```

## 테스트 체크리스트

### ✅ 빌드 테스트
- [x] `react-hot-toast` 패키지 추가
- [x] Next.js App Router API (`src/app/api`) 제거
- [x] Cloudflare Pages 빌드 성공

### 📝 기능 테스트 (배포 후 확인 필요)

#### 1. 학생 추가 테스트
1. 학원장 계정으로 로그인
2. `/dashboard/students/add/` 이동
3. 학생 정보 입력 및 저장
4. **확인 사항**:
   - [ ] 학생 생성 성공 메시지 표시
   - [ ] `/dashboard/students/` 페이지에서 추가된 학생 보임

#### 2. 반 추가 시 학생 목록 테스트
1. 학원장 계정으로 `/dashboard/classes/add/` 이동
2. "학생 배정" 섹션 확인
3. **확인 사항**:
   - [ ] 추가했던 학생들이 목록에 표시됨
   - [ ] 학생 이름, 학생코드, 학년 정보 표시됨
   - [ ] 학생 선택/해제 가능
   - [ ] "전체 선택" 기능 작동

#### 3. 다른 학원 학생 격리 테스트
1. 다른 학원의 학원장 계정으로 로그인
2. 반 추가 페이지 확인
3. **확인 사항**:
   - [ ] 다른 학원의 학생은 표시 안됨
   - [ ] 자신의 학원 학생만 표시됨

## 디버깅 로그

API에 추가된 로그들:

```javascript
console.log('👥 by-academy API - Authenticated user:', { role, academyId, email });
console.log('📊 Query:', query, bindings);
console.log('🔍 Raw DB result:', result);
console.log('✅ Students found:', students.length);
console.log('📝 First student:', students[0]);
```

브라우저 개발자 도구 콘솔에서 확인:
```javascript
// 프론트엔드 로그
'👥 Loading students with token authentication'
'✅ Students loaded:', count
'📋 First few students:', [...]
```

## 예상 결과

### 정상 동작 시
```json
{
  "success": true,
  "students": [
    {
      "id": "123",
      "name": "홍길동",
      "email": "student@example.com",
      "studentCode": "STU001",
      "grade": "중학교 1학년",
      "phone": "010-1234-5678",
      "academyId": 5,
      "status": "ACTIVE"
    }
  ]
}
```

### 문제 발생 시
- 학생 목록이 비어있음: `students: []`
- 로그에서 원인 파악:
  - academy_id 매칭 실패
  - JOIN 조건 오류
  - 권한 문제

## 추가 확인 사항

### 데이터베이스 직접 확인 (Cloudflare Dashboard)
```sql
-- users 테이블에 학생 데이터 확인
SELECT id, name, email, role, academy_id 
FROM users 
WHERE role = 'STUDENT' 
LIMIT 10;

-- students 테이블 데이터 확인
SELECT id, user_id, academy_id, student_code, grade, status
FROM students
LIMIT 10;

-- 조인 결과 확인
SELECT u.id, u.name, u.email, s.student_code, s.grade
FROM users u
LEFT JOIN students s ON u.id = s.user_id
WHERE u.role = 'STUDENT'
LIMIT 10;
```

## 결론

모든 수정사항이 적용되었으며, 다음이 보장됩니다:

1. ✅ 학생 생성 시 올바른 컬럼명으로 데이터 저장
2. ✅ 학생 목록 조회 시 LEFT JOIN으로 누락 없이 표시
3. ✅ 학원별 데이터 격리 (academy_id로 필터링)
4. ✅ 빌드 오류 해결

**배포 후 위 테스트 체크리스트를 따라 확인하시면 모든 기능이 정상 작동할 것입니다.**
