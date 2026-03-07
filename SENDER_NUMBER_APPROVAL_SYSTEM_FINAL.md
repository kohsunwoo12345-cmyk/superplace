# 발신번호 등록 승인 시스템 구현 완료 보고서

## ✅ 구현 완료 사항

### 1. **학원장용 발신번호 등록 페이지**
- **URL**: https://superplacestudy.pages.dev/dashboard/sender-number-register
- **기능**:
  - 4개 필수 서류 첨부: 통신사가입증명원, 사업자등록증, 이용계약서, 위탁계약서
  - 솔라피 이용계약서 및 개인정보처리 위탁계약서 다운로드
  - 학원 정보 입력 (학원명, 사업자번호, 발신번호 등)
  - FormData를 사용한 파일 업로드

### 2. **관리자용 승인 관리 페이지**
- **URL**: https://superplacestudy.pages.dev/dashboard/admin/sender-number-approval
- **기능**:
  - 전체 발신번호 등록 신청 목록 조회
  - 대기중/승인됨/반려됨 통계 표시
  - 첨부 파일 미리보기
  - 승인/반려 처리
  - 실시간 상태 업데이트

### 3. **API 엔드포인트**

#### 📤 등록 API
```
POST /api/sender-number/register
```
- FormData로 파일 및 텍스트 데이터 전송
- 4개 파일 필수: telecomCertificate, businessRegistration, serviceAgreement, privacyAgreement
- 인증된 사용자만 접근 가능

#### 📋 목록 조회 API
```
GET /api/admin/sender-number-requests
```
- 관리자 권한 필요 (ADMIN, SUPER_ADMIN)
- 모든 발신번호 등록 신청 조회
- 파일 URL 포함

#### ✅ 승인 API
```
POST /api/admin/sender-number-requests/approve
Body: { "requestId": "snr_xxx" }
```
- 관리자 권한 필요
- 신청 상태를 APPROVED로 변경
- 승인 시각 및 승인자 기록

#### ❌ 반려 API
```
POST /api/admin/sender-number-requests/reject
Body: { "requestId": "snr_xxx", "reason": "사유" }
```
- 관리자 권한 필요
- 신청 상태를 REJECTED로 변경
- 반려 사유, 반려 시각 및 반려자 기록

### 4. **데이터베이스 스키마**

```sql
CREATE TABLE sender_number_requests (
  id TEXT PRIMARY KEY,                  -- snr_timestamp_random
  userId TEXT NOT NULL,                 -- 신청자 ID
  userName TEXT,                        -- 신청자 이름
  companyName TEXT NOT NULL,            -- 학원명/회사명
  businessNumber TEXT NOT NULL,         -- 사업자등록번호
  address TEXT,                         -- 주소
  senderNumbers TEXT NOT NULL,          -- 발신번호 (쉼표로 구분)
  representativeName TEXT,              -- 대표자명
  phone TEXT,                           -- 연락처
  email TEXT,                           -- 이메일
  telecomCertificateUrl TEXT,           -- 통신사가입증명원 URL
  businessRegistrationUrl TEXT,         -- 사업자등록증 URL
  serviceAgreementUrl TEXT,             -- 이용계약서 URL
  privacyAgreementUrl TEXT,             -- 위탁계약서 URL
  status TEXT DEFAULT 'PENDING',        -- PENDING, APPROVED, REJECTED
  createdAt TEXT NOT NULL,              -- 신청일시
  updatedAt TEXT NOT NULL,              -- 수정일시
  approvedAt TEXT,                      -- 승인일시
  approvedBy TEXT,                      -- 승인자 ID
  rejectedAt TEXT,                      -- 반려일시
  rejectedBy TEXT,                      -- 반려자 ID
  rejectionReason TEXT                  -- 반려 사유
)
```

### 5. **다운로드 가능한 계약서**

#### 솔라피 이용계약서
- **파일 경로**: `/public/documents/(주)솔라피 이용계약서.docx`
- **다운로드 URL**: https://superplacestudy.pages.dev/documents/(주)솔라피 이용계약서.docx
- **내용**: 
  - 발신번호 위임장
  - 위탁자: 학원장 (작성 필요)
  - 수탁자: (주)우리는 슈퍼플레이스다 (사업자: 110111-8101545)
  - 위임 목적: 학원 관리 플랫폼(SUPLACE)을 통한 학습 리포트 및 알림톡 발송 대행

#### 개인정보처리 위탁 계약서
- **파일 경로**: `/public/documents/개인정보처리_위탁_계약서.docx`
- **다운로드 URL**: https://superplacestudy.pages.dev/documents/개인정보처리_위탁_계약서.docx
- **내용**:
  - 개인정보 처리업무 위탁 계약서
  - 위탁 업무: 인터넷을 통한 문자메시지 발송
  - 개인정보 항목: 수신자 전화번호, 메시지 내용

---

## 📊 테스트 결과

### ✅ 등록 API 테스트 성공
```bash
curl -X POST "https://superplacestudy.pages.dev/api/sender-number/register" \
  -H "Authorization: Bearer 208|wangholy1@naver.com|DIRECTOR" \
  -F "companyName=슈퍼플레이스 테스트 학원" \
  -F "businessNumber=123-45-67890" \
  -F "address=서울시 강남구 테스트동 123-45" \
  -F "senderNumbers=02-1234-5678, 010-9876-5432" \
  -F "representativeName=홍길동" \
  -F "phone=010-1234-5678" \
  -F "email=test@example.com" \
  -F "telecomCertificate=@test_telecom.txt" \
  -F "businessRegistration=@test_business.txt" \
  -F "serviceAgreement=@test_service.txt" \
  -F "privacyAgreement=@test_privacy.txt"
```

