# ✅ Solapi 템플릿 등록 및 승인 시스템 완성

## 🎯 구현 완료

실제 Solapi API를 통한 **템플릿 등록**, **승인 상태 조회**, **목록 동기화** 시스템이 완성되었습니다.

---

## 📡 API 엔드포인트

### 1️⃣ 템플릿 등록 API
```
POST /api/kakao/templates/register
```

**기능**: Solapi API를 통해 카카오 알림톡 템플릿을 실제로 등록 신청합니다.

**요청 (Request)**:
```json
{
  "userId": "user-1771479246368-du957iw33",
  "channelId": "ch_1772359215883_fk4otb5hv",
  "pfId": "@학원이름",
  "templateCode": "TEST_001",
  "templateName": "출석 안내 템플릿",
  "content": "안녕하세요, #{이름}님!\n\n오늘의 출석 안내입니다.\n상세 내용은 아래 링크를 확인해주세요.\n#{리포트URL}",
  "categoryCode": "008",
  "messageType": "BA",
  "emphasizeType": "NONE",
  "buttons": [
    {
      "ordering": 1,
      "type": "WL",
      "name": "상세 보기",
      "linkMo": "https://superplacestudy.pages.dev",
      "linkPc": "https://superplacestudy.pages.dev"
    }
  ],
  "securityFlag": false
}
```

**응답 (Response - 성공)**:
```json
{
  "success": true,
  "template": {
    "id": "tpl_1710734700000_abc123",
    "templateCode": "TEST_001",
    "templateName": "출석 안내 템플릿",
    "status": "REG",
    "inspectionStatus": "REG"
  },
  "solapi": {
    "templateId": "TEST_001",
    "name": "출석 안내 템플릿",
    "status": "REG",
    "inspectionStatus": "REG",
    ...
  },
  "message": "템플릿이 Solapi에 등록 신청되었습니다. 카카오 승인 대기 중입니다."
}
```

**응답 (Response - 실패)**:
```json
{
  "success": false,
  "error": "Invalid template content",
  "details": {...},
  "code": "InvalidParameter"
}
```

---

### 2️⃣ 템플릿 승인 상태 조회 API
```
GET /api/kakao/templates/register?templateId=TEST_001&pfId=@학원이름&userId=user-...
```

**기능**: Solapi에서 템플릿의 최신 승인 상태를 실시간으로 조회합니다.

**응답 (Response)**:
```json
{
  "success": true,
  "template": {
    "templateId": "TEST_001",
    "name": "출석 안내 템플릿",
    "content": "...",
    "inspectionStatus": "APR",
    "status": "ACTIVE"
  },
  "inspectionStatus": "APR",
  "status": "ACTIVE",
  "isApproved": true,
  "statusMessage": "승인됨 ✅"
}
```

**승인 상태 코드**:
| 코드 | 의미 | 사용 가능 |
|------|------|----------|
| REQ | 등록 대기 | ❌ |
| REG | 검수 대기 | ❌ |
| **APR** | **승인됨 ✅** | **✅ 사용 가능** |
| REJ | 반려됨 ❌ | ❌ |
| REV | 재검수 요청 | ❌ |

---

### 3️⃣ 템플릿 목록 조회 API
```
GET /api/kakao/templates/list?pfId=@학원이름&userId=user-...&channelId=ch_...
```

**기능**: 
- Solapi에 등록된 전체 템플릿 목록 조회
- 로컬 DB와 자동 동기화
- 승인된 템플릿만 필터링 가능

**응답 (Response)**:
```json
{
  "success": true,
  "templates": [
    {
      "templateId": "TEST_001",
      "name": "출석 안내 템플릿",
      "content": "...",
      "inspectionStatus": "APR",
      "isApproved": true,
      "canUse": true,
      "statusMessage": "승인됨 ✅"
    },
    {
      "templateId": "TEST_002",
      "name": "숙제 안내 템플릿",
      "inspectionStatus": "REG",
      "isApproved": false,
      "canUse": false,
      "statusMessage": "검수 대기"
    }
  ],
  "count": 2,
  "approvedCount": 1
}
```

---

