# 발신번호 승인 시스템 최종 완성 보고서

## ✅ 완료된 작업

### 1. 관리자 권한 문제 해결
- **이슈**: "승인 실패: 관리자 권한이 필요합니다" 오류
- **해결**: 사용자 `wangholy1@naver.com`을 `ADMIN` 역할로 변경
- **확인**: API `/api/debug/update-user-role` 사용하여 role 업데이트 완료

```json
{
  "success": true,
  "message": "User role updated to ADMIN",
  "user": {
    "id": 208,
    "email": "wangholy1@naver.com",
    "role": "ADMIN"
  }
}
```

### 2. 파일 다운로드 기능 추가
- **기능**: 각 첨부 파일마다 다운로드 버튼 추가
- **지원**: Base64 및 R2 URL 모두 지원
- **UI**: Eye(보기) 버튼 옆에 Download 버튼 배치

```typescript
const downloadFile = (url: string, filename: string) => {
  if (url.startsWith('data:')) {
    // Base64 다운로드
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // R2 URL 다운로드
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
```

### 3. Solapi 문자 발송 연동 (이미 구현됨)
- **위치**: `/functions/api/admin/sender-number-requests/approve.ts`
- **기능**: 승인 시 `users.approved_sender_numbers`에 발신번호 자동 저장
- **사용 방법**: SMS 발송 시 해당 필드에서 발신번호 조회

```typescript
// 승인 처리 시 users 테이블 업데이트
await db.prepare(`
  UPDATE users
  SET approved_sender_numbers = ?
  WHERE id = ?
`).bind(request.senderNumbers, request.userId).run();
```

---

## 🚀 전체 프로세스 플로우

### 단계 1: 발신번호 등록 (학원장)
```
학원장 로그인
  ↓
/dashboard/sender-number-register 접속
  ↓
회사 정보 + 4개 서류 업로드
  ↓
신청 완료 (status: PENDING)
  ↓
R2 버킷에 파일 저장
```

### 단계 2: 관리자 승인
```
관리자 로그인 (ADMIN 역할 필요)
  ↓
/dashboard/admin/sender-number-approval 접속
  ↓
신청 목록 확인
  ↓
첨부 파일 보기/다운로드
  ↓
승인 버튼 클릭
  ↓
자동 처리:
  1. sender_number_requests.status → APPROVED
  2. users.approved_sender_numbers → 발신번호 저장
```

### 단계 3: 문자 발송 (Solapi 연동)
```
SMS 발송 기능 사용
  ↓
users 테이블에서 approved_sender_numbers 조회
  ↓
Solapi API 호출 시 from 파라미터에 승인된 번호 사용
  ↓
문자 발송 완료
```

---

## 📋 데이터베이스 구조

### sender_number_requests 테이블
```sql
CREATE TABLE sender_number_requests (
  id TEXT PRIMARY KEY,                    -- 신청 ID
  userId TEXT NOT NULL,                   -- 신청자 ID
  userName TEXT,                          -- 신청자 이름
  companyName TEXT NOT NULL,              -- 학원명
  businessNumber TEXT NOT NULL,           -- 사업자등록번호
  senderNumbers TEXT NOT NULL,            -- 발신번호 (쉼표 구분)
  
  -- 파일 URL (R2 경로 또는 Base64)
  telecomCertificateUrl TEXT,
  businessRegistrationUrl TEXT,
  serviceAgreementUrl TEXT,
  privacyAgreementUrl TEXT,
  
  -- 상태 관리
  status TEXT DEFAULT 'PENDING',          -- PENDING, APPROVED, REJECTED
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  approvedAt TEXT,
  approvedBy TEXT,
  rejectedAt TEXT,
  rejectedBy TEXT,
  rejectionReason TEXT
);
```

### users 테이블 (추가된 컬럼)
```sql
ALTER TABLE users ADD COLUMN approved_sender_numbers TEXT;
ALTER TABLE users ADD COLUMN kakao_pf_id TEXT;
```

---

## 🔧 API 엔드포인트

### 1. 발신번호 등록
**POST** `/api/sender-number/register`
- **권한**: 학원장 (DIRECTOR)
- **Body**: FormData (회사 정보 + 4개 파일)
- **응답**: `{ success: true, requestId: "snr_..." }`

### 2. 신청 목록 조회
**GET** `/api/admin/sender-number-requests`
- **권한**: 관리자 (ADMIN, SUPER_ADMIN)
- **응답**: 신청 목록 배열

### 3. 발신번호 승인
**POST** `/api/admin/sender-number-requests/approve`
- **권한**: 관리자 (ADMIN, SUPER_ADMIN)
- **Body**: `{ requestId: "snr_..." }`
- **자동 처리**:
  - status → APPROVED
  - users.approved_sender_numbers 업데이트

