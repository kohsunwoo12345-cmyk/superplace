# 🚨 발송 이력 및 포인트 차감 문제 진단 보고서

## 📊 발견된 문제

### ❌ 문제 1: MessageSendHistory 테이블 없음
**증상:** 발송 이력 페이지 접속 시 오류
```
D1_ERROR: no such table: MessageSendHistory
```

**원인:** 데이터베이스에 테이블이 생성되지 않음

**해결:** `EXECUTE_THIS_IN_D1_CONSOLE.sql` 실행


### ❌ 문제 2: sms_logs 테이블에 userId 컬럼 없음
**증상:** 메시지 발송 시 오류
```
D1_ERROR: table sms_logs has no column named userId
```

**원인:** 기존 sms_logs 테이블 스키마에 userId 컬럼 누락

**해결:** `EXECUTE_THIS_IN_D1_CONSOLE.sql` 실행 (테이블 재생성)


### ❌ 문제 3: 포인트 차감 안 됨
**증상:** 문자 발송 후 포인트 차감 내역 없음

**원인:** 위 2가지 문제로 인해 발송 자체가 실패하여 포인트 차감 로직 미실행

**해결:** 데이터베이스 수정 후 자동 해결됨


### ⚠️ 문제 4: 예약 발송 기능 작동 여부 불명
**증상:** 코드는 존재하지만 실제 테스트 불가

**원인:** 위 문제들로 인해 기본 발송도 안 되어 예약 발송 테스트 불가

**해결:** 데이터베이스 수정 후 테스트 필요

---

## 🔧 해결 방법

### 1단계: Cloudflare D1 Console 접속
1. https://dash.cloudflare.com/ 접속
2. **Workers & Pages** → **superplacestudy** 클릭
3. **D1** 탭 클릭
4. **webapp-production** 데이터베이스 클릭
5. **Console** 탭 클릭

### 2단계: SQL 실행
`EXECUTE_THIS_IN_D1_CONSOLE.sql` 파일의 전체 내용을 복사하여 Console에 붙여넣고 실행

### 3단계: 테스트
다음 URL로 실제 발송 및 포인트 차감 테스트:
```
https://superplacestudy.pages.dev/api/debug/test-send-and-deduct?userId=1&email=wangholy1@naver.com&to=01085328739&from=01087399697
```

예상 결과:
```json
{
  "success": true,
  "solapi": {
    "success": true,
    "statusCode": "2000",
    "messageId": "M4V..."
  },
  "points": {
    "before": 10000,
    "after": 9960,
    "deducted": 40
  },
  "logs": {
    "smsLogSaved": true,
    "pointTransactionSaved": true,
    "historySaved": true
  }
}
```

### 4단계: 실제 사용
1. https://superplacestudy.pages.dev/dashboard/message-send 접속
2. 엑셀 업로드 → 메시지 작성 → 발송
3. "발송 완료!" 팝업 확인
4. https://superplacestudy.pages.dev/dashboard/point-charge/ 에서 포인트 차감 내역 확인
5. https://superplacestudy.pages.dev/dashboard/message-history/ 에서 발송 이력 확인

---

## 📋 수정된 내용

### 1. sms_logs 테이블
**변경 전:**
- userId 컬럼 없음

**변경 후:**
```sql
CREATE TABLE sms_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId TEXT NOT NULL,  -- 추가됨
  senderNumber TEXT NOT NULL,
  recipientNumber TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL,
  statusMessage TEXT,
  studentId TEXT,
  studentName TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 2. MessageSendHistory 테이블
**신규 생성:**
```sql
CREATE TABLE MessageSendHistory (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  messageType TEXT NOT NULL,
  senderNumber TEXT NOT NULL,
  recipientCount INTEGER NOT NULL DEFAULT 0,
  recipients TEXT,
  messageTitle TEXT,
  messageContent TEXT NOT NULL,
  pointsUsed INTEGER NOT NULL DEFAULT 0,
  pointCostPerMessage INTEGER,
  successCount INTEGER NOT NULL DEFAULT 0,
  failCount INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING',
  sendResults TEXT,
  sentAt TEXT,
  scheduledAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## 🧪 예약 발송 테스트 방법

데이터베이스 수정 완료 후:

1. 메시지 발송 페이지 접속
2. "예약 발송" 체크박스 선택
3. 날짜 및 시간 선택 (예: 2026-03-09 14:00)
4. 메시지 작성 및 발송
5. F12 콘솔에서 다음 로그 확인:
   ```
   ⏰ 예약 발송: {
     input: "2026-03-09T14:00:00+09:00",
     formatted: "2026-03-09 14:00:00"
   }
   ```
6. 예약 시간에 실제 발송 확인

---

## ✅ 체크리스트

- [ ] Cloudflare D1 Console에서 `EXECUTE_THIS_IN_D1_CONSOLE.sql` 실행
- [ ] 테스트 API 호출 (`/api/debug/test-send-and-deduct`)
- [ ] 포인트 차감 확인 (`before: 10000 → after: 9960`)
- [ ] SMS 로그 저장 확인
- [ ] 포인트 트랜잭션 저장 확인
- [ ] 발송 이력 저장 확인
- [ ] 실제 메시지 발송 테스트
- [ ] 포인트 충전 페이지에서 차감 내역 확인
- [ ] 발송 이력 페이지에서 내역 확인
- [ ] 예약 발송 기능 테스트

---

## 📞 추가 지원

문제 지속 시:
1. Cloudflare D1 Console 스크린샷 제공
2. F12 브라우저 콘솔 로그 제공
3. 테스트 API 응답 결과 제공
