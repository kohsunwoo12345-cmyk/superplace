# 카카오 알림톡 완벽 구현 계획

## 🎯 목표
사용자별 카카오 채널 등록 → 템플릿 관리 → 알림톡 발송까지 100% 완벽 동작

## 📋 작업 순서

### Phase 1: 채널 관리 (현재 완료)
- [x] 카카오 채널 등록 (Solapi v2 API, 11자리 카테고리 코드)
- [ ] 등록된 채널 목록 조회 API
- [ ] 채널 목록 UI 페이지

### Phase 2: 템플릿 관리
- [ ] 템플릿 생성 API
- [ ] 템플릿 목록 조회 API
- [ ] 템플릿 수정 API
- [ ] 템플릿 삭제 API
- [ ] 템플릿 검수 요청 API
- [ ] 템플릿 검수 취소 API
- [ ] 템플릿 관리 UI 페이지

### Phase 3: 알림톡 발송
- [ ] 단일 알림톡 발송 API
- [ ] 대량 알림톡 발송 API
- [ ] 알림톡 발송 UI 페이지
- [ ] 발송 내역 조회 API
- [ ] 발송 내역 UI 페이지

## 🗄️ 데이터베이스 스키마

### KakaoChannel 테이블
```sql
CREATE TABLE IF NOT EXISTS KakaoChannel (
  id TEXT PRIMARY KEY,                    -- UUID
  userId TEXT NOT NULL,                   -- 사용자 ID
  userName TEXT NOT NULL,                 -- 사용자 이름
  phoneNumber TEXT NOT NULL,              -- 담당자 휴대전화
  channelName TEXT NOT NULL,              -- 채널명
  searchId TEXT NOT NULL,                 -- 검색용 ID (@없이)
  categoryCode TEXT NOT NULL,             -- 11자리 카테고리 코드
  mainCategory TEXT,                      -- 대분류 (예: "교육")
  middleCategory TEXT,                    -- 중분류 (예: "학원")
  subCategory TEXT,                       -- 소분류 (예: "오프라인학원")
  businessNumber TEXT,                    -- 사업자번호
  solapiChannelId TEXT,                   -- Solapi pfId
  status TEXT NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE, INACTIVE, SUSPENDED
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

### KakaoAlimtalkTemplate 테이블
```sql
CREATE TABLE IF NOT EXISTS KakaoAlimtalkTemplate (
  id TEXT PRIMARY KEY,                    -- UUID
  userId TEXT NOT NULL,                   -- 사용자 ID
  channelId TEXT NOT NULL,                -- KakaoChannel.id
  solapiChannelId TEXT NOT NULL,          -- Solapi pfId
  solapiTemplateId TEXT,                  -- Solapi 템플릿 ID
  templateCode TEXT NOT NULL UNIQUE,      -- 템플릿 코드
  templateName TEXT NOT NULL,             -- 템플릿 이름
  content TEXT NOT NULL,                  -- 템플릿 내용
  categoryCode TEXT NOT NULL,             -- 카테고리 코드
  messageType TEXT DEFAULT 'BA',          -- BA, EX, AD, MI
  emphasizeType TEXT DEFAULT 'NONE',      -- NONE, TEXT, IMAGE, ITEM_LIST
  buttons TEXT,                           -- JSON array
  quickReplies TEXT,                      -- JSON array
  variables TEXT,                         -- JSON array
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, INSPECTING, APPROVED, REJECTED
  inspectionStatus TEXT,                  -- 카카오 검수 상태
  approvedAt TEXT,                        -- 승인 시각
  rejectedReason TEXT,                    -- 반려 사유
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id),
  FOREIGN KEY (channelId) REFERENCES KakaoChannel(id)
);
```

### MessageSendHistory 테이블 (이미 존재)
```sql
CREATE TABLE IF NOT EXISTS MessageSendHistory (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  messageType TEXT NOT NULL,              -- SMS, KAKAO_ALIMTALK, KAKAO_FRIENDTALK
  senderNumber TEXT NOT NULL,
  channelId TEXT,                         -- KakaoChannel.id (알림톡용)
  templateId TEXT,                        -- KakaoAlimtalkTemplate.id (알림톡용)
  recipientCount INTEGER NOT NULL,
  recipients TEXT NOT NULL,               -- JSON array
  messageTitle TEXT,
  messageContent TEXT NOT NULL,
  pointsUsed INTEGER NOT NULL,
  successCount INTEGER DEFAULT 0,
  failCount INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING',
  sendResults TEXT,                       -- JSON array
  scheduledAt TEXT,
  sentAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id)
);
```

## 🔑 API 엔드포인트

### 1. 채널 관리
- [x] `POST /api/kakao/create-channel` - 채널 등록
- [ ] `GET /api/kakao/channels` - 채널 목록 조회
- [ ] `GET /api/kakao/channels/:id` - 채널 단일 조회
- [ ] `DELETE /api/kakao/channels/:id` - 채널 삭제

### 2. 템플릿 관리
- [ ] `GET /api/kakao/templates/categories` - 템플릿 카테고리 조회
- [ ] `POST /api/kakao/templates` - 템플릿 생성
- [ ] `GET /api/kakao/templates` - 템플릿 목록 조회
- [ ] `GET /api/kakao/templates/:id` - 템플릿 단일 조회
- [ ] `PUT /api/kakao/templates/:id` - 템플릿 수정
- [ ] `DELETE /api/kakao/templates/:id` - 템플릿 삭제
- [ ] `POST /api/kakao/templates/:id/inspection` - 검수 요청
- [ ] `DELETE /api/kakao/templates/:id/inspection` - 검수 취소

### 3. 알림톡 발송
- [ ] `POST /api/kakao/send` - 알림톡 발송 (단일/대량)
- [ ] `GET /api/kakao/send-history` - 발송 내역 조회
- [ ] `GET /api/kakao/send-history/:id` - 발송 내역 상세

## 📱 UI 페이지

### 1. 채널 관리
- [x] `/dashboard/kakao-channel/register` - 채널 등록
- [ ] `/dashboard/kakao-channel` - 채널 목록

### 2. 템플릿 관리
- [ ] `/dashboard/kakao-alimtalk/templates` - 템플릿 목록
- [ ] `/dashboard/kakao-alimtalk/templates/create` - 템플릿 생성
- [ ] `/dashboard/kakao-alimtalk/templates/:id/edit` - 템플릿 수정

### 3. 알림톡 발송
- [ ] `/dashboard/kakao-alimtalk/send` - 알림톡 발송
- [ ] `/dashboard/kakao-alimtalk/history` - 발송 내역

## 🔐 인증 방식

### Cloudflare Workers에서의 사용자 인증
1. **프론트엔드**: Next-Auth session에서 userId 가져오기
2. **API 요청**: Request body에 userId 포함
3. **백엔드**: userId 검증 (선택적으로 JWT 토큰 사용)

```typescript
// 프론트엔드
const session = await getSession();
const userId = session.user.id;

