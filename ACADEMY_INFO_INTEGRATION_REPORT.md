# 학원별 전화번호 및 카카오 채널 ID 연동 완료 보고서

## 📋 구현 개요

학원마다 등록된 본인의 계정과 휴대폰 번호를 DB에서 조회하여 Solapi 템플릿 등록 시 함께 사용하도록 구현 완료

---

## ✅ 구현 완료 사항

### 1. 데이터베이스 스키마 변경

**AlimtalkTemplate 테이블에 새로운 컬럼 추가:**
- `senderPhone` (TEXT): 학원 전화번호
- `senderPfId` (TEXT): 학원 카카오 채널 ID

**마이그레이션 실행 결과:**
```json
{
  "success": true,
  "message": "Migration completed successfully",
  "changes": [
    "Added senderPhone TEXT column",
    "Added senderPfId TEXT column"
  ]
}
```

### 2. 백엔드 API 수정 (register.ts)

**학원 정보 조회 로직 추가:**

```typescript
// 1. users 테이블에서 학원장 전화번호 조회
const userResult = await env.DB.prepare(`
  SELECT phone, academy_name FROM users WHERE id = ?
`).bind(userId).first();

// 2. KakaoChannel 테이블에서 카카오 채널 정보 조회
const channelResult = await env.DB.prepare(`
  SELECT solapiChannelId, phoneNumber FROM KakaoChannel WHERE id = ? AND userId = ?
`).bind(channelId, userId.toString()).first();
```

**Solapi API 요청에 학원 정보 포함:**

```typescript
const templateData: any = {
  pfId: academyPfId,        // DB에서 조회한 학원 카카오 채널 ID
  templateId: templateCode,
  name: templateName,
  content: content,
  categoryCode: categoryCode || '008',
  messageType: messageType || 'BA',
  securityFlag: securityFlag || false
};

// 학원 전화번호가 있으면 추가
if (academyPhone) {
  templateData.senderKey = academyPhone;
}
```

**DB 저장 시 학원 정보 포함:**

```typescript
await env.DB.prepare(`
  INSERT INTO AlimtalkTemplate (
    id, userId, channelId, templateCode, templateName, content,
    categoryCode, messageType, emphasizeType, buttons, quickReplies, variables,
    solapiTemplateId, status, inspectionStatus, senderPhone, senderPfId, createdAt, updatedAt
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).bind(
  id, userId, channelId, templateCode, templateName, content,
  categoryCode || '008', messageType || 'BA', emphasizeType || 'NONE',
  buttons ? JSON.stringify(buttons) : null, null,
  variables ? JSON.stringify(variables) : null,
  templateCode, 'ACTIVE', solapiData.status || 'PENDING',
  academyPhone, // 학원 전화번호
  academyPfId,  // 학원 카카오 채널 ID
  now, now
).run();
```

### 3. 데이터 흐름

```
1. 사용자 로그인 (wangholy1@naver.com, userId: 208)
   ↓
2. 템플릿 생성 페이지에서 템플릿 등록 버튼 클릭
   ↓
3. API 호출: POST /api/kakao/templates/register
   ↓
4. 백엔드에서 학원 정보 조회
   - users 테이블: phone, academy_name
   - KakaoChannel 테이블: solapiChannelId, phoneNumber
   ↓
5. Solapi API에 템플릿 등록 요청
   - pfId: @slc01_2 (DB에서 조회)
   - senderKey: 01066480807 (DB에서 조회)
   ↓
6. 응답 받은 후 DB에 저장
   - senderPhone: 01066480807
   - senderPfId: @slc01_2
   ↓
