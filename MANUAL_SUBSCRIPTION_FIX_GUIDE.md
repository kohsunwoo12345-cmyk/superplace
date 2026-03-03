# 플랜 구독 문제 해결 - 최종 가이드 (수동 실행)

**날짜**: 2026-03-03  
**상태**: 수동 실행 필요  
**목표**: 테이블 직접 생성 및 구독 작동 확인

---

## 🎯 현재 상황

API가 제대로 작동하지 않거나 배포가 완료되지 않은 상태입니다.  
따라서 **Cloudflare D1 대시보드에서 직접 SQL을 실행**하여 테이블을 생성하겠습니다.

---

## 📋 실행 단계 (순서대로!)

### Step 1: Cloudflare D1 대시보드 접속

1. https://dash.cloudflare.com/ 접속
2. 좌측 메뉴에서 **"Workers & Pages"** 클릭
3. **"D1"** 탭 클릭
4. **"webapp-production"** 데이터베이스 선택
5. **"Console"** 탭 클릭

---

### Step 2: 기존 테이블 삭제

Console에서 다음 SQL을 **하나씩** 실행:

```sql
DROP TABLE IF EXISTS user_subscriptions;
```
→ "Execute" 버튼 클릭

```sql
DROP TABLE IF EXISTS subscription_requests;
```
→ "Execute" 버튼 클릭

```sql
DROP TABLE IF EXISTS usage_alerts;
```
→ "Execute" 버튼 클릭

```sql
DROP TABLE IF EXISTS usage_logs;
```
→ "Execute" 버튼 클릭

**확인**:
```sql
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%subscription%';
```
→ 빈 결과가 나와야 정상

---

### Step 3: user_subscriptions 테이블 생성 ⭐

**가장 중요한 테이블입니다. 정확히 복사해서 실행하세요:**

```sql
CREATE TABLE user_subscriptions (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  planId TEXT NOT NULL,
  planName TEXT NOT NULL,
  period TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  startDate TEXT NOT NULL,
  endDate TEXT NOT NULL,
  current_students INTEGER DEFAULT 0,
  current_homework_checks INTEGER DEFAULT 0,
  current_ai_analysis INTEGER DEFAULT 0,
  current_similar_problems INTEGER DEFAULT 0,
  current_landing_pages INTEGER DEFAULT 0,
  max_students INTEGER DEFAULT -1,
  max_homework_checks INTEGER DEFAULT -1,
  max_ai_analysis INTEGER DEFAULT -1,
  max_similar_problems INTEGER DEFAULT -1,
  max_landing_pages INTEGER DEFAULT -1,
  lastPaymentAmount INTEGER,
  lastPaymentDate TEXT,
  autoRenew INTEGER DEFAULT 0,
  lastResetDate TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);
```
→ "Execute" 버튼 클릭

**인덱스 생성**:
```sql
CREATE INDEX idx_user_subscriptions_userId ON user_subscriptions(userId);
```

```sql
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
```

```sql
CREATE INDEX idx_user_subscriptions_endDate ON user_subscriptions(endDate);
```

---

### Step 4: subscription_requests 테이블 생성

```sql
CREATE TABLE subscription_requests (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  planId TEXT NOT NULL,
  planName TEXT NOT NULL,
  period TEXT NOT NULL,
  finalPrice INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  requestedAt TEXT DEFAULT (datetime('now')),
  processedAt TEXT,
  approvedBy TEXT,
  approvedByEmail TEXT,
  adminNote TEXT,
  companyName TEXT,
  businessNumber TEXT,
  requestNote TEXT,
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

**인덱스**:
```sql
CREATE INDEX idx_subscription_requests_userId ON subscription_requests(userId);
```

```sql
CREATE INDEX idx_subscription_requests_status ON subscription_requests(status);
```

---

### Step 5: usage_alerts 테이블 생성

```sql
CREATE TABLE usage_alerts (
  id TEXT PRIMARY KEY,
  academyId TEXT NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  threshold INTEGER,
  currentValue INTEGER,
  maxValue INTEGER,
  isRead INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT (datetime('now')),
  readAt TEXT
);
```

**인덱스**:
```sql
CREATE INDEX idx_usage_alerts_academyId ON usage_alerts(academyId);
```

```sql
CREATE INDEX idx_usage_alerts_isRead ON usage_alerts(isRead);
```

---

### Step 6: usage_logs 테이블 생성

```sql
CREATE TABLE usage_logs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  details TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

**인덱스**:
```sql
CREATE INDEX idx_usage_logs_userId ON usage_logs(userId);
```

```sql
CREATE INDEX idx_usage_logs_type ON usage_logs(type);
```

```sql
CREATE INDEX idx_usage_logs_createdAt ON usage_logs(createdAt);
```

---

### Step 7: 테이블 생성 확인 ✅

```sql
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;
```

**확인 사항**:
- ✅ subscription_requests
- ✅ usage_alerts
- ✅ usage_logs
- ✅ user_subscriptions

**user_subscriptions 컬럼 수 확인**:
```sql
PRAGMA table_info(user_subscriptions);
```

**결과**: 25개 컬럼이 있어야 합니다!

---

### Step 8: 플랜 신청 및 승인 테스트

#### 8-1. 학원장으로 플랜 신청
1. https://superplacestudy.pages.dev 접속
2. 학원장 계정 로그인
3. `/pricing` 페이지 이동
4. 플랜 선택 및 신청

