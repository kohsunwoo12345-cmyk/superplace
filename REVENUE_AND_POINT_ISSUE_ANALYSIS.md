# 매출 관리 및 포인트 충전 시스템 문제 분석

## 📋 문제 현황

1. **관리자 매출 관리 페이지에 정확한 데이터가 표시되지 않음**
   - 구독 매출
   - AI봇 쇼핑몰 매출
   - 포인트 충전 매출

2. **포인트 충전 시 원장 계정에 정확히 반영되지 않음**

## 🔍 문제 분석

### 1. 매출 API (`/api/admin/revenue`) 분석

**현재 구현 상태:**
```typescript
// ✅ 포인트 충전 매출 조회 (Line 145-202)
SELECT pcr.*, u.*, a.*
FROM PointChargeRequest pcr
LEFT JOIN users u ON pcr.userId = u.id
LEFT JOIN academy a ON u.academyId = a.id
WHERE pcr.status = 'APPROVED'

// ✅ AI 쇼핑몰 매출 조회 (Line 204-261)
SELECT bpr.*, u.*, a.*
FROM BotPurchaseRequest bpr
LEFT JOIN users u ON bpr.userId = u.id  
LEFT JOIN academy a ON bpr.academyId = a.id
WHERE bpr.status = 'APPROVED'

// ✅ 매출 통합 및 계산 (Line 263-301)
- pointRevenue = 포인트 충전 총액
- botRevenue = AI 쇼핑몰 총액
- pointVAT / botVAT = 부가세 계산
- 전체 거래 목록 통합 및 정렬
```

**✅ 상태:** 매출 조회 로직은 정상적으로 구현되어 있음

### 2. 포인트 충전 승인 API (`/api/admin/point-charge-requests/approve`) 분석

**문제점 발견:**

```typescript
// ❌ Line 110-112: 테이블명 불일치
const user = await env.DB.prepare(`
  SELECT id, email, name, academyId FROM users WHERE id = ?  // ❌ users (소문자)
`).bind(requestInfo.userId).first();

// ❌ Line 137-142: 테이블명 불일치
await env.DB.prepare(`
  UPDATE users  // ❌ users (소문자)
  SET points = COALESCE(points, 0) + ?,
      updatedAt = ?
  WHERE id = ?
`).bind(requestInfo.requestedPoints, now, requestInfo.userId).run();

// ❌ Line 151-153: 테이블명 불일치
const updatedUser = await env.DB.prepare(`
  SELECT points FROM users WHERE id = ?  // ❌ users (소문자)
`).bind(requestInfo.userId).first();
```

**실제 테이블명:** `User` (대문자 U)

**영향:**
- 포인트 충전 승인 시 사용자를 찾지 못함
- 포인트가 실제 계정에 반영되지 않음
- 원장(DIRECTOR) 계정의 포인트가 증가하지 않음

### 3. 포인트 지급/차감 API (`/api/admin/users/[id]/points.js`)

**현재 구현:**
```javascript
// ✅ Line 68-69: 올바른 테이블명 사용
const userResult = await env.DB.prepare(
  'SELECT id, email, name, points FROM User WHERE id = ?'  // ✅ User (대문자)
).bind(userId).first();

// ✅ Line 99-101: 올바른 테이블명 사용
const updateResult = await env.DB.prepare(
  'UPDATE User SET points = ?, updatedAt = datetime("now") WHERE id = ?'  // ✅ User
).bind(newPoints, userId).run();
```

**✅ 상태:** 정상 작동

## 🔧 해결 방안

### 1. 포인트 충전 승인 API 수정

**수정 파일:** `functions/api/admin/point-charge-requests/approve.ts`

#### 1.1 사용자 조회 수정
```typescript
// BEFORE
const user = await env.DB.prepare(`
  SELECT id, email, name, academyId FROM users WHERE id = ?
`).bind(requestInfo.userId).first();

// AFTER
const user = await env.DB.prepare(`
  SELECT id, email, name, role, academyId, points FROM User WHERE id = ?
`).bind(requestInfo.userId).first();
```

#### 1.2 포인트 업데이트 수정
```typescript
// BEFORE
await env.DB.prepare(`
  UPDATE users
  SET points = COALESCE(points, 0) + ?,
      updatedAt = ?
  WHERE id = ?
`).bind(requestInfo.requestedPoints, now, requestInfo.userId).run();

// AFTER
await env.DB.prepare(`
  UPDATE User
  SET points = COALESCE(points, 0) + ?,
      updatedAt = ?
  WHERE id = ?
`).bind(requestInfo.requestedPoints, now, requestInfo.userId).run();
```

#### 1.3 최종 포인트 확인 수정
```typescript
// BEFORE
const updatedUser = await env.DB.prepare(`
  SELECT points FROM users WHERE id = ?
`).bind(requestInfo.userId).first();

// AFTER
const updatedUser = await env.DB.prepare(`
  SELECT id, email, name, role, academyId, points FROM User WHERE id = ?
`).bind(requestInfo.userId).first();
```

#### 1.4 포인트 증가 전후 로깅 추가
```typescript
// 포인트 증가 전
const beforePoints = user.points || 0;
console.log('💰 Before point increase:', {
  userId: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  academyId: user.academyId,
  currentPoints: beforePoints,
  pointsToAdd: requestInfo.requestedPoints
});

// 포인트 업데이트

// 포인트 증가 후
const afterPoints = updatedUser.points || 0;
console.log('✅ After point increase:', {
  userId: updatedUser.id,
  beforePoints,
  afterPoints,
  added: afterPoints - beforePoints
});
```

### 2. 매출 API 검증 및 개선

