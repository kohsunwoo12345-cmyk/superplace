# 발신번호 승인 시스템 최종 구현 보고서

## 📋 목차
1. [시스템 개요](#시스템-개요)
2. [구현 완료 항목](#구현-완료-항목)
3. [데이터베이스 스키마](#데이터베이스-스키마)
4. [API 엔드포인트](#api-엔드포인트)
5. [승인 프로세스 흐름](#승인-프로세스-흐름)
6. [테스트 결과](#테스트-결과)
7. [다음 단계](#다음-단계)

---

## 시스템 개요

학원장들이 발신번호를 등록하고, 관리자가 이를 검토하여 승인/반려하는 시스템입니다.
승인된 발신번호는 해당 학원장의 users 테이블에 자동으로 저장되어, 이후 SMS/알림톡 발송 시 사용됩니다.

**핵심 URL:**
- 학원장 등록 페이지: https://superplacestudy.pages.dev/dashboard/sender-number-register
- 관리자 승인 페이지: https://superplacestudy.pages.dev/dashboard/admin/sender-number-approval

---

## 구현 완료 항목

### ✅ 1. 데이터베이스 테이블
- `sender_number_requests` 테이블 생성 완료
- `users` 테이블에 `approved_sender_numbers`, `kakao_pf_id` 컬럼 추가 완료

### ✅ 2. 등록 페이지 (학원장용)
- 4개 필수 서류 업로드 기능
  - 통신사 가입증명원
  - 사업자등록증
  - 이용계약서
  - 위탁계약서
- 계약서 다운로드 기능
- Base64 파일 저장 (DB 직접 저장)

### ✅ 3. 승인 페이지 (관리자용)
- 신청 목록 조회
- 첨부 파일 미리보기
- 승인/반려 기능
- 실시간 상태 업데이트

### ✅ 4. 자동 데이터 저장
- 승인 시 `users.approved_sender_numbers`에 발신번호 자동 저장
- 학원장별 승인된 발신번호 추적 가능

### ✅ 5. 권한 관리
- 관리자 역할(ADMIN, SUPER_ADMIN) 검증
- 사용자 역할 업데이트 API 추가

---

## 데이터베이스 스키마

### sender_number_requests 테이블
```sql
CREATE TABLE sender_number_requests (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  userName TEXT,
  companyName TEXT NOT NULL,
  businessNumber TEXT NOT NULL,
  address TEXT,
  senderNumbers TEXT NOT NULL,
  representativeName TEXT,
  phone TEXT,
  email TEXT,
  telecomCertificateUrl TEXT,      -- Base64 or URL
  businessRegistrationUrl TEXT,    -- Base64 or URL
  serviceAgreementUrl TEXT,        -- Base64 or URL
  privacyAgreementUrl TEXT,        -- Base64 or URL
  status TEXT DEFAULT 'PENDING',   -- PENDING, APPROVED, REJECTED
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

## API 엔드포인트

### 1. 발신번호 등록 (학원장용)
**POST** `/api/sender-number/register`

**Headers:**
```
Authorization: Bearer {userId}|{email}|{role}
Content-Type: multipart/form-data
```

**Body (FormData):**
- `companyName`: 학원명
- `businessNumber`: 사업자등록번호
- `address`: 주소
- `senderNumbers`: 발신번호 (쉼표로 구분)
- `representativeName`: 대표자명
- `phone`: 연락처
- `email`: 이메일
- `telecomCertificate`: 통신사 가입증명원 파일
- `businessRegistration`: 사업자등록증 파일
- `serviceAgreement`: 이용계약서 파일
- `privacyAgreement`: 위탁계약서 파일

**Response:**
```json
{
  "success": true,
  "message": "발신번호 등록 신청이 완료되었습니다.",
  "requestId": "snr_1772924549228_9niuki"
}
```

---

### 2. 신청 목록 조회 (관리자용)
**GET** `/api/admin/sender-number-requests`

**Headers:**
```
Authorization: Bearer {userId}|{email}|ADMIN
```

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "snr_xxx",
      "userId": "208.0",
      "userName": "고희준",
      "companyName": "테스트학원2",
      "businessNumber": "987-65-43210",
      "senderNumbers": "010-9999-8888",
      "status": "PENDING",
      "fileUrls": {
        "telecomCertificate": "data:...",
        "businessRegistration": "data:...",
        "serviceAgreement": "data:...",
        "privacyAgreement": "data:..."
      },
      "createdAt": "2026-03-07T23:02:29.228Z"
    }
  ],
  "total": 4
}
```

---

### 3. 발신번호 승인 (관리자용)
**POST** `/api/admin/sender-number-requests/approve`

**Headers:**
```
Authorization: Bearer {userId}|{email}|ADMIN
Content-Type: application/json
```

**Body:**
```json
{
  "requestId": "snr_1772924549228_9niuki"
}
```

**Response:**
```json
{
  "success": true,
  "message": "발신번호 등록이 승인되었습니다.",
  "approvedNumbers": "010-9999-8888",
  "userId": "208.0"
}
```

**승인 후 자동 처리:**
1. `sender_number_requests` 테이블의 status를 'APPROVED'로 변경
2. `users.approved_sender_numbers`에 발신번호 저장
3. 승인 시각과 승인자 기록

---

### 4. 발신번호 반려 (관리자용)
**POST** `/api/admin/sender-number-requests/reject`

**Headers:**
```
Authorization: Bearer {userId}|{email}|ADMIN
Content-Type: application/json
```

**Body:**
```json
{
  "requestId": "snr_xxx",
  "reason": "서류 불충분"
}
```

---

### 5. 마이그레이션
**GET** `/api/migrations/add-sender-info-to-users`

users 테이블에 `approved_sender_numbers`와 `kakao_pf_id` 컬럼을 추가합니다.

---

### 6. 사용자 역할 변경 (디버그용)
**POST** `/api/debug/update-user-role`

**Body:**
```json
{
  "email": "wangholy1@naver.com",
  "role": "ADMIN"
}
```

---

## 승인 프로세스 흐름

```
┌─────────────────────────────────────────────────────────────┐
│                     1. 학원장 신청                            │
│  /dashboard/sender-number-register                           │
│  - 회사 정보 입력                                             │
│  - 4개 서류 업로드                                            │
│  - 신청 완료                                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            2. DB 저장 (sender_number_requests)               │
│  - status: PENDING                                           │
│  - 파일: Base64 인코딩 저장                                   │
│  - userId, senderNumbers 등 저장                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  3. 관리자 검토                               │
│  /dashboard/admin/sender-number-approval                     │
│  - 신청 목록 확인                                             │
│  - 첨부 파일 확인                                             │
│  - 승인 또는 반려 결정                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
           ┌─────────┴─────────┐
           │                   │
           ▼                   ▼
    ┌──────────┐       ┌──────────┐
    │   승인    │       │   반려    │
    └─────┬────┘       └─────┬────┘
          │                  │
          ▼                  ▼
┌──────────────────┐  ┌──────────────────┐
│ status: APPROVED │  │ status: REJECTED │
│ approvedAt 기록  │  │ rejectionReason  │
└────────┬─────────┘  └──────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│           4. users 테이블 자동 업데이트                        │
│  UPDATE users                                                │
│  SET approved_sender_numbers = '010-9999-8888'              │
│  WHERE id = 208                                              │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│           5. SMS/알림톡 발송 시 사용                           │
│  users.approved_sender_numbers에서 발신번호 조회              │
│  해당 번호로 메시지 발송                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 테스트 결과

### 테스트 사용자
- **Email:** wangholy1@naver.com
- **User ID:** 208
- **Role:** ADMIN (변경 완료)
- **Academy ID:** 129

### 승인된 신청
1. **snr_1772924549228_9niuki**
   - 학원명: 테스트학원2
   - 발신번호: 010-9999-8888
   - 상태: APPROVED
   - 승인 시각: 2026-03-07T23:11:30.971Z

2. **snr_1772924466699_28ffef**
   - 학원명: 슈퍼플레이스 테스트 학원
   - 발신번호: 02-1234-5678, 010-9876-5432
   - 상태: APPROVED
   - 승인 시각: 2026-03-07T23:20:xx.xxxZ

### 대기 중인 신청
- **snr_1772923500842_ge6ps**: 대기 중
- **snr_1772914333193_i25wj9**: 대기 중

### 마이그레이션 성공
- ✅ `users.approved_sender_numbers` 컬럼 추가 완료
- ✅ `users.kakao_pf_id` 컬럼 추가 완료

### 승인 프로세스 검증
1. ✅ 관리자 페이지 접근 (ADMIN 권한 검증)
2. ✅ 신청 목록 조회
3. ✅ 첨부 파일 미리보기 (Base64)
4. ✅ 승인 처리
5. ✅ status 업데이트 (PENDING → APPROVED)
6. ✅ users 테이블에 발신번호 자동 저장

---

## 다음 단계

### 1. 학원장 전화번호 검증
- [ ] users.approved_sender_numbers에서 발신번호 조회 테스트
- [ ] SMS/알림톡 발송 시 해당 번호 사용 검증

### 2. Kakao 채널 ID 연동
- [ ] 발신번호 승인 시 Kakao 채널 ID도 함께 입력받도록 확장
- [ ] users.kakao_pf_id 필드 활용

### 3. 파일 저장 방식 개선 (선택사항)
- [ ] Base64 방식 → R2 버킷 업로드로 전환 (대용량 파일 대비)
- [ ] 파일 크기 제한 설정 (현재 ~5MB 권장)

### 4. 알림 기능 추가 (선택사항)
- [ ] 신청 완료 시 관리자 이메일 알림
- [ ] 승인/반려 시 신청자 이메일 알림

### 5. UI 개선
- [ ] 승인 이력 표시
- [ ] 반려 사유 상세 표시
- [ ] 파일 다운로드 기능

### 6. 실제 Solapi 연동
- [ ] 승인된 발신번호를 Solapi에 등록
- [ ] Solapi API 검증 자동화

---

## 파일 목록

### 생성/수정된 파일
```
functions/api/
├── admin/
│   └── sender-number-requests/
│       ├── approve.ts                  ✅ 승인 처리 + users 테이블 업데이트
│       ├── reject.ts                   ✅ 반려 처리
│       └── [GET].ts                    ✅ 목록 조회
├── sender-number/
│   └── register.ts                     ✅ 신청 등록 (Base64 저장)
├── migrations/
│   ├── create-sender-number-requests-table.ts  ✅ 테이블 생성
│   └── add-sender-info-to-users.ts     ✅ users 컬럼 추가
└── debug/
    ├── update-user-role.ts             ✅ 역할 변경
    └── check-user-sender-numbers.ts    ✅ 사용자 데이터 확인

src/app/dashboard/
├── sender-number-register/
│   └── page.tsx                        ✅ 학원장 등록 페이지
└── admin/
    └── sender-number-approval/
        └── page.tsx                    ✅ 관리자 승인 페이지

public/documents/
├── (주)솔라피 이용계약서.docx
└── 개인정보처리_위탁_계약서.docx
```

---

## 커밋 이력

```bash
7e140e65 - debug: 사용자 발신번호 확인 API 추가
eda41fbd - fix: migration 파일 형식 수정 (onRequestGet 사용)
85368c2c - feat: 발신번호 승인 시 학원장 테이블에 자동 저장
b4ec73da - feat: 사용자 역할 변경 API 추가 (디버그용)
a2a2d6be - fix: 발신번호 등록 파일을 base64로 저장 및 표시
e96d34f7 - fix: 발신번호 등록 파일을 base64로 저장 및 표시
4c7e39e9 - docs: 발신번호 승인 시스템 최종 상태 보고서
... (이전 커밋 생략)
```

---

## 결론

✅ **발신번호 승인 시스템 구현 완료**

- 학원장들이 자율적으로 발신번호를 등록할 수 있습니다.
- 관리자가 서류를 검토하고 승인/반려할 수 있습니다.
- 승인된 발신번호는 자동으로 해당 학원장의 users 테이블에 저장됩니다.
- 이후 SMS/알림톡 발송 시 해당 발신번호를 조회하여 사용할 수 있습니다.

**다음 작업:** 실제 SMS/알림톡 발송 로직에서 `users.approved_sender_numbers`를 조회하여 발신번호로 사용하도록 연동하면 완전한 자동화가 가능합니다.

---

**작성일:** 2026-03-07  
**작성자:** Claude AI Developer  
**버전:** v1.0
