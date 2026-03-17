# 400 에러 디버깅 가이드

## 🚀 배포 정보

- **커밋 ID**: `97c3c26c`
- **커밋 메시지**: "fix: 400 에러 디버깅을 위한 상세 로깅 추가"
- **배포 시간**: 2026-03-17
- **배포 URL**: https://suplacestudy.com

## 📋 수정 사항

### 1. 백엔드 디버깅 로깅 추가 (`functions/api/admin/academy-bot-subscriptions.js`)

#### 요청 본문 로깅
```javascript
console.log('📥 Received request body:', JSON.stringify(body, null, 2));
```

#### 파싱된 필드 로깅
```javascript
console.log('🔍 Parsed fields:', {
  academyId,
  productId,
  botId,
  finalBotId,
  studentCount,
  subscriptionStart,
  subscriptionEnd,
  dailyUsageLimit
});
```

#### 상세한 400 에러 응답

##### 필수 필드 누락
```json
{
  "error": "academyId and botId (or productId) are required",
  "received": {
    "academyId": "...",
    "botId": "...",
    "productId": "...",
    "finalBotId": "..."
  }
}
```

##### studentCount 검증 실패
```json
{
  "error": "studentCount must be greater than 0",
  "received": {
    "studentCount": "...",
    "type": "number|string"
  }
}
```

##### 날짜 필드 누락
```json
{
  "error": "subscriptionStart and subscriptionEnd are required",
  "received": {
    "subscriptionStart": "...",
    "subscriptionEnd": "..."
  }
}
```

##### 날짜 형식 오류
```json
{
  "error": "Invalid date format",
  "received": {
    "subscriptionStart": "...",
    "subscriptionEnd": "..."
  }
}
```

##### 날짜 범위 오류
```json
{
  "error": "subscriptionEnd must be after subscriptionStart",
  "received": {
    "subscriptionStart": "...",
    "subscriptionEnd": "...",
    "startDate": "2026-03-17T00:00:00.000Z",
    "endDate": "2026-03-16T00:00:00.000Z"
  }
}
```

### 2. 프론트엔드 에러 처리 (`src/app/dashboard/admin/ai-bots/assign/page.tsx`)

이미 상세한 에러 로깅이 구현되어 있음:
```javascript
console.log('📤 학원 할당 요청:', payload);
console.log('🔐 Token:', token ? `${token.substring(0, 20)}...` : 'null');
console.log('📥 응답 상태:', response.status, response.statusText);
console.log('📥 응답 데이터:', data);
```

## 🔍 디버깅 절차

### 1단계: 배포 확인 (3-5분 대기)

1. https://dash.cloudflare.com 접속
2. Pages 프로젝트 확인
3. 최신 배포 상태 확인

### 2단계: 프론트엔드 로그 확인

1. https://suplacestudy.com/dashboard/admin/ai-bots/assign/ 접속
2. F12 개발자 도구 열기
3. Console 탭으로 이동
4. 학원 AI 봇 할당 시도
5. 다음 로그 확인:

```
📤 학원 할당 요청: {
  academyId: "...",
  botId: "...",
  studentCount: 10,
  subscriptionStart: "2026-03-17",
  subscriptionEnd: "2026-04-17",
  pricePerStudent: 0,
  dailyUsageLimit: 15,
  memo: "..."
}
```

### 3단계: 백엔드 로그 확인

Cloudflare Pages Functions 로그에서 다음 확인:

```
📥 Received request body: {
  "academyId": "...",
  "botId": "...",
  "studentCount": 10,
  ...
}

🔍 Parsed fields: {
  academyId: "...",
  productId: undefined,
  botId: "...",
  finalBotId: "...",
  studentCount: 10,
  ...
}
```

### 4단계: 400 에러 응답 분석

400 에러 발생 시 응답 본문의 `received` 필드 확인:

```json
{
  "error": "구체적인 에러 메시지",
  "received": {
    // 실제로 받은 값들
  }
}
```

## 🎯 예상되는 400 에러 원인