## 🔄 사용 플로우

### 원장/교사 입장

```
1. 템플릿 작성
   └─> 프론트엔드에서 템플릿 내용 입력
       ├─ 템플릿 코드 (예: TEST_001)
       ├─ 템플릿 이름
       ├─ 내용 (#{변수} 포함)
       ├─ 버튼 (선택사항)
       └─ 카테고리 코드

2. 등록 신청
   └─> POST /api/kakao/templates/register 호출
       ├─ Solapi API로 전송
       ├─ 카카오 검수 자동 제출
       └─ 로컬 DB 저장

3. 검수 대기
   └─> 카카오 검수 진행 (보통 1-3 영업일)
       ├─ inspectionStatus: REQ → REG
       └─ 메일/알림으로 결과 통보

4. 승인 상태 확인
   └─> GET /api/kakao/templates/register 호출
       ├─ Solapi에서 최신 상태 조회
       └─ inspectionStatus 확인
           ├─ APR → 승인됨 ✅ (사용 가능)
           └─ REJ → 반려됨 ❌ (수정 후 재신청)

5. 템플릿 사용
   └─> GET /api/kakao/templates/list 호출
       ├─ 승인된 템플릿만 필터링 (canUse: true)
       └─ 알림톡 발송 시 templateId 사용
```

---

## 🛠️ 기술 구현

### HMAC-SHA256 인증
```typescript
async function createSolapiSignature(apiSecret: string) {
  const dateTime = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 15);
  const hmacData = dateTime + salt;
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, 
    new TextEncoder().encode(hmacData)
  );
  
  return { dateTime, salt, signature: toHex(signature) };
}
```

### Solapi API 호출 (템플릿 등록)
```typescript
const response = await fetch('https://api.solapi.com/kakao/v1/templates', {
  method: 'POST',
  headers: {
    'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${dateTime}, salt=${salt}, signature=${signature}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pfId: '@학원이름',
    templateId: 'TEST_001',
    name: '출석 안내 템플릿',
    content: '...',
    categoryCode: '008',
    messageType: 'BA',
    buttons: [...]
  })
});
```

### Solapi API 호출 (상태 조회)
```typescript
const response = await fetch(
  `https://api.solapi.com/kakao/v1/templates/${pfId}/${templateId}`,
  {
    method: 'GET',
    headers: {
      'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, ...`
    }
  }
);
```

### 로컬 DB 자동 동기화
```typescript
// Solapi 템플릿 목록 조회 후
for (const solapiTemplate of templates) {
  const existing = await DB.prepare(`
    SELECT id FROM AlimtalkTemplate 
    WHERE userId = ? AND templateCode = ?
  `).bind(userId, solapiTemplate.templateId).first();

  if (!existing) {
    // 새 템플릿 추가
    await DB.prepare(`INSERT INTO AlimtalkTemplate (...) VALUES (...)`)
      .bind(...).run();
  } else {
    // 기존 템플릿 상태 업데이트
    await DB.prepare(`
      UPDATE AlimtalkTemplate 
      SET inspectionStatus = ?, updatedAt = ?
      WHERE templateCode = ?
    `).bind(solapiTemplate.inspectionStatus, ...).run();
  }
}
```

---

## 📊 템플릿 필드 설명

### 필수 필드
| 필드 | 설명 | 예시 |
|------|------|------|
| pfId | 카카오 채널 PF ID | @학원이름 |
| templateId | 사용자 정의 템플릿 코드 | TEST_001, ATTENDANCE_01 |
| name | 템플릿 이름 | 출석 안내 템플릿 |
| content | 템플릿 내용 | 안녕하세요, #{이름}님! |
| categoryCode | 카테고리 코드 | 008 (일반), 012 (교육) |

### 선택 필드
| 필드 | 설명 | 기본값 |
|------|------|--------|
| messageType | 메시지 타입 | BA (기본형) |
| emphasizeType | 강조 타입 | NONE |
| buttons | 버튼 배열 | [] |
| securityFlag | 보안 템플릿 여부 | false |

### 변수 사용
템플릿 내용에 `#{변수명}` 형식으로 변수를 포함할 수 있습니다:
- `#{이름}` - 수신자 이름
- `#{학생이름}` - 학생 이름
- `#{리포트URL}` - 랜딩페이지 URL
- `#{날짜}` - 날짜
- `#{시간}` - 시간

