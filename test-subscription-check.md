# 구독 정보 조회 디버깅 가이드

## 1단계: 사용자 정보 확인

브라우저 콘솔에서 실행:
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('User ID:', user.id);
console.log('User Email:', user.email);
console.log('User Role:', user.role);
console.log('Academy ID:', user.academyId);
```

## 2단계: API 직접 테스트

### 방법 1: userId로 조회
```javascript
const user = JSON.parse(localStorage.getItem('user'));
fetch(`/api/subscription/check?userId=${user.id}`)
  .then(r => r.json())
  .then(d => console.log('userId 조회:', d));
```

### 방법 2: academyId로 조회
```javascript
const user = JSON.parse(localStorage.getItem('user'));
fetch(`/api/subscription/check?academyId=${user.academyId}`)
  .then(r => r.json())
  .then(d => console.log('academyId 조회:', d));
```

## 3단계: 데이터베이스 직접 확인

Cloudflare D1 콘솔에서:
```sql
-- 1. 사용자 정보 확인
SELECT id, email, name, role, academyId 
FROM User 
WHERE role = 'DIRECTOR'
LIMIT 10;

-- 2. 해당 사용자의 구독 정보 확인 (userId 기준)
SELECT * FROM user_subscriptions 
WHERE userId IN (
  SELECT id FROM User WHERE role = 'DIRECTOR'
)
ORDER BY createdAt DESC;

-- 3. 구독 상태 확인
SELECT 
  us.id,
  us.userId,
  us.planName,
  us.status,
  us.startDate,
  us.endDate,
  u.email,
  u.name,
  u.role,
  u.academyId
FROM user_subscriptions us
JOIN User u ON us.userId = u.id
WHERE u.role = 'DIRECTOR'
ORDER BY us.createdAt DESC;
```

## 4단계: API 로직 확인

`/api/subscription/check` 파일 위치:
- `functions/api/subscription/check.ts`

예상되는 문제:
1. userId와 academyId 매칭 문제
2. status 필드 값이 'active'가 아닌 다른 값
3. endDate가 만료됨
4. JOIN 조건 불일치