### 1. `botId` 필드 전송 실패
**증상**: `finalBotId`가 `undefined` 또는 `null`
**확인**: 프론트엔드 payload에 `botId` 필드가 있는지 확인
**해결**: `page.tsx` 441번 라인 확인

### 2. `studentCount` 타입 오류
**증상**: `studentCount`가 문자열 타입 또는 0
**확인**: `parseInt(studentLimit)` 결과 확인
**해결**: 숫자 변환 로직 확인

### 3. 날짜 형식 오류
**증상**: 날짜 파싱 실패
**확인**: `YYYY-MM-DD` 형식인지 확인
**해결**: `toISOString().split('T')[0]` 사용

### 4. `academyId` 누락
**증상**: `selectedAcademy`가 빈 문자열
**확인**: 학원 선택 여부 확인
**해결**: 학원 선택 필수 체크

## 📊 테스트 시나리오

### 정상 케이스
```javascript
{
  academyId: "valid-academy-id",
  botId: "valid-bot-id",
  studentCount: 10,
  subscriptionStart: "2026-03-17",
  subscriptionEnd: "2026-04-17",
  pricePerStudent: 0,
  dailyUsageLimit: 15,
  memo: "Test"
}
```

### 비정상 케이스 1: botId 누락
```javascript
{
  academyId: "valid-academy-id",
  // botId 없음
  studentCount: 10,
  ...
}
// 예상 응답:
{
  "error": "academyId and botId (or productId) are required",
  "received": {
    "academyId": "valid-academy-id",
    "botId": undefined,
    "productId": undefined,
    "finalBotId": undefined
  }
}
```

### 비정상 케이스 2: studentCount 0
```javascript
{
  academyId: "valid-academy-id",
  botId: "valid-bot-id",
  studentCount: 0,  // 또는 "0"
  ...
}
// 예상 응답:
{
  "error": "studentCount must be greater than 0",
  "received": {
    "studentCount": 0,
    "type": "number"
  }
}
```

### 비정상 케이스 3: 날짜 순서 오류
```javascript
{
  academyId: "valid-academy-id",
  botId: "valid-bot-id",
  studentCount: 10,
  subscriptionStart: "2026-04-17",
  subscriptionEnd: "2026-03-17",  // 시작일보다 빠름
  ...
}
// 예상 응답:
{
  "error": "subscriptionEnd must be after subscriptionStart",
  "received": {
    "subscriptionStart": "2026-04-17",
    "subscriptionEnd": "2026-03-17",
    "startDate": "2026-04-17T00:00:00.000Z",
    "endDate": "2026-03-17T00:00:00.000Z"
  }
}
```

## 🔧 다음 단계

1. **배포 완료 대기** (3-5분)
2. **프론트엔드 테스트**
   - 학원 선택
   - AI 봇 선택
   - 할당 실행
   - 콘솔 로그 확인
3. **400 에러 발생 시**
   - 에러 응답의 `received` 필드 확인
   - 어떤 필드가 문제인지 정확히 파악
   - 해당 필드의 값과 타입 확인
4. **추가 수정 필요 시**
   - 정확한 원인 파악 후 수정
   - 커밋 및 배포
   - 재테스트

## 📞 문제 보고 형식

400 에러 발생 시 다음 정보를 제공해주세요:

```
### 에러 정보
- 상태 코드: 400
- 에러 메시지: "..."
- received 필드: { ... }

### 프론트엔드 로그
📤 학원 할당 요청: { ... }

### 예상 원인
- [ ] botId 누락
- [ ] studentCount 타입 오류
- [ ] 날짜 형식 오류
- [ ] 기타: ...
```

## ✅ 체크리스트

- [x] 백엔드에 상세 로깅 추가
- [x] 400 에러 응답에 `received` 필드 추가
- [x] 프론트엔드 에러 처리 확인
- [x] 변경사항 커밋 및 푸시
- [ ] 배포 완료 대기 (3-5분)
- [ ] 프론트엔드 테스트
- [ ] 400 에러 원인 파악
- [ ] 최종 수정 및 배포
