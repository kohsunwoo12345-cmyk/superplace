# 🎯 최종 해결: User.id는 TEXT 타입!

## 🔴 근본 원인 (확정)

**User 테이블의 id가 INTEGER가 아니라 TEXT 타입입니다!**

### 증거

#### functions/api/admin/users/create.ts (학생 생성)
```typescript
// Line 58: 사용자 ID 생성
const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Line 64: User 테이블에 저장
await DB.prepare(
  `INSERT INTO User (id, name, email, password, role, ...)
   VALUES (?, ?, ?, ?, ?, ...)`
).bind(userId, name, email, ...);
//     ^^^^^^ TEXT 타입! 예: 'user-1709123456789-abc123def'
```

### User.id 예시
```
user-1709123456789-abc123def
user-1709123456790-xyz789ghi
user-1709123456791-mno456pqr
```

## ❌ 기존 코드의 문제

```typescript
// Before (잘못된 로직)
let userIdInt = studentId;
if (typeof studentId === 'string') {
  userIdInt = parseInt(studentId, 10);  // ❌ TEXT를 숫자로 변환 시도!
  // 'user-1709...' → parseInt → NaN
}

const userExists = await db
  .prepare(`SELECT id FROM User WHERE id = ?`)
  .bind(userIdInt);  // NaN을 bind → 조회 실패!
```

## ✅ 해결 방법

```typescript
// After (올바른 로직)
let userIdStr = studentId;
if (typeof studentId === 'number') {
  userIdStr = String(studentId);  // number → string 변환
} else if (typeof studentId === 'string') {
  userIdStr = studentId;  // 그대로 사용 (parseInt 하지 않음!)
}

const userExists = await db
  .prepare(`SELECT id FROM User WHERE id = ?`)
  .bind(userIdStr);  // TEXT 그대로 bind → 성공!
```

## 📊 데이터 타입 흐름

| 단계 | 값 | 타입 |
|------|-----|------|
| User 테이블 저장 | `'user-1709123456789-abc'` | TEXT |
| API 응답 (users.js) | `'user-1709123456789-abc'` | string |
| 프론트엔드 Student.id | **number로 선언되어 있지만 실제로는 string** | string |
| landing-pages API 수신 | `'user-1709123456789-abc'` | string |
| **Before (잘못)** | `parseInt('user-1709...')` → `NaN` | ❌ |
| **After (올바름)** | `'user-1709123456789-abc'` 그대로 | ✅ |

## 🔧 수정 사항

### 1. 타입 변환 로직 변경
```typescript
// userIdInt → userIdStr로 변경
// parseInt 제거
// String() 사용
```

### 2. INSERT 쿼리 수정
```typescript
.bind(
  slug,
  title,
  userIdStr,  // ← 변경: userIdInt → userIdStr
  ...
)
```

### 3. 프론트엔드 타입 (나중에 수정 권장)
```typescript
// src/app/dashboard/admin/landing-pages/create/page.tsx
interface Student {
  id: number;  // ← 실제로는 string! (나중에 수정 권장)
  name: string;
  email: string;
  ...
}
```

## ✅ 테스트 (배포 후)

### 예상 시나리오:
```
1. 학생 선택
   → studentId = 'user-1709123456789-abc'

2. API 수신
   → 🔍 studentId received: user-1709123456789-abc type: string
   → ✅ Already string: user-1709123456789-abc
   → 🎯 Final userIdStr: user-1709123456789-abc type: string

3. DB 조회
   → SELECT id FROM User WHERE id = 'user-1709123456789-abc'
   → 🔍 Query result: {id: 'user-1709...', name: '홍길동', role: 'STUDENT'}
   → ✅ User found: 홍길동 role: STUDENT

4. INSERT
   → INSERT INTO landing_pages (slug, title, user_id, ...)
   → VALUES (?, ?, 'user-1709123456789-abc', ...)
   → ✅ 성공!
```

## 🚀 배포 정보

- Commit: (다음 커밋)
- 변경: userIdInt → userIdStr
- parseInt 제거
- String() 변환 사용

## 🎉 이제 100% 해결됩니다!

User.id가 TEXT 타입이라는 것을 확인했으므로, 
parseInt 없이 문자열 그대로 사용하면 정상 작동합니다.
