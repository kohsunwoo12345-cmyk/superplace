# 🚨 긴급 수정: 학생 봇 노출 문제 해결 (2026-03-17)

## 심각한 보안 문제
**학생이 학원의 모든 구독 봇에 접근할 수 있었던 문제!**

## 원인
`/api/user/ai-bots` API가 **userId와 관계없이** 학원 전체 봇을 먼저 조회했음:

```javascript
❌ 이전 코드 (잘못됨):
// 1️⃣ 학원 전체 봇 먼저 조회 (모든 요청에 대해!)
const academyBots = await db.prepare(`
  SELECT productId as botId FROM AcademyBotSubscription
  WHERE academyId = ?
`).bind(academyId).all();

// 2️⃣ userId가 있으면 개별 할당 봇 추가
if (userId) {
  const userBots = await db.prepare(`
    SELECT botId FROM ai_bot_assignments WHERE userId = ?
  `).bind(userId).all();
}

// 결과: 학원 전체 봇 + 개별 할당 봇 = 모든 봇이 학생에게 노출!
```

## 해결 방법
**userId 유무에 따라 완전히 다른 로직 실행:**

```javascript
✅ 수정된 코드:
if (userId) {
  // 🎓 학생 모드: 개별 할당 봇만 조회
  console.log(`🎓 학생 모드: userId=${userId} - 개별 할당 봇만 조회`);
  const userBots = await db.prepare(`
    SELECT botId FROM ai_bot_assignments 
    WHERE userId = ? AND status = 'ACTIVE'
  `).bind(userId).all();
  // 학원 전체 봇 조회 안 함!
  
} else {
  // 👔 학원장/선생님 모드: 학원 전체 봇 조회
  console.log(`👔 학원장/선생님 모드: 학원 전체 봇 조회`);
  const academyBots = await db.prepare(`
    SELECT productId as botId FROM AcademyBotSubscription
    WHERE academyId = ?
  `).bind(academyId).all();
}
```

## 로직 변경 전/후 비교

| 구분 | 이전 (잘못됨) | 수정 후 (정상) |
|------|--------------|---------------|
| **학생 요청** | 학원 전체 봇 + 개별 할당 봇 | 개별 할당 봇만 |
| **학원장 요청** | 학원 전체 봇 + 개별 할당 봇 | 학원 전체 봇만 |
| **보안 문제** | ❌ 학생이 모든 봇 접근 | ✅ 학생은 할당된 봇만 |

## 배포 정보
- **커밋**: `ae0b97fd`
- **우선순위**: 🚨 **CRITICAL** (보안 문제)
- **배포 시간**: 2026-03-17
- **적용 예상**: 3-5분 후

## 테스트 절차 (배포 3-5분 후)

### 1️⃣ 학생 계정 테스트
```bash
계정: student_1773655529913@temp.superplace.local
학원: 꾸메땅학원 (academy-1771479246368-5viyubmqk)
```

1. 학생 계정으로 로그인
2. `https://suplacestudy.com/ai-chat/` 접속
3. **하드 리프레시 필수**: `Ctrl+Shift+R` (Windows) / `Cmd+Shift+R` (Mac)
4. F12 콘솔 확인:

```
✅ 예상 로그:
🔍 사용자 봇 조회 - academyId: academy-xxx, userId: student-xxx
🎓 학생 모드: userId=student-xxx - 개별 할당 봇만 조회
✅ 개별 학생 할당 봇: 1개 (또는 실제 할당된 개수)

❌ 나오면 안 되는 로그:
✅ 학원 전체 할당 봇: 4개  ← 이게 나오면 안 됨!
```

5. **봇 목록 확인**:
   - ✅ 학원장이 개별 할당한 봇만 보임
   - ✅ 할당되지 않은 학원 구독 봇은 숨겨짐

### 2️⃣ 학원장 계정 테스트
1. 학원장 계정으로 로그인
2. `https://suplacestudy.com/ai-chat/` 접속
3. F12 콘솔 확인:

```
✅ 예상 로그:
🔍 사용자 봇 조회 - academyId: academy-xxx, userId: undefined
👔 학원장/선생님 모드: 학원 전체 봇 조회
✅ 학원 전체 할당 봇: 4개
```

4. **봇 목록 확인**:
   - ✅ 학원에 구독된 모든 봇 표시

## API 엔드포인트 동작

### `/api/user/ai-bots?academyId=xxx&userId=yyy` (학생)
```sql
-- userId가 있으면 이 쿼리만 실행:
SELECT botId FROM ai_bot_assignments 
WHERE userId = 'student-xxx' 
  AND status = 'ACTIVE'
  AND date(endDate) >= date('now')

-- 학원 전체 봇 쿼리는 실행 안 함!
```

### `/api/user/ai-bots?academyId=xxx` (학원장)
```sql
-- userId가 없으면 학원 전체 봇 조회:
SELECT productId as botId FROM AcademyBotSubscription
WHERE academyId = 'academy-xxx'
  AND isActive = 1
  AND date(subscriptionEnd) >= date('now')
```

## 영향 범위
- ✅ 학생: 개별 할당 봇만 표시 (보안 강화)
- ✅ 학원장/선생님: 학원 구독 봇 전체 표시 (기존 기능 유지)
- ✅ 관리자: 모든 봇 표시 (변경 없음)

## 수정된 파일
- `functions/api/user/ai-bots.js`: userId 기반 조건부 쿼리로 완전 변경

## 핵심 요약
| 항목 | 내용 |
|------|------|
| **문제** | 학생이 학원 전체 구독 봇에 접근 가능 |
| **원인** | API가 모든 요청에 대해 학원 전체 봇 먼저 조회 |
| **해결** | userId 있으면 개별 할당 봇만 조회하도록 로직 분리 |
| **결과** | 학생은 할당된 봇만, 학원장은 구독 봇 전체 접근 |

---
**🚨 긴급 배포 완료 - 3-5분 후 테스트 필수!**