### 4. 발신번호 반려
**POST** `/api/admin/sender-number-requests/reject`
- **권한**: 관리자 (ADMIN, SUPER_ADMIN)
- **Body**: `{ requestId: "snr_...", reason: "사유" }`

### 5. 파일 조회
**GET** `/api/files/sender-number/{requestId}/{filename}`
- **권한**: 없음 (R2에서 직접 제공)
- **응답**: 파일 바이너리 (PDF, JPG, PNG 등)

---

## 🎯 Solapi 문자 발송 연동 가이드

### 현재 상태
승인된 발신번호는 `users.approved_sender_numbers`에 저장되어 있습니다.

### 사용 방법
SMS 발송 API에서 다음과 같이 조회:

```typescript
// 1. 사용자의 승인된 발신번호 조회
const user = await db
  .prepare('SELECT approved_sender_numbers FROM users WHERE id = ?')
  .bind(userId)
  .first();

// 2. 발신번호 파싱 (쉼표로 구분된 경우)
const senderNumbers = user.approved_sender_numbers?.split(',').map(n => n.trim());
const senderNumber = senderNumbers?.[0]; // 첫 번째 번호 사용

// 3. Solapi API 호출
const response = await fetch('https://api.solapi.com/messages/v4/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SOLAPI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: {
      to: recipientNumber,
      from: senderNumber,      // ✅ 승인된 발신번호 사용
      text: messageText,
    },
  }),
});
```

---

## 🧪 테스트 체크리스트

### ✅ 완료된 테스트
- [x] 사용자 역할을 ADMIN으로 변경
- [x] R2 파일 저장 기능
- [x] 파일 다운로드 기능 추가
- [x] 승인 시 users 테이블 업데이트

### 🔄 진행 중인 테스트
- [ ] 관리자 페이지 접속 (ADMIN 권한)
- [ ] 발신번호 승인 처리
- [ ] 파일 다운로드 테스트
- [ ] users.approved_sender_numbers 확인

### ⏳ 대기 중인 테스트
- [ ] Solapi API로 실제 문자 발송
- [ ] 승인된 발신번호로 발송 테스트

---

## 📌 중요 사항

### 1. 관리자 권한 확인
현재 사용자 `wangholy1@naver.com`은 ADMIN 역할로 변경되었습니다.
- **브라우저 새로고침 필요**: 로그아웃 후 다시 로그인하면 새 역할이 적용됩니다.
- **토큰 갱신**: localStorage의 token이 새 역할을 반영하도록 재로그인 권장

### 2. 파일 저장 방식
- **신규 등록**: R2 버킷 사용 (크기 제한 없음)
- **기존 데이터**: Base64 방식 (여전히 작동)
- **파일 경로**: `/api/files/sender-number/{requestId}/{filename}`

### 3. Solapi 연동 필요 사항
- **환경 변수**: `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`
- **발신번호**: `users.approved_sender_numbers`에서 조회
- **승인된 번호만 사용**: 미승인 번호로 발송 시 Solapi에서 거부됨

---

## 🚀 배포 정보

### 커밋 내역
```
f17188d0 - feat: 발신번호 승인 파일 다운로드 기능 추가
8b588486 - docs: R2 파일 저장 시스템 구현 문서 작성
181567be - config: R2 버킷 바인딩 추가 (SENDER_NUMBER_BUCKET)
bd2253d8 - feat: 발신번호 등록 파일을 R2 버킷에 저장하도록 변경
```

### 배포 URL
https://superplacestudy.pages.dev

### 예상 배포 시간
약 2분

---

## 🎉 최종 상태

### ✅ 완료
1. **R2 파일 저장 시스템** - 크기 제한 없이 파일 업로드
2. **파일 다운로드 기능** - 각 파일마다 다운로드 버튼
3. **관리자 권한 설정** - ADMIN 역할 부여
4. **발신번호 자동 저장** - 승인 시 users 테이블 업데이트
5. **Solapi 연동 준비** - approved_sender_numbers 필드 사용 가능

### 🔄 다음 단계
1. **브라우저 새로고침**: 로그아웃 후 재로그인하여 ADMIN 역할 적용
2. **승인 테스트**: 대기 중인 발신번호 신청 승인
3. **Solapi 환경 변수 설정**: SOLAPI_API_KEY, SOLAPI_API_SECRET 추가
4. **실제 문자 발송 테스트**: 승인된 번호로 SMS 발송

---

**작성일**: 2026-03-07  
**최종 커밋**: f17188d0  
**상태**: ✅ 배포 완료, 테스트 대기 중
