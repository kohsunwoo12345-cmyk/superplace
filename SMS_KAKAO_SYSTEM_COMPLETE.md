# 📱 SMS/카카오 통합 발송 시스템 완전 가이드

## 🎯 시스템 개요

**배포 정보**
- 커밋: `e7f57d7`
- 배포일: 2026-02-21
- 상태: ✅ UI 완성, API 구현 필요
- URL: https://superplacestudy.pages.dev

---

## 📋 구현된 주요 기능

### 1️⃣ 메시지 발송 페이지 (`/dashboard/message-send`)

#### 핵심 기능
- ✅ **발송 유형 선택**: SMS(20P) / 카카오톡(15P)
- ✅ **발신번호 관리**: 등록된 발신번호 선택
- ✅ **수신자 선택** (3가지 방식):
  - 학생 선택: 학부모 연락처가 등록된 학생 목록에서 선택
  - 직접 입력: 수신자 이름/전화번호 직접 입력
  - 엑셀 업로드: 대량 수신자 엑셀 파일 업로드

#### 학생-학부모 매핑
```typescript
interface RecipientMapping {
  studentId: string;        // 학생 ID
  studentName: string;      // 학생 이름
  parentPhone: string;      // 학부모 전화번호
  landingPageUrl: string;   // 학생별 고유 랜딩페이지 URL
  grade?: string;           // 학년
  class?: string;           // 반
}
```

#### 학생별 랜딩페이지 연동
- 랜딩페이지 선택 시 각 학생마다 **고유 URL** 자동 생성
- URL 형식: `https://superplacestudy.pages.dev/l/{기본슬러그}-{학생ID}`
- 예시:
  - 학생A: `https://superplacestudy.pages.dev/l/report-student001`
  - 학생B: `https://superplacestudy.pages.dev/l/report-student002`

#### 메시지 작성
- 템플릿 선택 (저장된 템플릿 불러오기)
- 카카오톡: 제목 + 내용
- SMS: 내용만 (90자 이상 LMS 자동 인식)
- 변수 지원: `{{학생명}}`, `{{학부모명}}`, `{{URL}}`

#### 예약 발송
- 즉시 발송 / 예약 발송 선택
- 날짜/시간 지정

#### 발송 요약 (실시간 계산)
- 발송 유형
- 수신자 수
- 메시지당 포인트
- **총 차감 포인트**
- **잔여 포인트**

#### 포인트 차감 시스템
```typescript
const SMS_COST = 20;      // SMS: 20포인트/건
const KAKAO_COST = 15;    // 카카오: 15포인트/건

totalCost = recipientCount × costPerMessage
```

---

### 2️⃣ 발송 이력 페이지 (`/dashboard/message-history`)

#### 핵심 기능
- ✅ **통계 대시보드**
  - 총 발송 건수
  - 성공률 (%)
  - 사용 포인트
  - 이번 달 발송 건수

- ✅ **필터링 & 검색**
  - 발송 유형: 전체/SMS/카카오
  - 상태: 전체/완료/실패/발송중/대기
  - 검색: 메시지 내용, 발신번호

- ✅ **발송 이력 목록**
  - 발송 일시, 유형, 상태
  - 수신자 수, 성공/실패 건수
  - 사용 포인트
  - 메시지 내용 미리보기

- ✅ **상세보기**
  - 기본 정보 (유형, 발신번호, 수신자, 포인트)
  - 메시지 내용
  - 수신자 목록 (개별 발송 상태 포함)
  - 학생별 랜딩페이지 URL 표시

- ✅ **CSV 내보내기**
  - 발송 이력 CSV 다운로드

---

### 3️⃣ 발신번호 등록 페이지 (`/dashboard/sender-number-register`)

#### 핵심 기능
- ✅ **발신번호 등록 신청**
  - 전화번호 입력 (자동 하이픈 포맷)
  - 용도 입력
  - 통신서비스이용증명원 업로드 (필수)
  - 사업자등록증 업로드 (선택)