**수정 파일:** `functions/api/admin/revenue.ts`

#### 2.1 포인트 충전 매출 조회 개선
```typescript
// Line 148: users → User로 수정 가능성 확인
// 현재는 users를 사용 중이므로 일관성 확인 필요

// OPTION 1: revenue API도 User로 통일
LEFT JOIN User u ON pcr.userId = u.id

// OPTION 2: 현재 schema에 맞게 users 사용 유지
// (DB에 users 테이블이 실제로 존재하는 경우)
```

#### 2.2 매출 통계 정확도 향상
```typescript
// 포인트 충전 매출 계산 개선
const pointRevenue = pointTransactions.reduce((sum, p: any) => {
  const amount = parseFloat(p.amount) || 0;
  return sum + amount;
}, 0);

// AI 쇼핑몰 매출 계산 개선
const botRevenue = botTransactions.reduce((sum, b: any) => {
  const amount = parseFloat(b.amount) || 0;
  return sum + amount;
}, 0);

// VAT 계산 정확도 향상 (소수점 처리)
const botVAT = Math.round(botRevenue * 0.1 * 100) / 100; // 소수점 2자리
```

#### 2.3 매출 유형 표시 개선
```typescript
// 프론트엔드에서 표시할 때 한글 이름 매핑
const typeDisplayNames = {
  'POINT_CHARGE': '포인트 충전',
  'AI_SHOPPING': 'AI 쇼핑몰',
  'subscription': '구독',
  'tuition': '수업료',
  'materials': '교재비',
  'events': '이벤트',
  'other': '기타'
};
```

### 3. DB 스키마 일관성 확인

#### 3.1 User vs users 테이블 확인
```sql
-- 실제 테이블명 확인
SELECT name FROM sqlite_master 
WHERE type='table' AND (name='User' OR name='users');

-- User 테이블 스키마 확인
PRAGMA table_info(User);

-- users 테이블 스키마 확인 (존재하는 경우)
PRAGMA table_info(users);
```

#### 3.2 points 컬럼 존재 확인
```sql
-- User 테이블에 points 컬럼 확인
SELECT sql FROM sqlite_master WHERE type='table' AND name='User';

-- points 컬럼이 없으면 추가
ALTER TABLE User ADD COLUMN points INTEGER DEFAULT 0;
```

### 4. 원장 계정 포인트 반영 검증

#### 4.1 원장 role 확인
```typescript
// 포인트 충전 요청한 사용자가 원장인지 확인
if (user.role === 'DIRECTOR') {
  console.log('👤 User is DIRECTOR - points will be added to academy director account');
} else {
  console.log('ℹ️ User is', user.role, '- points will be added to user account');
}
```

#### 4.2 학원별 포인트 관리
```typescript
// 학원의 총 포인트 계산 (선택사항)
const academyTotalPoints = await env.DB.prepare(`
  SELECT SUM(points) as total
  FROM User
  WHERE academyId = ? AND role IN ('DIRECTOR', 'TEACHER')
`).bind(user.academyId).first();

console.log('🏫 Academy total points:', academyTotalPoints?.total || 0);
```

## 📊 수정 우선순위

| 우선순위 | 작업 | 파일 | 예상 시간 |
|---------|------|------|----------|
| 🔴 HIGH | 포인트 충전 승인 API 테이블명 수정 | `approve.ts` | 10분 |
| 🔴 HIGH | 포인트 증가 로깅 추가 | `approve.ts` | 5분 |
| 🔴 HIGH | 포인트 반영 검증 테스트 | - | 10분 |
| 🟡 MEDIUM | 매출 API 테이블명 일관성 확인 | `revenue.ts` | 10분 |
| 🟡 MEDIUM | 매출 계산 정확도 향상 | `revenue.ts` | 5분 |
| 🟢 LOW | DB 스키마 일관성 문서화 | - | 10분 |

**총 예상 시간:** 약 50분

## 🎯 기대 효과

### 1. 포인트 충전 정상화
- ✅ 원장 계정에 포인트 정확히 반영
- ✅ 충전 전후 포인트 로깅으로 추적 가능
- ✅ 충전 내역과 실제 포인트 일치

### 2. 매출 관리 페이지 정확성
- ✅ 포인트 충전 매출 정확히 표시
- ✅ AI봇 쇼핑몰 매출 정확히 표시
- ✅ 일반 구독 매출 정확히 표시
- ✅ VAT 계산 정확도 향상

### 3. 데이터 일관성
- ✅ User/users 테이블명 통일
- ✅ 모든 API에서 동일한 테이블 사용
- ✅ 스키마 문서화

## 🧪 테스트 시나리오

### 시나리오 1: 포인트 충전 및 반영 확인
1. 원장 계정으로 포인트 충전 요청 (10,000P)
2. 관리자가 승인
3. 원장 계정의 포인트 확인 (10,000P 증가 확인)
4. 매출 관리 페이지에서 포인트 충전 매출 확인

### 시나리오 2: 매출 통계 정확성 확인
1. 매출 관리 페이지 접속
2. 포인트 충전 매출 총액 확인
3. AI 쇼핑몰 매출 총액 확인
4. 일반 매출 총액 확인
5. 전체 합계가 정확한지 확인
6. VAT 계산이 정확한지 확인

### 시나리오 3: 원장 계정 포인트 사용
1. 원장 계정 포인트 확인
2. 포인트 사용 (예: AI 기능 사용)
3. 포인트 차감 확인
4. 활동 로그 확인

---

**작성일:** 2026-03-03  
**작성자:** AI 개발 어시스턴트  
**상태:** ✅ 분석 완료, 수정 대기 중