fetch('/api/kakao/templates', {
  method: 'POST',
  body: JSON.stringify({
    userId,
    ...otherData
  })
});

// 백엔드 (Cloudflare Workers)
const { userId, ...data } = await request.json();
// userId 검증 로직 (필요시)
```

## 📦 Solapi SDK vs REST API

### 선택: REST API 직접 호출
- Cloudflare Workers 환경에서 Node.js SDK가 완전히 호환되지 않을 수 있음
- REST API는 더 직접적이고 제어 가능
- 이미 구현된 HMAC-SHA256 인증 사용

## 🚀 구현 우선순위

### 즉시 구현
1. ✅ 채널 등록 완료
2. 🔄 채널 DB 저장 수정 (userId, userName 포함)
3. 🔄 채널 목록 조회 API
4. 🔄 채널 목록 UI

### 다음 구현
5. 템플릿 생성 API
6. 템플릿 목록 조회 API
7. 템플릿 관리 UI
8. 템플릿 검수 요청

### 최종 구현
9. 알림톡 발송 API
10. 알림톡 발송 UI
11. 발송 내역 조회

## 📝 체크리스트

### 채널 관리
- [x] Solapi v2 API 통합
- [x] 11자리 카테고리 코드 사용
- [ ] 사용자별 채널 DB 저장
- [ ] 채널 목록 조회
- [ ] 채널 UI 페이지

### 템플릿 관리
- [ ] 템플릿 CRUD API
- [ ] 카테고리 코드 자동 조회
- [ ] 검수 요청/취소
- [ ] 템플릿 상태 관리
- [ ] 템플릿 UI 페이지

### 알림톡 발송
- [ ] Solapi 발송 API 통합
- [ ] 템플릿 변수 치환
- [ ] 대량 발송 지원
- [ ] 발송 결과 DB 저장
- [ ] 발송 UI 페이지
- [ ] 발송 내역 조회

## 🎯 최종 목표

**"100% 발송 가능"** = 다음 시나리오가 완벽 동작:

1. ✅ 사용자가 카카오 채널 등록
2. → 사용자가 알림톡 템플릿 생성
3. → 템플릿 검수 요청 및 승인 대기
4. → 승인된 템플릿으로 알림톡 발송
5. → 발송 내역 확인
6. → 100% 성공적으로 수신자에게 도착

---

**다음 작업**: 채널 DB 저장 로직 수정 및 채널 목록 조회 API 구현
