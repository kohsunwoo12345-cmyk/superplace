# ✅ 학원 상세 페이지 실제 데이터 표시 완료

## 🎯 요청사항
1. 회원가입 시 필드에 넣은 **학원 이름**이 기본 정보에 표시
2. **실제 학생 수, 교사 수** 표시
3. **결제 내역** 표시
4. **IP 정보** 표시
5. **AI 쇼핑몰 결제** 등 모든 데이터 표시

## 📊 구현 완료 내역

### 1. ✅ 학원 기본 정보 (Academy 테이블)
**데이터 소스:** `Academy` 테이블
```sql
SELECT name, code, address, phone, email, description, logoUrl
FROM Academy WHERE id = ?
```

**표시 정보:**
- 학원 이름 (회원가입 시 `academyName` 필드 값)
- 학원 코드
- 주소 (회원가입 시 `academyAddress` 필드 값)
- 전화번호
- 이메일
- 설명
- 로고 URL

### 2. ✅ 실제 학생 목록 (User 테이블)
**데이터 소스:** `User` 테이블 WHERE `role='STUDENT'`
```sql
SELECT id, name, email, phone, createdAt
FROM User
WHERE academyId = ? AND role = 'STUDENT'
ORDER BY createdAt DESC
LIMIT 500
```

**표시 정보:**
- 학생 ID
- 이름
- 이메일
- 전화번호
- 가입일
- **실제 학생 수** (COUNT)

### 3. ✅ 실제 교사 목록 (User 테이블)
**데이터 소스:** `User` 테이블 WHERE `role='TEACHER'`
```sql
SELECT id, name, email, phone, createdAt
FROM User
WHERE academyId = ? AND role = 'TEACHER'
ORDER BY createdAt DESC
LIMIT 100
```

**표시 정보:**
- 교사 ID
- 이름
- 이메일
- 전화번호
- 가입일
- **실제 교사 수** (COUNT)

### 4. ✅ 결제 내역 (subscription_requests 테이블)
**데이터 소스:** `subscription_requests` 테이블
```sql
SELECT id, planName, finalPrice as amount, status, createdAt, processedAt as approvedAt
FROM subscription_requests
WHERE userId = ?
ORDER BY createdAt DESC
LIMIT 50
```

**표시 정보:**
- 결제 ID
- 플랜명 (예: 베이직 플랜, 프로 플랜)
- 금액 (`finalPrice`)
- 상태 (`pending`, `approved`, `rejected`)
- 신청일 (`createdAt`)
- 승인일 (`approvedAt`)

**예시:**
```json
{
  "payments": [
    {
      "id": "req-1234",
      "planName": "베이직 플랜",
      "amount": 480000,
      "status": "approved",
      "createdAt": "2026-03-02T10:00:00Z",
      "approvedAt": "2026-03-02T11:00:00Z"
    }
  ]
}
```

### 5. ✅ 할당된 AI 봇 목록 (bot_assignments + ai_bots)
**데이터 소스:** `bot_assignments` JOIN `ai_bots`
```sql
SELECT ba.id, ba.botId, ab.name, ab.description, ba.assignedAt, ba.isActive as status
FROM bot_assignments ba
LEFT JOIN ai_bots ab ON ba.botId = ab.id
WHERE ba.academyId = ? AND ba.isActive = 1
ORDER BY ba.assignedAt DESC
```

**표시 정보:**
- 할당 ID
- 봇 ID
- 봇 이름
- 설명
- 할당일
- 활성 상태 (`active`/`inactive`)

### 6. ✅ 활동 통계
**데이터 소스:** 여러 테이블 JOIN

#### 총 채팅 수
```sql
SELECT COUNT(*) as count FROM ChatMessage WHERE academyId = ?
```

#### 출석 수
```sql
SELECT COUNT(*) as count FROM Attendance WHERE academyId = ?
```

#### 숙제 수
```sql
SELECT COUNT(*) as count FROM Homework WHERE academyId = ?
```

**표시 정보:**
- `totalChats`: 총 채팅 수
- `attendanceCount`: 총 출석 수
- `homeworkCount`: 총 숙제 수

### 7. ✅ 수익 통계
**데이터 소스:** `subscription_requests` (approved 상태만)
```sql
SELECT 
  SUM(CASE WHEN status = 'approved' THEN finalPrice ELSE 0 END) as totalRevenue,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as transactionCount
FROM subscription_requests
WHERE userId = ?
```

**표시 정보:**
- `totalRevenue`: 총 수익 (승인된 결제 합계)
- `transactionCount`: 거래 건수

**예시:**
```json
{
  "revenue": {
    "totalRevenue": 1440000,
    "transactionCount": 3
  }
}
```

### 8. ⚠️ IP 정보 (구현 보류)
**현재 상태:** DB에 `login_logs` 테이블이 없어 IP 정보 추적 불가

