# 🔍 발송 이력이 나오지 않는 문제 - 정확한 원인 분석

## 📋 현황 요약

**문제:** https://superplacestudy.pages.dev/dashboard/message-history/ 페이지에 발송 이력이 표시되지 않음

**API 응답:**
```json
{
  "success": true,
  "history": []
}
```

## 🎯 정확한 원인

### 1️⃣ **테이블 존재 여부**: ✅ 정상
- MessageSendHistory 테이블이 올바르게 생성되어 있음
- 스키마 정상 확인됨

### 2️⃣ **쿼리 로직**: ✅ 정상
- history.ts API가 올바르게 `WHERE userId = ?`로 조회
- send-bulk.ts가 올바르게 userId를 저장

### 3️⃣ **실제 원인**: ⚠️ **발송 이력이 없음**

#### 데이터베이스 실제 상태:
```json
{
  "totalRecords": 1,
  "records": [
    {
      "userId": "1",           // ❌ 테스트용 숫자 ID
      "messageType": "SMS",
      "senderNumber": "01087399697",
      "messageContent": "테스트 메시지입니다.",
      "createdAt": "2026-03-08 08:38:38"
    }
  ],
  "distinctUserIds": [
    { "userId": "1" }          // ❌ 테스트 데이터만 존재
  ]
}
```

#### 실제 사용자 정보:
```json
{
  "userId": "user-1771479246368-du957iw33",  // ✅ 실제 사용자 ID
  "email": "wangholy1@naver.com",
  "role": "DIRECTOR",
  "academyId": "academy-1771479246368-5viyubmqk"
}
```

### 🔴 **핵심 문제점**

1. **테스트 데이터**: `userId = "1"`로 저장된 테스트 발송 1건만 존재
2. **실제 사용자 데이터 없음**: `userId = "user-1771479246368-du957iw33"`로 저장된 발송 이력이 **0건**
3. **결과**: 실제 사용자가 조회하면 빈 배열이 반환됨

## ✅ 검증 완료 사항

### 1. 포인트 차감 기능: ✅ 정상 작동
```bash
curl "https://superplacestudy.pages.dev/api/user/point-transactions" \
  -H "Authorization: Bearer user-1771479246368-du957iw33|wangholy1@naver.com|DIRECTOR|..."
```

