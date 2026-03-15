# 포인트 승인 문제 긴급 해결 가이드

## 🚨 현재 상황
- 관리자가 승인해도 "Failed to approve" 오류 발생
- 승인 후에도 포인트가 0원으로 표시됨

## ✅ 해결 방법

### 1단계: 포인트 충전 요청이 있는지 확인
URL: https://superplacestudy.pages.dev/api/admin/fix-point-charge-table

**결과**: 포인트 충전 요청이 0개입니다!

### 2단계: 테스트 포인트 충전 요청 생성

사용자가 먼저 포인트 충전 신청을 해야 합니다:

1. **원장 계정으로 로그인**
2. **포인트 충전 신청** 페이지로 이동
3. **충전할 포인트 입력** (예: 50만원)
4. **입금 정보 입력**
5. **신청하기** 버튼 클릭

### 3단계: 관리자가 승인

1. **관리자 계정으로 로그인**
2. **포인트 충전 관리** 페이지 이동
3. PENDING 상태 요청 확인
4. **승인 버튼** 클릭

---

## 🔍 실제 문제 진단

꾸메땅학원 (academy-1771479246368-5viyubmqk):
- 현재 SMS 포인트: 0원
- 포인트 충전 요청: 0건
- 학생 수: 59명

**→ 포인트 충전 신청 자체가 없습니다!**

---

## 📝 수동 테스트 방법

### A. 포인트 충전 요청 생성 API

```bash
curl -X POST https://superplacestudy.pages.dev/api/point-charge-requests/create \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer [원장토큰]' \
  -d '{
    "requestedPoints": 500000,
    "pointPrice": 500000,
    "vat": 50000,
    "totalPrice": 550000,
    "paymentMethod": "bank_transfer",
    "depositBank": "국민은행",
    "depositorName": "고희준",
    "requestMessage": "테스트 충전"
  }'
```

### B. 포인트 승인 API

```bash
curl -X POST https://superplacestudy.pages.dev/api/admin/point-charge-requests/approve \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer [관리자토큰]' \
  -d '{"requestId": "[요청ID]"}'
```

### C. SMS 포인트 확인

```bash
curl https://superplacestudy.pages.dev/api/admin/academies?id=academy-1771479246368-5viyubmqk \
  -H 'Authorization: Bearer [토큰]'
```

---

## ⚠️ 중요 확인 사항

1. **로그인 토큰 형식**
   - 현재 토큰: `userId|email|role|academyId|timestamp`
   - 예: `user-123|test@test.com|SUPER_ADMIN|academy-456|1234567890`

2. **데이터베이스 테이블**
   - PointChargeRequest (O)
   - point_charge_requests (X)
   - User (O)
   - users (X)
   - Academy (O)
   - academy (X)

3. **승인 프로세스**
   ```
   요청 생성 → PENDING 상태 → 관리자 승인 → Academy.smsPoints 증가
   ```

---

## 🎯 실제 테스트 시나리오

### 시나리오 1: 원장이 포인트 충전 신청
1. 원장 계정으로 로그인 (wangholy1@naver.com)
2. 포인트 충전 페이지 접속
3. 50만 포인트 신청
4. 입금 정보 입력
5. 신청 완료

### 시나리오 2: 관리자가 승인
1. 관리자 계정으로 로그인
2. 포인트 충전 관리 페이지
3. PENDING 상태 요청 확인
4. 승인 버튼 클릭
5. **예상 결과**: "포인트 충전이 승인되었습니다!" 메시지
6. SMS 페이지에서 50만 포인트 확인

---

## 🔧 브라우저 디버깅

승인 실패 시 확인:

1. **F12** 개발자 도구 열기
2. **Console** 탭 확인
   - "Failed to approve:" 로그 확인
   - 에러 메시지 복사
3. **Network** 탭 확인
   - `/api/admin/point-charge-requests/approve` 요청 찾기
   - Response 탭에서 에러 메시지 확인
   - Request Payload 확인 (requestId가 맞는지)

---

## 💡 일반적인 오류와 해결

### "Request not found"
- 원인: requestId가 잘못됨 또는 데이터베이스에 요청이 없음
- 해결: 포인트 충전 신청 먼저 진행

### "Failed to approve"
- 원인: API 에러 (상세 메시지 확인 필요)
- 해결: Console/Network 탭에서 상세 에러 확인

### "0원으로 표시"
- 원인: SMS stats API가 Academy.smsPoints를 제대로 조회하지 못함
- 해결: 페이지 새로고침 (Ctrl + Shift + R)

---

## 📞 지원 요청 시 제공할 정보

1. 브라우저 Console의 에러 메시지
2. Network 탭의 API 응답
3. 사용자 계정 (email)
4. 학원 ID
5. 포인트 충전 요청 ID (있다면)

---

**이제 실제로 포인트 충전 신청을 먼저 진행해주세요!**

현재 데이터베이스에 충전 요청이 없어서 승인할 것이 없습니다.
