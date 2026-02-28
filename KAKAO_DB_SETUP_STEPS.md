# 카카오 데이터베이스 테이블 생성 - 단계별 SQL

## ⚠️ 중요: 각 SQL을 순서대로 하나씩 실행하세요!

---

## 1단계: KakaoChannel 테이블 생성

```sql
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
```

**실행 후 "Success" 메시지 확인 → 다음 단계로**

---

## 2단계: KakaoChannel 인덱스 생성

```sql
CREATE INDEX IF NOT EXISTS idx_kakao_channel_user ON KakaoChannel(userId);
```

**실행 후 "Success" 확인 → 다음**

---

## 3단계: KakaoChannel 추가 인덱스

```sql
CREATE INDEX IF NOT EXISTS idx_kakao_channel_search ON KakaoChannel(searchId);
```

**실행 후 "Success" 확인 → 다음**

---

## 4단계: KakaoChannel 상태 인덱스

```sql
CREATE INDEX IF NOT EXISTS idx_kakao_channel_status ON KakaoChannel(status);
```

**실행 후 "Success" 확인 → 다음**

---

## 5단계: AlimtalkTemplate 테이블 생성

```sql
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
```

**실행 후 "Success" 확인 → 다음**

---

## 6단계: AlimtalkTemplate 사용자 인덱스

```sql
CREATE INDEX IF NOT EXISTS idx_alimtalk_user ON AlimtalkTemplate(userId);
```

**실행 후 "Success" 확인 → 다음**

---

## 7단계: AlimtalkTemplate 채널 인덱스

```sql
CREATE INDEX IF NOT EXISTS idx_alimtalk_channel ON AlimtalkTemplate(channelId);
```

**실행 후 "Success" 확인 → 다음**

---

## 8단계: AlimtalkTemplate 상태 인덱스

```sql
CREATE INDEX IF NOT EXISTS idx_alimtalk_status ON AlimtalkTemplate(status);
```

**실행 후 "Success" 확인 → 다음**

---

## 9단계: AlimtalkTemplate 코드 인덱스

```sql
CREATE INDEX IF NOT EXISTS idx_alimtalk_code ON AlimtalkTemplate(templateCode);
```

**실행 후 "Success" 확인 → 완료! 🎉**

---

## ✅ 전체 완료 확인

모든 단계가 끝나면 다음 URL로 확인:

```
https://superplacestudy.pages.dev/api/kakao/channels?userId=test123
```

**기대 응답**:
```json
{
  "success": true,
  "channels": []
}
```

---

## 📝 실행 위치

1. https://dash.cloudflare.com 접속
2. **Workers & Pages** → **D1** 
3. 데이터베이스: **webapp-production**
4. **Console** 탭
5. 위의 SQL을 **1단계부터 순서대로** 하나씩 복사해서 실행
6. 각 실행마다 "Success" 메시지 확인

---

## ⏱️ 총 소요 시간: 약 3-5분

각 SQL은 1초 이내에 완료됩니다!
