# 🚨 포인트 승인 문제 해결 가이드

## 📅 작성일: 2026-03-15
## 🎯 최신 커밋: 82db660b
## 🌐 배포 URL: https://superplacestudy.pages.dev

---

## ⚡ 즉시 실행 가이드

### 1️⃣ 디버그 페이지 접속
```
https://superplacestudy.pages.dev/debug.html
```

### 2️⃣ 사용 절차
1. **메인 사이트에서 관리자 로그인**
   - https://superplacestudy.pages.dev
   - 관리자 계정으로 로그인 (토큰이 localStorage에 저장됨)

2. **디버그 페이지 열기**
   - 새 탭에서 `/debug.html` 접속
   - 같은 브라우저, 같은 프로필 사용 필수 (토큰 공유)

3. **데이터 확인**
   - "🔍 요청 목록 가져오기" 클릭
   - "💰 학원 포인트 조회" 클릭
   - "📊 SMS 통계 조회" 클릭

4. **포인트 승인 테스트**
   - PENDING 상태 요청 ID 복사
   - 표의 "승인" 버튼 클릭 또는 수동으로 ID 입력 후 승인

5. **결과 확인**
   - 콘솔 로그에서 상세 응답 확인
   - 성공 시: `addedPoints`, `beforePoints`, `afterPoints` 확인
   - 실패 시: 에러 메시지 확인

---

## 🔍 문제 진단 방법

### Case 1: "Request not found" 오류
**원인**: 해당 요청 ID가 데이터베이스에 없음

**해결**:
1. 디버그 페이지에서 "🔍 요청 목록 가져오기" 클릭
2. 실제 존재하는 PENDING 요청의 ID 사용
3. 요청이 없다면 원장이 먼저 포인트 충전 신청 필요

### Case 2: "Failed to approve" (500 에러)
**원인**: API 내부 오류

**확인 사항**:
- Cloudflare Pages 대시보드 → Functions → Logs 확인
- 디버그 페이지 콘솔에서 전체 응답 확인
- `academyId`가 NULL인지 확인

**해결**:
```sql
-- academyId가 NULL인 요청 확인
SELECT id, academyId, amount, status FROM PointChargeRequest WHERE academyId IS NULL;
```

### Case 3: 승인은 성공했는데 포인트가 0원
**원인**: 
- SMS 페이지 캐시 문제
- 다른 학원 ID 조회 중
- Academy.smsPoints 업데이트 실패

**해결**:
1. **캐시 확인**: Ctrl + Shift + R로 강제 새로고침
2. **데이터 확인**: 디버그 페이지에서 "💰 학원 포인트 조회"
3. **차이 확인**: 승인 합계와 smsPoints 비교
4. **로그 확인**: 콘솔에 "⚠️ 차이" 메시지 있는지 확인

---

## 📊 정상 동작 시나리오

### 1단계: 원장이 포인트 충전 신청
```
POST /api/point-charge-requests/create
{
  "amount": 500000,
  "paymentMethod": "BANK_TRANSFER",
  "depositBank": "국민은행",
  "depositorName": "고희준"
}
```

### 2단계: 관리자가 승인
```
POST /api/admin/point-charge-requests/approve
{ "requestId": "pcr_1234567890_abcdef" }

✅ 응답:
{
  "success": true,
  "data": {
    "academyId": "academy-xxx",
    "academyName": "꾸메땅학원",
    "beforePoints": 0,
    "afterPoints": 500000,
    "addedPoints": 500000,
    "requestedPoints": 500000,
    "approvedAt": "2026-03-15T06:00:00.000Z"
  }
}
```

### 3단계: SMS 페이지에서 확인
```
GET /api/admin/sms/stats

✅ 응답:
{
  "success": true,
  "stats": {
    "balance": 500000,
    "totalSent": 0,
    "thisMonth": 0,
    "templates": 0
  }
}
```

---

## 🛠️ API 수정 내역

### 1. 승인 API (`functions/api/admin/point-charge-requests/approve.ts`)
```typescript
// ✅ 수정 완료
- 테이블명: point_charge_requests → PointChargeRequest
- 테이블명: users → User
- 테이블명: academy → Academy
- Academy.smsPoints 업데이트 로직 추가
- 상세 로깅 추가
```

### 2. 요청 목록 API (`functions/api/admin/point-charge-requests/index.ts`)
```typescript
// ✅ 수정 완료
- JOIN 테이블명 통일
- 응답 구조: { success, data: { requests, stats } }
```

### 3. SMS 통계 API (`functions/api/admin/sms/stats.js`)
```javascript
// ✅ 새로 작성
- Academy.smsPoints 직접 조회
- 학원별 / 전체 학원 포인트 합계 지원
- 응답 구조: { success, stats: { balance, totalSent, thisMonth, templates } }
```