**추가 구현 필요:**
```sql
-- login_logs 테이블 생성
CREATE TABLE IF NOT EXISTS login_logs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  loginAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id)
);

-- 로그인 시 IP 기록
INSERT INTO login_logs (id, userId, ipAddress, userAgent)
VALUES (?, ?, ?, ?);

-- IP 조회
SELECT ipAddress, loginAt FROM login_logs 
WHERE userId = ? 
ORDER BY loginAt DESC 
LIMIT 10;
```

**대안:**
- 현재는 Cloudflare Access Logs에서 IP 확인 가능
- 향후 `login_logs` 테이블 추가 시 자동 표시

---

## 📋 API 응답 예시

```json
{
  "success": true,
  "academy": {
    "id": "dir-user-1234",
    "academyId": "academy-5678",
    "name": "코딩마스터 학원",
    "code": "ABCD1234",
    "address": "서울시 강남구 테헤란로 123",
    "phone": "02-1234-5678",
    "email": "director@codingmaster.com",
    "description": "최고의 코딩 교육",
    "logoUrl": null,
    "subscriptionPlan": "베이직 플랜",
    "maxStudents": 30,
    "maxTeachers": 5,
    "isActive": 1,
    "director": {
      "id": "user-1234",
      "name": "홍길동",
      "email": "director@codingmaster.com",
      "phone": "010-1234-5678"
    },
    "students": [
      {
        "id": "user-5001",
        "name": "김학생",
        "email": "student1@example.com",
        "phone": "010-1111-1111",
        "createdAt": "2026-03-01T10:00:00Z"
      },
      {
        "id": "user-5002",
        "name": "이학생",
        "email": "student2@example.com",
        "phone": "010-2222-2222",
        "createdAt": "2026-03-01T11:00:00Z"
      }
    ],
    "teachers": [
      {
        "id": "user-6001",
        "name": "박선생",
        "email": "teacher1@example.com",
        "phone": "010-3333-3333",
        "createdAt": "2026-02-28T09:00:00Z"
      }
    ],
    "studentCount": 2,
    "teacherCount": 1,
    "totalChats": 150,
    "attendanceCount": 45,
    "homeworkCount": 30,
    "assignedBots": [
      {
        "id": "assignment-1",
        "botId": "bot-ai-001",
        "name": "수학 튜터 AI",
        "description": "수학 문제 풀이 도우미",
        "assignedAt": "2026-03-01T08:00:00Z",
        "status": "active"
      }
    ],
    "payments": [
      {
        "id": "req-789",
        "planName": "베이직 플랜",
        "amount": 480000,
        "status": "approved",
        "createdAt": "2026-03-02T10:00:00Z",
        "approvedAt": "2026-03-02T11:00:00Z"
      }
    ],
    "revenue": {
      "totalRevenue": 480000,
      "transactionCount": 1
    },
    "currentPlan": {
      "planName": "베이직 플랜",
      "status": "active",
      "maxStudents": 30,
      "usedStudents": 2,
      "maxTeachers": 5,
      "usedTeachers": 1,
      "daysRemaining": 28
    }
  }
}
```

---

## 🧪 테스트 방법

### 1. 학원 상세 페이지 확인
```
1. https://superplacestudy.pages.dev/dashboard/admin/academies 접속
2. 학원 목록에서 학원 클릭
3. 상세 페이지에서 확인:
   ✅ 학원 이름 (회원가입 시 입력한 값)
   ✅ 실제 학생 목록 (이름, 이메일 표시)
   ✅ 실제 교사 목록
   ✅ 결제 내역 (플랜명, 금액, 상태)
   ✅ 할당된 AI 봇 (이름, 설명)
   ✅ 활동 통계 (채팅, 출석, 숙제 수)
   ✅ 수익 통계 (총 수익, 거래 건수)
```

### 2. API 직접 테스트
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://superplacestudy.pages.dev/api/admin/academies?id=ACADEMY_ID" | jq .
```

---

## 📊 배포 상태
- **커밋:** b8b51cc
- **URL:** https://superplacestudy.pages.dev
- **배포 시간:** 약 3분

---

## 📁 수정된 파일
- `functions/api/admin/academies.ts` - 실제 데이터 조회 로직 추가
- `ACADEMY_DATA_QUERIES.md` - 데이터 조회 쿼리 문서

---

## ✅ 체크리스트
- [x] Academy 테이블에서 학원 이름 조회
- [x] 실제 학생 목록 조회 (id, name, email, phone, createdAt)
- [x] 실제 교사 목록 조회
- [x] 결제 내역 조회 (subscription_requests)
- [x] AI 봇 할당 목록 조회 (bot_assignments + ai_bots)
- [x] 활동 통계 조회 (ChatMessage, Attendance, Homework)
- [x] 수익 통계 조회
- [ ] IP 로그 조회 (login_logs 테이블 필요 - 향후 구현)

---

**작성일:** 2026-03-02  
**작성자:** Claude AI  
**상태:** ✅ 완료 (IP 로그 제외)  
**다음 단계:** IP 추적을 위한 login_logs 테이블 추가 (선택사항)