#### 8-2. 관리자로 승인
1. 관리자 계정 로그인
2. `/dashboard/admin/subscription-approvals` 이동
3. 대기 중인 신청 확인
4. **"승인"** 버튼 클릭

#### 8-3. 데이터 저장 확인

**Cloudflare D1 Console에서**:
```sql
SELECT * FROM user_subscriptions;
```

**확인**:
- ✅ 1개 행이 있어야 함
- ✅ status = 'active'
- ✅ planName = '프리미엄' (또는 선택한 플랜명)
- ✅ userId가 학원장의 ID와 일치

---

### Step 9: 설정 페이지 확인 ✅

#### 9-1. 학원장의 userId 확인

**Cloudflare D1 Console**:
```sql
SELECT id, email, name, role, academyId 
FROM User 
WHERE role = 'DIRECTOR' 
LIMIT 5;
```

#### 9-2. 구독 조회 테스트

**실제 API가 사용하는 쿼리**:
```sql
SELECT us.* 
FROM user_subscriptions us
JOIN User u ON us.userId = u.id
WHERE u.academyId = 'YOUR_ACADEMY_ID_HERE'
  AND u.role = 'DIRECTOR'
  AND us.status = 'active'
ORDER BY us.endDate DESC
LIMIT 1;
```

**`YOUR_ACADEMY_ID_HERE`를 실제 academyId로 교체**

**확인**:
- ✅ 1개 행 반환
- ✅ 플랜 정보 정상 표시

#### 9-3. 설정 페이지 접속

1. 학원장 계정 로그인
2. `/dashboard/settings` 접속
3. ✅ **"구독 정보" 카드가 표시되어야 함**
4. ✅ **플랜명, 만료일, 사용량/한도 표시**
5. ❌ **"요금제 선택" 메시지가 없어야 함**

---

## 🔍 문제 해결

### 문제 A: 테이블 생성 실패

**증상**: "table already exists" 오류

**해결**:
```sql
DROP TABLE IF EXISTS user_subscriptions;
-- 그 다음 다시 CREATE TABLE 실행
```

### 문제 B: 승인했는데 데이터가 없음

**확인**:
```sql
SELECT * FROM user_subscriptions;
```

**빈 결과인 경우**:
1. 승인 API가 실행되지 않았거나
2. INSERT 중 오류 발생

**Cloudflare Pages → Functions 로그 확인**:
- 승인 버튼 클릭 시 로그에 오류 있는지 확인

### 문제 C: 설정 페이지에서 여전히 "요금제 선택" 표시

**Step 1**: D1 Console에서 확인
```sql
-- 1. 학원장 정보
SELECT id, email, name, role, academyId 
FROM User 
WHERE email = 'DIRECTOR_EMAIL_HERE';

-- 2. 구독 존재 확인
SELECT * FROM user_subscriptions WHERE userId = 'USER_ID_FROM_STEP1';

-- 3. academyId로 조회 (실제 API 쿼리)
SELECT us.* 
FROM user_subscriptions us
JOIN User u ON us.userId = u.id
WHERE u.academyId = 'ACADEMY_ID_FROM_STEP1'
  AND u.role = 'DIRECTOR'
  AND us.status = 'active';
```

**Step 2**: 브라우저 콘솔에서 확인
```javascript
// F12 → Console
const user = JSON.parse(localStorage.getItem('user'));
console.log('User:', user);
console.log('AcademyId:', user.academyId);

fetch(`/api/subscription/check?academyId=${user.academyId}`)
  .then(r => r.json())
  .then(d => console.log('API Response:', d));
```

---

## 📊 최종 체크리스트

### 필수 확인 사항

- [ ] **Step 2 완료**: 기존 테이블 모두 삭제
- [ ] **Step 3 완료**: user_subscriptions 테이블 생성 (25개 컬럼)
- [ ] **Step 4-6 완료**: 나머지 3개 테이블 생성
- [ ] **Step 7 완료**: 테이블 존재 및 컬럼 수 확인
- [ ] **Step 8 완료**: 플랜 신청 및 승인
- [ ] **Step 8-3 확인**: D1에서 `SELECT * FROM user_subscriptions` 결과 있음
- [ ] **Step 9-2 확인**: JOIN 쿼리로 구독 조회 성공
- [ ] **Step 9-3 확인**: 설정 페이지에서 플랜 정보 표시

---

## ✅ 성공 기준

### 100% 작동하는 상태:

1. **D1 Console**:
   ```sql
   SELECT * FROM user_subscriptions;
   ```
   → 최소 1개 행 반환

2. **설정 페이지**:
   - 구독 정보 카드 표시
   - 플랜명: "프리미엄" (또는 선택한 플랜)
   - 만료일: 미래 날짜
   - 사용량/한도: 숫자로 표시

3. **오류 없음**:
   - "활성화된 구독이 없습니다" 메시지 없음
   - "요금제를 선택해주세요" 메시지 없음

---

## 📝 실행 후 보고

위 단계를 실행한 후, 다음을 확인해주세요:

1. **Step 7**: 테이블 생성 확인 결과
2. **Step 8-3**: `SELECT * FROM user_subscriptions` 결과
3. **Step 9-2**: JOIN 쿼리 결과
4. **Step 9-3**: 설정 페이지 스크린샷

이 정보를 주시면 정확한 상태를 파악하고 추가 조치를 취하겠습니다.

---

**작성자**: GenSpark AI Developer  
**최종 수정**: 2026-03-03  
**파일**: `MANUAL_SUBSCRIPTION_FIX_GUIDE.md`
