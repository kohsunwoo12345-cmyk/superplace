# 긴급 디버깅 - role은 DIRECTOR인데 플랜이 안 나오는 경우

## 🔍 추가 확인 필요

role이 'DIRECTOR'로 정상인데도 플랜이 안 나온다면, **academyId 매칭 문제**입니다.

### Cloudflare D1 Console에서 다음을 순서대로 실행하세요:

```sql
-- 1. 구독이 있는 사용자들의 상세 정보
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  u.academyId,
  us.id as subscription_id,
  us.planName,
  us.status
FROM User u
LEFT JOIN user_subscriptions us ON us.userId = u.id
WHERE u.id IN ('test-user-1772098439', 'user-1771479246368-du957iw33');
```

**이 결과를 알려주세요!**

특히 확인할 점:
- `u.academyId` 값이 무엇인지
- `us.id` (구독)이 제대로 JOIN 되는지

---

## 🎯 추가 테스트

### 2. 현재 로그인한 사용자 정보

브라우저 콘솔 (F12):
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('=== 현재 로그인 사용자 ===');
console.log('ID:', user.id);
console.log('Email:', user.email);
console.log('Name:', user.name);
console.log('Role:', user.role);
console.log('AcademyId:', user.academyId);
```

**이 출력 결과도 알려주세요!**

---

## 💡 문제 유형

### Case 1: 로그인한 사용자와 구독이 있는 사용자가 다름

**증상**:
- 로그인: `user.id = 'user-abc'`
- 구독: `userId = 'test-user-1772098439'`

**해결**: 구독이 있는 계정으로 다시 로그인

---

### Case 2: academyId 불일치

**증상**:
- 로그인 사용자: `academyId = 'academy-A'`
- 구독 사용자: `academyId = 'academy-B'` 또는 `null`

**해결**:
```sql
-- 구독 있는 사용자의 academyId를 현재 사용자와 동일하게
UPDATE User 
SET academyId = '현재_사용자의_academyId' 
WHERE id = 'test-user-1772098439';
```

---

### Case 3: API가 잘못된 academyId로 조회

**증상**: 
- API 호출: `/api/subscription/check?academyId=wrong-id`
- 실제 User: `academyId = 'correct-id'`

**테스트**:
```javascript
// 브라우저 콘솔
const user = JSON.parse(localStorage.getItem('user'));

// API 직접 호출
fetch(`/api/subscription/check?academyId=${user.academyId}`)
  .then(r => r.json())
  .then(d => {
    console.log('=== API 응답 ===');
    console.log('Success:', d.success);
    console.log('HasSubscription:', d.hasSubscription);
    console.log('Subscription:', d.subscription);
    console.log('Message:', d.message);
  });
```

---

## 🔧 강제 테스트 쿼리

### 실제 API가 사용하는 쿼리를 직접 실행:

```sql
-- ⚠️ 'YOUR_ACADEMY_ID'를 실제 값으로 교체
SELECT us.* 
FROM user_subscriptions us
JOIN User u ON us.userId = u.id
WHERE u.academyId = 'YOUR_ACADEMY_ID'
  AND u.role = 'DIRECTOR'
  AND us.status = 'active'
ORDER BY us.endDate DESC
LIMIT 1;
```

**결과**:
- ✅ 1개 행 반환 → API는 정상, 프론트엔드 문제
- ❌ 0개 행 반환 → academyId가 맞지 않음

---

## ⚡ 빠른 해결 방법

### 가장 확실한 방법:

```sql
-- 1. 현재 로그인한 사용자 확인 (브라우저 콘솔)
const user = JSON.parse(localStorage.getItem('user'));
console.log('내 ID:', user.id);
console.log('내 AcademyId:', user.academyId);

-- 2. D1 Console에서: 내 ID로 구독 직접 확인
SELECT * FROM user_subscriptions WHERE userId = '내_ID';

-- 3. 구독이 없으면: 내 ID로 새 구독 생성
INSERT INTO user_subscriptions (
  id, userId, planId, planName, period, status,
  startDate, endDate,
  current_students, current_homework_checks, current_ai_analysis,
  current_similar_problems, current_landing_pages,
  max_students, max_homework_checks, max_ai_analysis,
  max_similar_problems, max_landing_pages,
  createdAt, updatedAt
) VALUES (
  'sub-' || CAST(strftime('%s', 'now') AS TEXT) || '-manual',
  '내_ID',
  'plan-pro',
  '프로',
  '1month',
  'active',
  datetime('now'),
  datetime('now', '+1 month'),
  0, 0, 0, 0, 0,
  100, 1000, 500, 300, 10,
  datetime('now'),
  datetime('now')
);
```

---

## 📊 다음에 알려주실 것

1. **SQL 결과 1번** (User + 구독 JOIN 결과)
2. **브라우저 콘솔 출력** (현재 로그인 사용자)
3. **API 테스트 결과** (fetch로 직접 호출)

이 3가지를 확인하면 **정확한 원인**을 100% 파악하겠습니다!