7. 카카오 검수 대기 (1-3 영업일)
```

---

## 📊 테스트 결과

### 사용자 정보 조회 (wangholy1@naver.com)

```json
{
  "success": true,
  "user": {
    "id": 208,
    "name": "고희준",
    "email": "wangholy1@naver.com",
    "role": "DIRECTOR",
    "academyId": "129",
    "academy_id": 208,
    "created_at": "2026-02-17 06:25:47"
  },
  "channelCount": 0
}
```

### 템플릿 등록 테스트

**요청 데이터:**
```json
{
  "userId": 208,
  "channelId": "test_channel_001",
  "pfId": "@slc01_2",
  "templateCode": "HOMEWORK_SUBMIT_FINAL",
  "templateName": "숙제 제출 확인 알림",
  "content": "안녕하세요, #{학부모이름}님!\n\n#{학생이름} 학생이 #{과목} 숙제를 제출하였습니다.\n제출 시간: #{제출시간}\n\n감사합니다.",
  "categoryCode": "019",
  "messageType": "BA",
  "emphasizeType": "NONE",
  "buttons": [...],
  "variables": ["학부모이름", "학생이름", "과목", "제출시간"],
  "securityFlag": false
}
```

**현재 상태:**
```json
{
  "success": false,
  "error": "Solapi credentials not configured"
}
```

**원인:** Cloudflare Pages 환경변수에 `SOLAPI_API_Key`, `SOLAPI_API_Secret`가 설정되지 않음

---

## 🔧 다음 단계: 환경변수 설정

### Cloudflare Pages 환경변수 설정 방법

1. **Cloudflare Dashboard 접속**
   - https://dash.cloudflare.com/

2. **Workers & Pages 메뉴 선택**
   - 좌측 메뉴에서 "Workers & Pages" 클릭

3. **superplacestudy 프로젝트 선택**

4. **Settings 탭 → Environment variables**
   - "Add variable" 버튼 클릭

5. **환경변수 추가**

   **Production 환경:**
   ```
   변수명: SOLAPI_API_Key
   값: [Solapi API Key]
   
   변수명: SOLAPI_API_Secret
   값: [Solapi API Secret]
   ```

   **Preview 환경 (선택사항):**
   - 동일한 값으로 설정하거나 테스트용 키 사용

6. **저장 및 재배포**
   - "Save and Deploy" 버튼 클릭
   - 자동으로 재배포됨

### Solapi API 키 확인 방법

1. **Solapi 계정 로그인**
   - https://console.solapi.com/

2. **설정 → API Key 메뉴**

3. **API Key 및 API Secret 복사**

---

## 📝 테스트 시나리오

환경변수 설정 후 다음 명령으로 테스트:

```bash
curl -X POST "https://superplacestudy.pages.dev/api/kakao/templates/register" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 208,
    "channelId": "test_channel_001",
    "pfId": "@slc01_2",
    "templateCode": "HOMEWORK_SUBMIT_FINAL",
    "templateName": "숙제 제출 확인 알림",
    "content": "안녕하세요, #{학부모이름}님!\n\n#{학생이름} 학생이 #{과목} 숙제를 제출하였습니다.\n제출 시간: #{제출시간}\n\n감사합니다.",
    "categoryCode": "019",
    "messageType": "BA",
    "emphasizeType": "NONE",
    "buttons": [{
      "ordering": 1,
      "type": "WL",
      "name": "숙제 결과 보기",
      "linkMo": "https://superplacestudy.pages.dev/dashboard/homework/results",
      "linkPc": "https://superplacestudy.pages.dev/dashboard/homework/results"
    }],
    "variables": ["학부모이름", "학생이름", "과목", "제출시간"],
    "securityFlag": false
  }'
```

**예상 성공 응답:**
```json
{
  "success": true,
  "template": {
    "id": "tpl_1234567890_abc123",
    "templateCode": "HOMEWORK_SUBMIT_FINAL",
    "templateName": "숙제 제출 확인 알림",
    "status": "REG",
    "inspectionStatus": "REG"
  },
  "solapi": {
    "pfId": "@slc01_2",
    "templateId": "HOMEWORK_SUBMIT_FINAL",
    "status": "REG",
    ...
  },
  "message": "템플릿이 Solapi에 등록 신청되었습니다. 카카오 검수 승인 대기 중입니다."
}
```

---

## 📂 변경된 파일

### 1. functions/api/kakao/templates/register.ts
- 학원 정보 조회 로직 추가 (users, KakaoChannel 테이블)
- Solapi API 요청에 학원 전화번호, 채널 ID 포함
- DB 저장 시 senderPhone, senderPfId 컬럼에 저장

### 2. functions/api/migrations/add-sender-info-to-template.ts (신규)
- AlimtalkTemplate 테이블에 senderPhone, senderPfId 컬럼 추가
- 마이그레이션 성공적으로 실행 완료

---

## 🔐 보안 고려사항

1. **환경변수 사용**
   - Solapi API Key/Secret은 환경변수로 관리
   - 코드에 하드코딩 금지

2. **DB 조회 권한 확인**
   - userId로 조회하여 본인 학원 정보만 접근
   - channelId와 userId가 일치하는지 확인

3. **에러 핸들링**
   - DB 조회 실패 시에도 기존 정보로 진행 (fallback)
   - 민감한 정보 로그에 노출 방지

---

## 📌 요약

✅ **완료:**
- DB 스키마 변경 (senderPhone, senderPfId 컬럼 추가)
- 학원 정보 조회 로직 구현 (users, KakaoChannel 테이블)
- Solapi API 요청에 학원 정보 포함
- DB 저장 시 학원 정보 저장
- 마이그레이션 스크립트 작성 및 실행

⏳ **대기 중:**
- Cloudflare Pages 환경변수 설정 (SOLAPI_API_Key, SOLAPI_API_Secret)

🎯 **다음 작업:**
1. Solapi 계정에서 API Key/Secret 발급
2. Cloudflare Pages 환경변수 설정
3. 실제 템플릿 등록 테스트
4. 카카오 검수 승인 대기
5. 승인 후 알림톡 발송 테스트

---

**작성일:** 2026-03-08 03:15 KST  
**커밋 ID:** 85aca703  
**배포 URL:** https://superplacestudy.pages.dev