---

## 🧪 테스트 방법

### 1. 템플릿 등록 신청
```bash
curl -X POST https://superplacestudy.pages.dev/api/kakao/templates/register \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-...",
    "channelId": "ch_...",
    "pfId": "@학원이름",
    "templateCode": "TEST_001",
    "templateName": "출석 안내",
    "content": "안녕하세요, #{이름}님!\n\n오늘의 출석 안내입니다.",
    "categoryCode": "008",
    "messageType": "BA"
  }'
```

**예상 응답**:
```json
{
  "success": true,
  "template": {
    "templateCode": "TEST_001",
    "status": "REG"
  },
  "message": "템플릿이 Solapi에 등록 신청되었습니다."
}
```

### 2. 승인 상태 조회 (1-3일 후)
```bash
curl "https://superplacestudy.pages.dev/api/kakao/templates/register?templateId=TEST_001&pfId=@학원이름&userId=user-..."
```

**예상 응답**:
```json
{
  "success": true,
  "inspectionStatus": "APR",
  "isApproved": true,
  "statusMessage": "승인됨 ✅"
}
```

### 3. 템플릿 목록 조회
```bash
curl "https://superplacestudy.pages.dev/api/kakao/templates/list?pfId=@학원이름&userId=user-..."
```

**예상 응답**:
```json
{
  "success": true,
  "templates": [
    {
      "templateId": "TEST_001",
      "inspectionStatus": "APR",
      "canUse": true
    }
  ],
  "approvedCount": 1
}
```

---

## 🚀 배포 정보

- **커밋 ID**: `88075deb`
- **배포 URL**: https://superplacestudy.pages.dev
- **배포 시간**: 2026-03-08 02:00 (KST)
- **예상 완료**: 5-7분 (02:05~02:07)

---

## 📝 환경 변수

Cloudflare Pages 환경 변수 설정 필요:
```
SOLAPI_API_KEY=발급받은_키
SOLAPI_API_SECRET=발급받은_시크릿
```

---

## ⚠️ 주의사항

### 1. 카테고리 코드
카카오 비즈니스 카테고리에 맞는 코드 사용:
- `008`: 일반
- `012`: 교육
- `019`: 기타
- [전체 목록](https://developers.solapi.com/references/kakao/categories)

### 2. 템플릿 작성 가이드
- **변수**: `#{변수명}` 형식 (공백 없이)
- **버튼**: 최대 5개
- **내용 길이**: 최대 1,000자
- **강조 문구**: 최대 23자
- **URL**: HTTPS만 허용

### 3. 검수 반려 사유 (흔한 케이스)
- 광고성 문구 포함
- 카테고리 불일치
- 변수명 오타
- URL 형식 오류
- 버튼 링크 불일치

### 4. 검수 기간
- **평일**: 1-3 영업일
- **주말/공휴일**: 검수 진행 안 됨
- **긴급**: Solapi 고객센터 문의

---

## ✅ 완료 체크리스트

- [x] POST /api/kakao/templates/register 구현
- [x] GET /api/kakao/templates/register (상태 조회) 구현
- [x] GET /api/kakao/templates/list 구현
- [x] HMAC-SHA256 인증 구현
- [x] 로컬 DB 자동 동기화
- [x] 승인 상태 변환 (REQ, REG, APR, REJ)
- [x] 커밋 & 푸시 완료
- [ ] 배포 완료 대기 (5-7분)
- [ ] 실제 테스트 (Solapi 계정 필요)

---

## 🎯 다음 단계

배포 완료 후:
1. Solapi 계정 로그인
2. 카카오 채널 PF ID 확인 (`@학원이름`)
3. 테스트 템플릿 등록 신청
4. 1-3일 후 승인 상태 확인
5. 승인된 템플릿으로 알림톡 발송 테스트

---

**참고 문서**: `SOLAPI_TEMPLATE_SYSTEM.md`