- ✅ **등록 현황**
  - 내 발신번호 목록
  - 승인 상태: 승인완료/승인대기/거절됨
  - 신청일, 승인일
  - 거절 사유 표시
  - 첨부 서류 다운로드

- ✅ **안내 정보**
  - 전기통신사업법 안내
  - 통신서비스이용증명원 발급 방법 (SKT/KT/LG U+)
  - 승인 기준

---

### 4️⃣ 사이드바 메뉴 업데이트

#### 관리자 (SUPER_ADMIN, ADMIN)
```typescript
{ name: "포인트 충전 승인", href: "/dashboard/admin/point-approvals", icon: Coins },
{ name: "메시지 발송", href: "/dashboard/message-send", icon: Send },
{ name: "발송 이력", href: "/dashboard/message-history", icon: History },
{ name: "발신번호 등록", href: "/dashboard/sender-number-register", icon: Phone },
{ name: "카카오 채널 등록", href: "/dashboard/kakao-channel", icon: MessageSquare },
```

#### 학원장 (DIRECTOR)
```typescript
{ name: "포인트 충전", href: "/dashboard/point-charge", icon: Coins },
{ name: "메시지 발송", href: "/dashboard/message-send", icon: Send },
{ name: "발송 이력", href: "/dashboard/message-history", icon: History },
{ name: "발신번호 등록", href: "/dashboard/sender-number-register", icon: Phone },
{ name: "카카오 채널 등록", href: "/dashboard/kakao-channel", icon: MessageSquare },
```

**차이점**:
- 관리자: 포인트 충전 **승인** 페이지
- 학원장: 포인트 충전 **신청** 페이지

---

## 🗄️ 데이터베이스 스키마

