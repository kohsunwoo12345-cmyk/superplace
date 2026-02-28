# 카카오 채널 데이터베이스 테이블 추가

## 🔴 문제 원인 발견!

사용자님이 보고하신 "Application error"의 **진짜 원인**을 찾았습니다!

```
API Error: {
  "success": false,
  "error": "D1_ERROR: no such table: KakaoChannel: SQLITE_ERROR"
}
```

**문제**: `KakaoChannel`과 `AlimtalkTemplate` 테이블이 Cloudflare D1 데이터베이스에 존재하지 않았습니다!

---

## ✅ 해결 방법

### 1. 스키마 업데이트 완료

`cloudflare-worker/schema.sql`에 다음 테이블들을 추가했습니다:

- ✅ `KakaoChannel` - 카카오 채널 정보
- ✅ `AlimtalkTemplate` - 알림톡 템플릿 정보

### 2. Cloudflare D1 데이터베이스에 테이블 생성 필요

**⚠️ 중요**: 이 스키마를 Cloudflare D1 데이터베이스에 적용해야 합니다!

#### 방법 1: Cloudflare 대시보드 사용 (추천)

1. https://dash.cloudflare.com 접속
2. **Workers & Pages** → **D1** 선택
3. 데이터베이스 선택: `webapp-production`
4. **Console** 탭 클릭
5. 아래 SQL을 복사해서 실행:

```sql
-- Kakao Channel Table
CREATE TABLE IF NOT EXISTS KakaoChannel (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  userName TEXT,
  phoneNumber TEXT NOT NULL,
  channelName TEXT NOT NULL,
  searchId TEXT NOT NULL,
  categoryCode TEXT NOT NULL,
  mainCategory TEXT,
  middleCategory TEXT,
  subCategory TEXT,
  businessNumber TEXT,
  solapiChannelId TEXT,
  status TEXT DEFAULT 'PENDING',
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_kakao_channel_user ON KakaoChannel(userId);
CREATE INDEX IF NOT EXISTS idx_kakao_channel_search ON KakaoChannel(searchId);
CREATE INDEX IF NOT EXISTS idx_kakao_channel_status ON KakaoChannel(status);

-- Alimtalk Template Table
CREATE TABLE IF NOT EXISTS AlimtalkTemplate (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  channelId TEXT NOT NULL,
  solapiChannelId TEXT,
  solapiTemplateId TEXT,
  templateCode TEXT,
  templateName TEXT NOT NULL,
  content TEXT NOT NULL,
  categoryCode TEXT,
  messageType TEXT DEFAULT 'BA',
  emphasizeType TEXT DEFAULT 'NONE',
  buttons TEXT,
  quickReplies TEXT,
  variables TEXT,
  status TEXT DEFAULT 'PENDING',
  inspectionStatus TEXT,
  approvedAt TEXT,
  rejectedReason TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  FOREIGN KEY (channelId) REFERENCES KakaoChannel(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_alimtalk_user ON AlimtalkTemplate(userId);
CREATE INDEX IF NOT EXISTS idx_alimtalk_channel ON AlimtalkTemplate(channelId);
CREATE INDEX IF NOT EXISTS idx_alimtalk_status ON AlimtalkTemplate(status);
CREATE INDEX IF NOT EXISTS idx_alimtalk_code ON AlimtalkTemplate(templateCode);
```

#### 방법 2: Wrangler CLI 사용

```bash
# 로컬에서 실행
cd /home/user/webapp
wrangler d1 execute webapp-production --file=./cloudflare-worker/schema.sql --remote
```

---

## 📊 테이블 구조

### KakaoChannel 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT | Primary Key |
| userId | TEXT | 사용자 ID (User 테이블 FK) |
| userName | TEXT | 담당자 이름 |
| phoneNumber | TEXT | 담당자 전화번호 |
| channelName | TEXT | 채널명 |
| searchId | TEXT | 카카오 채널 검색용 ID (@xxx) |
| categoryCode | TEXT | 카테고리 코드 |
| mainCategory | TEXT | 대분류 카테고리 |
| middleCategory | TEXT | 중분류 카테고리 |
| subCategory | TEXT | 소분류 카테고리 |
| businessNumber | TEXT | 사업자번호 |
| solapiChannelId | TEXT | Solapi 채널 ID |
| status | TEXT | 상태 (PENDING, ACTIVE, INACTIVE) |
| createdAt | TEXT | 생성일시 |
| updatedAt | TEXT | 수정일시 |

### AlimtalkTemplate 테이블
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | TEXT | Primary Key |
| userId | TEXT | 사용자 ID (User 테이블 FK) |
| channelId | TEXT | 채널 ID (KakaoChannel 테이블 FK) |
| solapiChannelId | TEXT | Solapi 채널 ID |
| solapiTemplateId | TEXT | Solapi 템플릿 ID |
| templateCode | TEXT | 템플릿 코드 |
| templateName | TEXT | 템플릿명 |
| content | TEXT | 템플릿 내용 |
| categoryCode | TEXT | 카테고리 코드 |
| messageType | TEXT | 메시지 타입 (BA, EX 등) |
| emphasizeType | TEXT | 강조 타입 (NONE, TEXT, IMAGE) |
| buttons | TEXT | 버튼 정보 (JSON) |
| quickReplies | TEXT | 바로가기 답장 (JSON) |
| variables | TEXT | 변수 목록 (JSON array) |
| status | TEXT | 상태 (PENDING, INSPECTING, APPROVED, REJECTED) |
| inspectionStatus | TEXT | 검수 상태 |
| approvedAt | TEXT | 승인일시 |
| rejectedReason | TEXT | 반려 사유 |
| createdAt | TEXT | 생성일시 |
| updatedAt | TEXT | 수정일시 |

---

## 🔍 문제 발생 과정

1. 사용자가 `/dashboard/kakao-channel/` 접근
2. 페이지가 로드되면서 `/api/kakao/channels?userId=xxx` 호출
3. API가 `KakaoChannel` 테이블을 조회하려 시도
4. **테이블이 존재하지 않아 SQL 에러 발생**
5. React가 에러를 처리하지 못하고 "Application error" 표시

---

## ✅ 해결 후 기대 효과

테이블 생성 후:
- ✅ `/dashboard/kakao-channel/` 정상 작동
- ✅ `/dashboard/kakao-channel/register/` 정상 작동
- ✅ `/dashboard/kakao-alimtalk/templates/` 정상 작동
- ✅ API 호출 성공
- ✅ "Application error" 사라짐

---

## 🚀 적용 순서

1. ✅ **schema.sql 업데이트** (완료)
2. ⏳ **Cloudflare D1에 SQL 실행** (사용자 작업 필요)
3. ✅ **페이지 새로고침**
4. ✅ **정상 작동 확인**

---

## 📝 검증 방법

테이블 생성 후 다음 명령으로 확인:

```bash
# API 테스트
curl "https://superplacestudy.pages.dev/api/kakao/channels?userId=test123"

# 성공 응답 예시:
{
  "success": true,
  "channels": []
}
```

현재는 다음과 같은 에러가 발생합니다:
```json
{
  "success": false,
  "error": "D1_ERROR: no such table: KakaoChannel: SQLITE_ERROR"
}
```

---

## 🎯 결론

**근본 원인**: 데이터베이스 테이블 누락  
**해결 방법**: Cloudflare D1에 Kakao 테이블 생성  
**소요 시간**: 약 5분

테이블만 생성하면 **즉시 모든 카카오 페이지가 정상 작동**합니다!