**응답**:
```json
{
  "success": true,
  "message": "발신번호 등록 신청이 완료되었습니다.",
  "requestId": "snr_1772914333193_i25wj9"
}
```

### ✅ DB 마이그레이션 성공
```json
{
  "success": true,
  "message": "Migration completed successfully",
  "tables": ["sender_number_requests"]
}
```

---

## 🎯 사용 흐름

### 학원장 (일반 사용자)
1. 로그인 후 `/dashboard/sender-number-register` 접속
2. 필수 계약서 다운로드 (솔라피 이용계약서, 개인정보처리 위탁계약서)
3. 계약서 작성 및 스캔/촬영
4. 학원 정보 입력:
   - 학원명, 사업자등록번호
   - 등록할 발신번호 (여러 개 가능, 쉼표로 구분)
   - 대표자명, 연락처, 이메일 등
5. 4개 필수 서류 첨부:
   - 통신사 가입증명원 (통신사 홈페이지에서 발급)
   - 사업자등록증 사본
   - 솔라피 이용계약서 (작성 완료본)
   - 개인정보처리 위탁계약서 (작성 완료본)
6. "발신번호 등록 신청" 버튼 클릭
7. 관리자 승인 대기

### 관리자 (ADMIN, SUPER_ADMIN)
1. 로그인 후 `/dashboard/admin/sender-number-approval` 접속
2. 대기중인 신청 목록 확인
3. 신청 상세 정보 검토:
   - 학원 정보 (학원명, 사업자번호, 발신번호 등)
   - 첨부 서류 확인 (클릭하여 파일 미리보기)
4. 승인 또는 반려 처리:
   - **승인**: "승인" 버튼 클릭 → 상태가 APPROVED로 변경
   - **반려**: "반려" 버튼 클릭 → 반려 사유 입력 → 상태가 REJECTED로 변경
5. 승인 후 학원장에게 별도 안내 (메일 또는 알림)

---

## 📂 변경된 파일

### 프론트엔드 (UI)
- `src/app/dashboard/sender-number-register/page.tsx` - 학원장용 등록 페이지
- `src/app/dashboard/admin/sender-number-approval/page.tsx` - 관리자용 승인 페이지

### 백엔드 (API)
- `functions/api/sender-number/register.ts` - 등록 API
- `functions/api/admin/sender-number-requests.ts` - 목록 조회 API
- `functions/api/admin/sender-number-requests/approve.ts` - 승인 API
- `functions/api/admin/sender-number-requests/reject.ts` - 반려 API

### 마이그레이션
- `functions/api/migrations/create-sender-number-requests-table.ts` - 테이블 생성

### 계약서 파일
- `public/documents/(주)솔라피 이용계약서.docx`
- `public/documents/개인정보처리_위탁_계약서.docx`

---

## 🔐 권한 관리

| 역할 | 등록 신청 | 목록 조회 | 승인/반려 |
|------|----------|----------|----------|
| **일반 사용자** (DIRECTOR, TEACHER) | ✅ 가능 | ❌ 불가 | ❌ 불가 |
| **관리자** (ADMIN, SUPER_ADMIN) | ✅ 가능 | ✅ 가능 | ✅ 가능 |

---

## 📌 커밋 정보

- **커밋 ID**: 929ba24e
- **커밋 메시지**: "fix: 사용자 role 업데이트 마이그레이션 추가"
- **배포 URL**: https://superplacestudy.pages.dev
- **배포 일시**: 2026-03-08 03:35 KST

---

## ✅ 완료 체크리스트

- [x] 학원장용 발신번호 등록 페이지 구현
- [x] 관리자용 승인 관리 페이지 구현
- [x] 4개 필수 서류 첨부 기능
- [x] 솔라피 계약서 다운로드 기능
- [x] 개인정보처리 위탁계약서 다운로드 기능
- [x] 등록 API 구현 및 테스트
- [x] 목록 조회 API 구현
- [x] 승인 API 구현
- [x] 반려 API 구현
- [x] DB 테이블 생성 및 마이그레이션
- [x] 파일 업로드 테스트 (성공)
- [x] 실제 데이터 등록 테스트 (성공)
- [ ] 관리자 페이지 승인/반려 테스트 (권한 설정 필요)

---

## ⚠️ 다음 단계

1. **관리자 계정 권한 설정**
   - wangholy1@naver.com 계정의 role을 ADMIN으로 변경
   - 또는 별도의 관리자 계정 생성

2. **승인/반려 기능 테스트**
   - 관리자 계정으로 로그인
   - 승인 페이지에서 신청 목록 조회
   - 승인 및 반려 처리 테스트

3. **파일 저장 방식 개선** (선택사항)
   - 현재: R2 버킷 또는 placeholder 사용
   - 개선: Cloudflare R2 버킷 설정 또는 외부 파일 스토리지 연동

4. **알림 기능 추가** (선택사항)
   - 승인/반려 시 학원장에게 이메일 또는 알림 발송

---

**작성일**: 2026-03-08 03:40 KST  
**작성자**: AI Assistant  
**상태**: ✅ 구현 완료 및 테스트 완료 (승인/반려 제외)
