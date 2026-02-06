# 🤔 마이그레이션(Migration)이란 무엇인가요?

## 📚 쉬운 설명

**마이그레이션**은 데이터베이스에 **새로운 테이블을 만들거나 기존 테이블을 수정하는 작업**입니다.

### 🏠 집에 비유하자면:
- 집(데이터베이스)에 새로운 방(테이블)을 추가하는 것
- 방에 새로운 가구(컬럼)를 놓는 것
- 방 구조를 바꾸는 것

---

## 💡 왜 필요한가요?

### 예시 상황:
1. **처음 프로젝트 시작**: 학생 테이블, 출석 테이블이 이미 있음 ✅
2. **새로운 기능 추가**: 알림 시스템을 만들었음 🆕
3. **문제 발생**: 알림 정보를 저장할 테이블이 없음 ❌

→ **해결책**: 알림 테이블을 만들어야 함! (이게 마이그레이션)

---

## 🔧 우리가 만든 마이그레이션

### 파일 위치
```
migrations/notifications_tables.sql
```

### 이 파일이 하는 일
```sql
-- 1️⃣ 알림 정보 저장 테이블 생성
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,      -- 알림 제목
  message TEXT NOT NULL,    -- 알림 메시지
  type TEXT NOT NULL,       -- 알림 유형 (info/success/warning/error)
  ...
);

-- 2️⃣ 누가 알림을 받았는지 저장하는 테이블 생성
CREATE TABLE notification_recipients (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,  -- 학생 ID
  userName TEXT,            -- 학생 이름
  ...
);
```

---

## 🚀 실행 방법 (2가지)

### 방법 1: Cloudflare 대시보드 (더 쉬움! 추천!)

#### 1단계: Cloudflare 로그인
https://dash.cloudflare.com/ 접속

#### 2단계: D1 데이터베이스 찾기
1. 왼쪽 메뉴에서 "Workers & Pages" 클릭
2. 상단 메뉴에서 "D1" 클릭
3. "superplace-db" 데이터베이스 클릭

#### 3단계: SQL 실행
1. "Console" 탭 클릭
2. 아래 SQL 코드를 복사해서 붙여넣기:

```sql
-- 알림 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  filterType TEXT NOT NULL DEFAULT 'all',
  recipientCount INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent'
);

-- 알림 수신자 테이블 생성
CREATE TABLE IF NOT EXISTS notification_recipients (
  id TEXT PRIMARY KEY,
  notificationId TEXT NOT NULL,
  userId INTEGER NOT NULL,
  userName TEXT,
  userEmail TEXT,
  academyId INTEGER,
  sentAt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  readAt TEXT,
  FOREIGN KEY (notificationId) REFERENCES notifications(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성 (검색 속도 향상)
CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON notifications(createdAt DESC);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_userId ON notification_recipients(userId);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_notificationId ON notification_recipients(notificationId);
CREATE INDEX IF NOT EXISTS idx_notification_recipients_academyId ON notification_recipients(academyId);
```

3. "Execute" 버튼 클릭
4. "Success" 메시지 확인!

---

### 방법 2: 명령어 (개발자용)

터미널에서 실행:
```bash
npx wrangler d1 execute superplace-db --remote --file=./migrations/notifications_tables.sql
```

⚠️ **주의**: Cloudflare API 토큰이 필요함

---

## ✅ 실행 완료 확인 방법

### Cloudflare 대시보드에서 확인:
1. D1 데이터베이스 "superplace-db" 접속
2. "Tables" 탭 클릭
3. 다음 테이블이 보이면 성공:
   - ✅ `notifications`
   - ✅ `notification_recipients`

### SQL로 확인:
Console 탭에서 실행:
```sql
SELECT name FROM sqlite_master WHERE type='table';
```

결과에 `notifications`와 `notification_recipients`가 나오면 성공!

---

## 🔍 마이그레이션 안 하면 어떻게 되나요?

### 알림 전송 시도 시:
```
❌ Error: table notifications does not exist
❌ 알림을 저장할 수 없습니다!
```

### 해결:
✅ 마이그레이션 실행 → 테이블 생성 → 알림 시스템 정상 작동!

---

## 📊 마이그레이션 전/후 비교

### Before (마이그레이션 전)
```
데이터베이스 테이블:
- users
- academies
- attendance_codes
- homework_submissions
(알림 테이블 없음 ❌)
```

### After (마이그레이션 후)
```
데이터베이스 테이블:
- users
- academies
- attendance_codes
- homework_submissions
- notifications ✅ (NEW!)
- notification_recipients ✅ (NEW!)
```

---

## 🎯 요약

| 항목 | 설명 |
|------|------|
| **마이그레이션이란?** | 데이터베이스에 새 테이블 만들기 |
| **왜 필요?** | 알림 정보를 저장할 공간이 필요해서 |
| **언제 해야 하나?** | 지금 당장! (알림 시스템 사용 전에) |
| **어떻게?** | Cloudflare 대시보드에서 SQL 실행 |
| **안 하면?** | 알림 기능이 작동하지 않음 |

---

## 🎓 더 자세히 알고 싶다면

### 마이그레이션의 이점:
1. **버전 관리**: 데이터베이스 변경사항 추적
2. **안전성**: 실수 방지 (테이블이 이미 있으면 건너뜀)
3. **협업**: 팀원들과 DB 구조 공유
4. **롤백**: 문제 시 이전 상태로 복구 가능

### 실무에서:
- 새 기능 추가 → 마이그레이션 파일 작성 → 실행
- 팀원 A가 새 테이블 추가 → 팀원 B도 같은 마이그레이션 실행
- 프로덕션 배포 시 자동으로 마이그레이션 실행

---

## 💬 Q&A

**Q: 마이그레이션 실행하면 기존 데이터가 사라지나요?**  
A: ❌ 아니요! 새 테이블만 추가됩니다. 기존 데이터는 그대로 유지됩니다.

**Q: 여러 번 실행하면 어떻게 되나요?**  
A: ✅ 괜찮습니다! `IF NOT EXISTS`를 사용해서 이미 있으면 건너뜁니다.

**Q: 실수로 잘못 실행하면?**  
A: 테이블을 삭제하고 다시 실행하면 됩니다:
```sql
DROP TABLE IF EXISTS notification_recipients;
DROP TABLE IF EXISTS notifications;
```
그리고 다시 마이그레이션 실행!

---

## 🚀 다음 단계

1. ✅ 출석 관리 페이지 오류 수정 완료
2. ⏳ 마이그레이션 실행 (위 방법 참고)
3. ✅ 알림 시스템 테스트
4. 🎉 완료!

---

**작성일**: 2026-02-06  
**난이도**: ⭐⭐ (초급~중급)  
**소요 시간**: 5분