### 1. SenderNumber (발신번호)
```sql
CREATE TABLE IF NOT EXISTS SenderNumber (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  phoneNumber TEXT NOT NULL UNIQUE,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED
  verificationDocUrl TEXT,  -- 통신서비스이용증명원
  businessCertUrl TEXT,     -- 사업자등록증
  approvedBy TEXT,
  approvedAt TEXT,
  rejectionReason TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

### 2. MessageSendHistory (발송 이력)
```sql
CREATE TABLE IF NOT EXISTS MessageSendHistory (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  messageType TEXT NOT NULL,  -- SMS, KAKAO_ALIMTALK, KAKAO_FRIENDTALK
  senderNumber TEXT NOT NULL,
  recipientCount INTEGER NOT NULL,
  recipients TEXT NOT NULL,  -- JSON: [{studentId, studentName, parentPhone, landingPageUrl}]
  messageTitle TEXT,
  messageContent TEXT NOT NULL,
  landingPageTemplate TEXT,  -- 사용된 랜딩페이지 템플릿 ID
  pointsUsed INTEGER NOT NULL,
  pointCostPerMessage INTEGER NOT NULL,
  successCount INTEGER DEFAULT 0,
  failCount INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, SENDING, COMPLETED, FAILED
  sendResults TEXT,  -- JSON array
  scheduledAt TEXT,
  sentAt TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

### 3. MessageTemplate (메시지 템플릿)
```sql
CREATE TABLE IF NOT EXISTS MessageTemplate (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  name TEXT NOT NULL,
  messageType TEXT NOT NULL,  -- SMS, KAKAO_ALIMTALK, KAKAO_FRIENDTALK
  title TEXT,
  content TEXT NOT NULL,
  variables TEXT,  -- JSON: [{name, description, example}]
  category TEXT,   -- 출석, 숙제, 성적, 공지 등
  usageCount INTEGER DEFAULT 0,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

### 4. StudentLandingPage (학생별 랜딩페이지)
```sql
CREATE TABLE IF NOT EXISTS StudentLandingPage (
  id TEXT PRIMARY KEY,
  studentId TEXT NOT NULL,
  landingPageId TEXT NOT NULL,
  customSlug TEXT UNIQUE,  -- 학생 전용 커스텀 슬러그
  expiresAt TEXT,
  viewCount INTEGER DEFAULT 0,
  lastViewedAt TEXT,
  isActive INTEGER DEFAULT 1,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (studentId) REFERENCES User(id),
  FOREIGN KEY (landingPageId) REFERENCES LandingPage(id)
);
```

### 5. UploadedRecipient (엑셀 업로드 수신자)
```sql
CREATE TABLE IF NOT EXISTS UploadedRecipient (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  batchId TEXT NOT NULL,  -- 업로드 배치 ID
  studentName TEXT NOT NULL,
  parentName TEXT,
  parentPhone TEXT NOT NULL,
  grade TEXT,
  class TEXT,
  additionalInfo TEXT,  -- JSON
  isValid INTEGER DEFAULT 1,
  validationMessage TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

### 6. KakaoAlimtalkTemplate (카카오 알림톡 템플릿)
```sql
CREATE TABLE IF NOT EXISTS KakaoAlimtalkTemplate (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  channelId TEXT NOT NULL,
  templateCode TEXT NOT NULL UNIQUE,
  templateName TEXT NOT NULL,
  content TEXT NOT NULL,
  buttons TEXT,  -- JSON array
  variables TEXT,  -- JSON array
  status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED
  inspectionStatus TEXT,
  approvedAt TEXT,
  rejectedReason TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

---

## 🔧 필요한 API 엔드포인트 (구현 필요)

### 1. 메시지 발송
```typescript
POST /api/messages/send
Authorization: Bearer {token}
Body: {
  messageType: "SMS" | "KAKAO",
  senderNumber: string,
  messageTitle?: string,
  messageContent: string,
  recipients: RecipientMapping[],
  landingPageId?: string,
  scheduledAt?: string
}
Response: {
  success: boolean,
  successCount: number,
  failCount: number,
  totalCost: number
}
```

### 2. 발송 이력 조회
```typescript
GET /api/messages/history
Authorization: Bearer {token}
Response: {
  history: MessageHistory[]
}
```

### 3. 발신번호 관리
```typescript
// 등록 신청
POST /api/sender-numbers/register
Authorization: Bearer {token}
Body: FormData {
  phoneNumber, purpose, verificationDoc, businessCert
}

// 내 발신번호 목록
GET /api/sender-numbers/my
Authorization: Bearer {token}

// 승인된 발신번호 목록
GET /api/sender-numbers/approved
Authorization: Bearer {token}
```

### 4. 엑셀 업로드
```typescript
POST /api/recipients/upload-excel
Authorization: Bearer {token}
Body: FormData { file }
Response: {
  recipients: UploadedRecipient[]
}
```

### 5. 학생별 랜딩페이지 생성
```typescript
POST /api/landing-pages/create-for-students
Authorization: Bearer {token}
Body: {
  landingPageId: string,
  studentIds: string[]
}
Response: {
  mappings: StudentLandingPage[]
}
```

### 6. 템플릿 관리
```typescript
GET /api/message-templates/list
POST /api/message-templates/create
PUT /api/message-templates/:id
DELETE /api/message-templates/:id
```

---

## 🎨 UI/UX 특징

### 메시지 발송 페이지
- **2단 레이아웃**: 좌측(발송 설정) + 우측(발송 요약)
- **실시간 계산**: 수신자 선택 시 포인트 자동 계산
- **포인트 부족 알림**: 빨간색 경고 + 충전 페이지 링크
- **미리보기**: 발송 전 수신자 목록 및 메시지 내용 확인
- **탭 기반 수신자 선택**: 학생/직접입력/엑셀

### 발송 이력 페이지
- **통계 카드**: 4개 주요 지표 (총 발송, 성공률, 포인트, 이번달)
- **필터링 바**: 검색 + 발송 유형 + 상태
- **카드형 목록**: 발송 정보 한눈에 파악
- **상세보기 모달**: 전체 정보 및 수신자별 상태

### 발신번호 등록 페이지
- **단계별 안내**: 발급 방법 상세 설명
- **파일 드래그앤드롭**: 서류 업로드 UI
- **상태 배지**: 승인대기/승인완료/거절
- **거절 사유 표시**: 재신청 가이드

---

## 📊 포인트 시스템

### 포인트 가격표 (VAT 10% 별도)
| 포인트 | 기본 금액 | VAT | 총 금액 |
|--------|-----------|-----|---------|
| 1,000P | 10,000원 | 1,000원 | 11,000원 |
| 5,000P | 50,000원 | 5,000원 | 55,000원 |
| 10,000P | 100,000원 | 10,000원 | 110,000원 |
| 50,000P | 500,000원 | 50,000원 | 550,000원 |
| 100,000P | 1,000,000원 | 100,000원 | 1,100,000원 |

### 발송 비용
- **SMS**: 20포인트/건
- **카카오톡**: 15포인트/건

### 예시 계산
- 학생 100명에게 SMS 발송
  - 비용: 100명 × 20P = 2,000P
  - 실제 금액: 20,000원 + VAT 2,000원 = 22,000원

- 학생 100명에게 카카오톡 발송
  - 비용: 100명 × 15P = 1,500P
  - 실제 금액: 15,000원 + VAT 1,500원 = 16,500원

---

## 🔐 권한 관리

### 페이지별 접근 권한

| 페이지 | SUPER_ADMIN | ADMIN | DIRECTOR | TEACHER | STUDENT |
|--------|-------------|-------|----------|---------|---------|
| 메시지 발송 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 발송 이력 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 발신번호 등록 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 카카오 채널 등록 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 포인트 충전 신청 | ❌ | ❌ | ✅ | ❌ | ❌ |
| 포인트 충전 승인 | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 📁 파일 구조

```
webapp/
├── schema_sms_kakao_system.sql          # DB 스키마
├── src/
│   ├── app/
│   │   └── dashboard/
│   │       ├── message-send/            # 메시지 발송 페이지
│   │       │   └── page.tsx
│   │       ├── message-history/         # 발송 이력 페이지
│   │       │   └── page.tsx
│   │       ├── sender-number-register/  # 발신번호 등록 페이지
│   │       │   └── page.tsx
│   │       ├── point-charge/            # 포인트 충전 신청 (학원장)
│   │       │   └── page.tsx
│   │       └── admin/
│   │           ├── point-approvals/     # 포인트 충전 승인 (관리자)
│   │           │   └── page.tsx
│   │           └── sms/
│   │               └── registration-approval/  # 발신번호 승인 (관리자)
│   │                   └── page.tsx
│   └── components/
│       └── dashboard/
│           └── Sidebar.tsx              # 사이드바 메뉴 (업데이트됨)
└── functions/                            # Cloudflare Workers API (구현 필요)
    └── api/
        ├── messages/
        │   ├── send.ts
        │   └── history.ts
        ├── sender-numbers/
        │   ├── register.ts
        │   ├── my.ts
        │   └── approved.ts
        └── recipients/
            └── upload-excel.ts
```

---

## 🚀 다음 단계 (구현 필요)

### 1. API 엔드포인트 구현 (우선순위: 🔴 높음)
- [ ] `POST /api/messages/send` - 메시지 발송
- [ ] `GET /api/messages/history` - 발송 이력
- [ ] `POST /api/sender-numbers/register` - 발신번호 등록
- [ ] `GET /api/sender-numbers/my` - 내 발신번호
- [ ] `GET /api/sender-numbers/approved` - 승인된 발신번호
- [ ] `POST /api/recipients/upload-excel` - 엑셀 업로드

### 2. Solapi API 연동 (우선순위: 🔴 높음)
- [ ] SMS 발송 API 호출
- [ ] 카카오 알림톡 발송 API 호출
- [ ] 발송 결과 처리
- [ ] 포인트 차감 로직

### 3. 학생별 랜딩페이지 자동 생성 (우선순위: 🔴 높음)
- [ ] 기본 랜딩페이지 복제
- [ ] 학생별 고유 슬러그 생성
- [ ] StudentLandingPage 테이블 저장
- [ ] URL 생성 및 메시지 삽입

### 4. 엑셀 업로드 처리 (우선순위: 🟡 중간)
- [ ] 엑셀 파일 파싱
- [ ] 데이터 검증 (전화번호 형식, 필수 필드)
- [ ] UploadedRecipient 테이블 저장
- [ ] 유효성 검증 메시지

### 5. 템플릿 관리 (우선순위: 🟡 중간)
- [ ] 템플릿 CRUD API
- [ ] 템플릿 목록 페이지
- [ ] 템플릿 변수 치환 로직

### 6. 관리자 승인 페이지 (우선순위: 🟡 중간)
- [ ] 발신번호 승인/거절 API
- [ ] 포인트 충전 승인/거절 API
- [ ] 첨부 파일 다운로드 API

### 7. 테스트 & 배포 (우선순위: 🔴 높음)
- [ ] 로컬 테스트
- [ ] Cloudflare Pages 배포
- [ ] 프로덕션 DB 마이그레이션
- [ ] 실제 Solapi API 키 설정

---

## 📝 사용 시나리오

### 시나리오 1: 학원장이 학부모에게 성적표 발송

1. **포인트 충전**
   - `/dashboard/point-charge` 접속
   - 10,000P 충전 신청 (110,000원)
   - 관리자 승인 대기

2. **발신번호 등록**
   - `/dashboard/sender-number-register` 접속
   - 학원 대표 번호 등록 (010-1234-5678)
   - 통신서비스이용증명원 업로드
   - 관리자 승인 대기

3. **성적표 랜딩페이지 생성**
   - `/dashboard/admin/landing-pages` 접속
   - "2024년 1학기 성적표" 랜딩페이지 생성
   - 학생 데이터 연동

4. **메시지 발송**
   - `/dashboard/message-send` 접속
   - 발송 유형: SMS 선택
   - 수신자: 학생 선택 탭에서 전체 학생 선택 (100명)
   - 랜딩페이지 연결: "2024년 1학기 성적표" 선택
   - 메시지 작성:
     ```
     [슈퍼플레이스 학원]
     {{학생명}} 학생의 1학기 성적표가 발행되었습니다.
     아래 링크에서 확인하세요.
     {{URL}}
     ```
   - 미리보기 확인
   - 발송 (2,000P 차감)

5. **발송 결과 확인**
   - `/dashboard/message-history` 접속
   - 발송 이력에서 성공/실패 확인
   - 개별 학생 발송 상태 확인

### 시나리오 2: 관리자가 포인트 충전 승인

1. **포인트 충전 승인**
   - `/dashboard/admin/point-approvals` 접속
   - 학원장의 충전 신청 확인
   - 입금 증빙 파일 다운로드
   - 승인 버튼 클릭
   - 학원장 계정에 10,000P 지급

2. **발신번호 승인**
   - `/dashboard/admin/sms/registration-approval` 접속
   - 학원장의 발신번호 등록 신청 확인
   - 통신서비스이용증명원 확인
   - 승인 버튼 클릭

---

## 🎓 주요 학습 포인트

### 1. 학생-학부모 매핑
- 학생 테이블에 `parentPhone` 필드 필수
- 수신자 목록 생성 시 학생 → 학부모 전화번호 매핑

### 2. 학생별 고유 랜딩페이지
- 기본 랜딩페이지를 베이스로 학생별 복제
- 슬러그에 학생 ID 포함 (`report-student001`)
- StudentLandingPage 테이블로 관계 관리

### 3. 포인트 차감 시스템
- 발송 전 포인트 잔액 확인
- 발송 완료 후 트랜잭션으로 포인트 차감
- MessageSendHistory에 차감 내역 기록

### 4. 실시간 UI 업데이트
- React state로 수신자 선택 관리
- `useEffect`로 필터 적용 시 목록 업데이트
- 포인트 계산 함수 실시간 호출

---

## 🔗 주요 링크

- **메시지 발송**: https://superplacestudy.pages.dev/dashboard/message-send
- **발송 이력**: https://superplacestudy.pages.dev/dashboard/message-history
- **발신번호 등록**: https://superplacestudy.pages.dev/dashboard/sender-number-register
- **카카오 채널 등록**: https://superplacestudy.pages.dev/dashboard/kakao-channel
- **포인트 충전 (학원장)**: https://superplacestudy.pages.dev/dashboard/point-charge
- **포인트 승인 (관리자)**: https://superplacestudy.pages.dev/dashboard/admin/point-approvals
- **GitHub**: https://github.com/kohsunwoo12345-cmyk/superplace

---

## ✅ 체크리스트

### 프론트엔드 (완료)
- [x] 메시지 발송 페이지 UI
- [x] 발송 이력 페이지 UI
- [x] 발신번호 등록 페이지 UI
- [x] 사이드바 메뉴 업데이트
- [x] 학생-학부모 매핑 UI
- [x] 랜딩페이지 연결 UI
- [x] 포인트 계산 로직
- [x] 미리보기 기능

### 데이터베이스 (완료)
- [x] SenderNumber 테이블
- [x] MessageSendHistory 테이블
- [x] MessageTemplate 테이블
- [x] StudentLandingPage 테이블
- [x] UploadedRecipient 테이블
- [x] KakaoAlimtalkTemplate 테이블

### 백엔드 API (미완료)
- [ ] 메시지 발송 API
- [ ] 발송 이력 조회 API
- [ ] 발신번호 관리 API
- [ ] 엑셀 업로드 API
- [ ] 학생별 랜딩페이지 생성 API
- [ ] 템플릿 관리 API

### Solapi 연동 (미완료)
- [ ] SMS 발송 API 호출
- [ ] 카카오 알림톡 발송 API 호출
- [ ] 발송 결과 처리
- [ ] 포인트 차감 트랜잭션

### 배포 (미완료)
- [ ] Cloudflare Pages 배포
- [ ] DB 마이그레이션
- [ ] 환경 변수 설정 (Solapi API 키)
- [ ] 프로덕션 테스트

---

## 🎯 최종 결과

### ✅ 완성된 부분
- 📱 메시지 발송 페이지 (학생-학부모 매핑, 랜딩페이지 연동)
- 📊 발송 이력 페이지 (통계, 필터링, 상세보기)
- 📞 발신번호 등록 페이지 (서류 업로드, 승인 관리)
- 🎨 사이드바 메뉴 (메시지 발송, 포인트, 카카오 채널)
- 🗄️ DB 스키마 (6개 테이블)

### 🚧 미완성 부분
- 🔌 API 엔드포인트 (메시지 발송, 이력 조회, 발신번호 관리 등)
- 📡 Solapi API 연동 (SMS/카카오 발송)
- 🔗 학생별 랜딩페이지 자동 생성 로직
- 📄 엑셀 업로드 처리
- 💰 포인트 차감 트랜잭션

### 🎯 핵심 가치
1. **학생별 개인화**: 각 학생마다 고유한 랜딩페이지 URL 제공
2. **완벽한 매핑**: 학생 → 학부모 전화번호 자동 매핑
3. **투명한 포인트 시스템**: 실시간 잔액 확인 및 차감 내역
4. **관리자 승인 워크플로우**: 발신번호 및 포인트 충전 승인
5. **통계 기반 의사결정**: 발송 이력 분석 및 성공률 추적

---

**문서 작성**: 2026-02-21  
**버전**: v1.0.0  
**커밋**: e7f57d7
