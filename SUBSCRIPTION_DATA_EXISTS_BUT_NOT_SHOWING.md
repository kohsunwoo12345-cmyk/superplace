# 구독 데이터 있는데 플랜 표시 안 되는 문제 해결

## 🔍 현재 상황

**확인된 사실**:
- ✅ user_subscriptions 테이블에 **2개 구독 데이터 존재**
- ✅ 두 구독 모두 `status = 'active'`
- ❌ 설정 페이지에서 "플랜 없음" 표시

## 📊 존재하는 구독 데이터

### 구독 1
- userId: `test-user-1772098439`
- planName: `프로`
- status: `active`
- endDate: `2026-03-26`

### 구독 2
- userId: `user-1771479246368-du957iw33`
- planName: `엔터프라이즈`
- status: `active`
- endDate: `2027-03-03`

---

## 🎯 문제 원인 분석

### API 조회 조건
`/api/subscription/check` API는 다음 조건으로 조회합니다:

```sql
SELECT us.* FROM user_subscriptions us
JOIN User u ON us.userId = u.id
WHERE u.academyId = ? 
  AND u.role = 'DIRECTOR'    -- ⚠️ 이 조건이 중요!
  AND us.status = 'active'
```

### 가능한 원인

1. **User 테이블에서 role이 'DIRECTOR'가 아님**
   - role이 'ADMIN', 'TEACHER', 'STUDENT' 등일 수 있음

2. **User 테이블에서 academyId가 null이거나 다름**
   - academyId가 설정되지 않았을 수 있음

3. **User 테이블에 해당 userId가 없음**
   - 외래 키 제약이 없어서 발생 가능

---

## 🔧 즉시 실행할 SQL

### Cloudflare D1 Console에서 다음을 실행하세요:

```sql
-- 1. 구독이 있는 사용자들의 정보 확인
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,           -- ⚠️ 이게 'DIRECTOR'인지 확인!
  u.academyId       -- ⚠️ 이게 null이 아닌지 확인!
FROM User u
WHERE u.id IN ('test-user-1772098439', 'user-1771479246368-du957iw33');
```

**결과를 복사해서 알려주세요!**

예상 결과 형식:
```
id | email | name | role | academyId
test-user-1772098439 | xxx@xxx | 홍길동 | ADMIN | academy-123
```

---

## 💡 결과에 따른 해결 방법

### Case A: role이 'DIRECTOR'가 아닌 경우

**해결**: role을 'DIRECTOR'로 변경

```sql
UPDATE User 
SET role = 'DIRECTOR' 
WHERE id = 'test-user-1772098439';  -- 또는 다른 userId
```

### Case B: academyId가 null인 경우

**해결**: academyId 설정

```sql
UPDATE User 
SET academyId = 'academy-실제ID' 
WHERE id = 'test-user-1772098439';
```

### Case C: User 테이블에 해당 id가 없는 경우

**해결**: 다른 사용자로 구독 재생성 또는 User 생성

---

## 🚀 빠른 테스트 방법

### 현재 로그인한 사용자 확인

브라우저 콘솔 (F12):
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('현재 사용자:', {
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  academyId: user.academyId
});
```

### 해당 사용자의 구독 직접 조회

```sql
-- 현재 로그인한 사용자 ID로 조회
SELECT * FROM user_subscriptions 
WHERE userId = '현재_사용자_ID' 
AND status = 'active';
```

### academyId로 조회 (실제 API 쿼리)

```sql
-- 현재 로그인한 사용자의 academyId로 조회
SELECT us.* FROM user_subscriptions us
JOIN User u ON us.userId = u.id
WHERE u.academyId = '현재_사용자_academyId'
  AND u.role = 'DIRECTOR'
  AND us.status = 'active';
```

---

## 📝 체크리스트

다음을 확인하고 알려주세요:

- [ ] 위의 SQL 실행 결과 (User 정보)
- [ ] 현재 로그인한 사용자 정보 (브라우저 콘솔)
- [ ] 두 정보가 일치하는지

---

## ⚡ 예상 해결 방법

**가장 가능성 높은 시나리오**:

1. 구독은 `test-user-1772098439`에게 있음
2. 하지만 이 user의 role이 'ADMIN' 또는 'TEACHER'임
3. API는 role='DIRECTOR'만 조회함
4. 결과: 구독 못 찾음

**해결**: 
```sql
UPDATE User SET role = 'DIRECTOR' WHERE id = 'test-user-1772098439';
```

그 다음 설정 페이지 새로고침!

---

**다음 단계**: 위의 SQL 결과를 알려주시면 정확한 해결책을 제시하겠습니다.