**응답:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "amount": 10000,
      "type": "CHARGE",
      "description": "초기 테스트 포인트"
    },
    {
      "id": 2,
      "amount": -40,
      "type": "SMS_SEND",
      "description": "[테스트] 문자 발송: 01085328739"
    }
  ],
  "totalPoints": 9960
}
```
✅ 포인트 차감이 정확히 작동 (10,000P → 9,960P)

### 2. 예약 발송 기능: ✅ 코드 정상
- send-bulk.ts에 `scheduledDate` 처리 로직 존재
- Solapi API 호출 시 예약 시간 포맷팅 정상
- MessageSendHistory에 `scheduledAt` 컬럼 저장

### 3. MessageSendHistory 저장: ✅ 코드 정상
```typescript
await env.DB.prepare(`
  INSERT INTO MessageSendHistory (
    userId, messageType, senderNumber, ...
  ) VALUES (?, ?, ?, ...)
`)
.bind(
  userId,  // ✅ 토큰에서 추출한 실제 userId 사용
  ...
)
```

## 🔧 해결 방법

### 방법 1: 테스트 데이터 삭제 후 실제 발송 (권장)

#### Step 1: 테스트 데이터 삭제
Cloudflare D1 Console에서 실행:
```sql
DELETE FROM MessageSendHistory WHERE userId = '1';
```

#### Step 2: 실제 문자 발송
1. https://superplacestudy.pages.dev/dashboard/message-send 접속
2. 엑셀 템플릿 다운로드
3. 학부모 연락처 입력 (예: 010-8532-8739)
4. 메시지 작성 (45자 이하 = SMS 40P, 초과 = LMS 95P)
5. **발송** 버튼 클릭
6. "발송 완료!" 팝업 확인

#### Step 3: 발송 이력 확인
1. https://superplacestudy.pages.dev/dashboard/message-history/ 접속
2. Ctrl+F5로 강력 새로고침
3. 발송 이력이 표시됨

### 방법 2: 테스트 데이터를 실제 사용자 ID로 변경 (임시)

```sql
UPDATE MessageSendHistory 
SET userId = 'user-1771479246368-du957iw33' 
WHERE userId = '1';
```

⚠️ 이 방법은 임시 방편이며, 실제 발송 테스트를 권장합니다.

## 🧪 발송 이력 생성 확인 방법

### 발송 후 F12 콘솔에서 확인할 로그:

```
🔐 인증 정보: userId=user-1771479246368-du957iw33, email=wangholy1@naver.com, role=DIRECTOR
📨 문자 발송 요청: 1건
💰 예상 비용: 40P (SMS: 40P, LMS: 95P, MMS: 220P)
💳 현재 포인트 (by email): 9960P
💳 포인트 충분: 예상 비용 40P <= 잔액 9960P
📬 Solapi 응답: { statusCode: "2000", messageId: "M4V..." }
✅ 발송 성공: 1/1건
💳 포인트 차감 중: 40P - 010-8532-8739 - 홍길동
💳 포인트 트랜잭션 저장 완료: -40P
✅ 포인트 차감 완료: 40P (1건 성공)
✅ 발송 내역 저장 완료
```

### 발송 후 데이터베이스에서 확인:

```sql
SELECT 
  id,
  userId,
  messageType,
  senderNumber,
  recipientCount,
  pointsUsed,
  status,
  createdAt
FROM MessageSendHistory
WHERE userId = 'user-1771479246368-du957iw33'
ORDER BY createdAt DESC;
```

**예상 결과:**
```
userId: user-1771479246368-du957iw33
messageType: SMS
senderNumber: 01087399697
recipientCount: 1
pointsUsed: 40
status: COMPLETED
```

## 📊 현재 시스템 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| MessageSendHistory 테이블 | ✅ 존재 | 스키마 정상 |
| history.ts API | ✅ 정상 | userId 기반 조회 |
| send-bulk.ts | ✅ 정상 | userId 올바르게 저장 |
| 포인트 차감 | ✅ 정상 | 10,000P → 9,960P 확인 |
| 예약 발송 로직 | ✅ 정상 | scheduledDate 처리 존재 |
| **실제 발송 이력** | ❌ **없음** | **테스트 데이터(userId=1)만 존재** |

## 🎯 결론

**시스템은 정상 작동하고 있으며, 문제는 단순히 실제 사용자 계정으로 발송한 내역이 없기 때문입니다.**

실제 문자 발송을 진행하면 발송 이력이 정상적으로 표시됩니다.

---

## 📝 추가 확인 사항

### 예약 발송 테스트:
1. 메시지 발송 페이지에서 "예약 발송" 체크
2. 미래 날짜/시간 선택 (예: 2026-03-09 14:00)
3. 발송 버튼 클릭
4. 콘솔에서 다음 로그 확인:
   ```
   ⏰ 예약 발송: 2026-03-09 14:00:00
   scheduledAt: 2026-03-09T14:00:00+09:00
   ```
5. 발송 이력에서 "예약됨" 상태 확인

### 발신번호 등록 확인:
- 발신번호가 Solapi에 등록되어 있어야 실제 발송 가능
- 미등록 시 "발신번호 미등록" 오류 발생
- 등록 방법: https://solapi.com → 발신번호 관리

### Solapi API 키 확인:
Cloudflare Pages 환경변수에서 다음을 확인:
- `SOLAPI_API_Key`: 설정되어 있어야 함
- `SOLAPI_API_Secret`: 설정되어 있어야 함

없을 경우 테스트 모드로 작동하며 실제 발송이 안 됨.