---

## 🧪 수동 테스트 스크립트

### 브라우저 콘솔에서 실행

```javascript
// 1. 포인트 충전 요청 조회
async function checkRequests() {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/admin/point-charge-requests?status=ALL', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.table(data.data.requests);
  return data.data.requests;
}

// 2. 특정 요청 승인
async function approveRequest(requestId) {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/admin/point-charge-requests/approve', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ requestId })
  });
  const data = await res.json();
  console.log('승인 결과:', data);
  return data;
}

// 3. 학원 포인트 확인
async function checkAcademyPoints(academyId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api/admin/academies/${academyId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('학원 포인트:', data.data.smsPoints);
  return data;
}

// 4. SMS 통계 확인
async function checkSMSStats() {
  const token = localStorage.getItem('token');
  const res = await fetch('/api/admin/sms/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('SMS 통계:', data.stats);
  return data;
}

// 실행 예시:
// const requests = await checkRequests();
// await approveRequest('pcr_1234567890_abcdef');
// await checkAcademyPoints('academy-1771479246368-5viyubmqk');
// await checkSMSStats();
```

---

## 📋 체크리스트

### 승인 전 확인사항
- [ ] 관리자로 로그인 완료
- [ ] PENDING 상태의 요청이 존재함
- [ ] 요청에 academyId가 있음
- [ ] 학원이 데이터베이스에 존재함

### 승인 후 확인사항
- [ ] 응답에 `success: true` 포함
- [ ] `addedPoints` === `requestedPoints`
- [ ] `afterPoints` === `beforePoints + addedPoints`
- [ ] SMS 페이지에서 포인트 증가 확인
- [ ] 포인트 트랜잭션 로그 생성 확인

### 문제 발생 시 수집 정보
1. 브라우저: Chrome / Firefox / Safari
2. 요청 ID: `pcr_xxxxx`
3. 학원 ID: `academy-xxxxx`
4. 응답 상태 코드: 200 / 400 / 404 / 500
5. 응답 본문: JSON 전체
6. Cloudflare 로그: 타임스탬프 기준 에러 로그

---

## 🆘 긴급 대응

### 포인트가 반영되지 않을 때

1. **DB 직접 확인** (Cloudflare D1 대시보드):
```sql
-- 최근 승인된 요청 조회
SELECT * FROM PointChargeRequest 
WHERE status = 'APPROVED' 
ORDER BY approvedAt DESC 
LIMIT 10;

-- 학원 포인트 확인
SELECT id, name, smsPoints 
FROM Academy 
WHERE id = 'academy-1771479246368-5viyubmqk';

-- 포인트 트랜잭션 확인
SELECT * FROM point_transactions 
WHERE type = 'CHARGE' 
ORDER BY createdAt DESC 
LIMIT 10;
```

2. **수동 포인트 추가** (최후의 수단):
```sql
-- 특정 학원에 포인트 추가
UPDATE Academy 
SET smsPoints = smsPoints + 500000 
WHERE id = 'academy-1771479246368-5viyubmqk';

-- 트랜잭션 로그 추가
INSERT INTO point_transactions (
  id, academyId, userId, type, amount, balance, description, createdAt
) VALUES (
  'pt_manual_' || strftime('%s', 'now'),
  'academy-1771479246368-5viyubmqk',
  'admin-id',
  'CHARGE',
  500000,
  (SELECT smsPoints FROM Academy WHERE id = 'academy-1771479246368-5viyubmqk'),
  '수동 포인트 추가',
  datetime('now')
);
```

---

## 📞 지원 정보

**디버그 페이지**: https://superplacestudy.pages.dev/debug.html  
**Cloudflare 대시보드**: https://dash.cloudflare.com  
**GitHub 저장소**: https://github.com/kohsunwoo12345-cmyk/superplace  

**최종 수정일**: 2026-03-15  
**최신 커밋**: 82db660b  
**상태**: ✅ 배포 완료

---

## 🎯 핵심 요약

1. **디버그 페이지 사용**: `/debug.html`에서 실시간으로 모든 데이터 확인
2. **테이블명 통일**: `PointChargeRequest`, `User`, `Academy` 사용
3. **Academy.smsPoints 사용**: SMS 포인트는 학원 테이블의 smsPoints 필드에 저장
4. **상세 로깅**: 모든 API에서 실행 과정 로그 출력
5. **캐시 주의**: 강제 새로고침 (Ctrl + Shift + R) 필수

**이제 실제로 관리자 계정으로 로그인해서 디버그 페이지에서 테스트하시면 됩니다.**
