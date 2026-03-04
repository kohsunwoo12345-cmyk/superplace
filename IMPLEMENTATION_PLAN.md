# AI 봇 구독 만료 시 자동 비활성화 구현 계획

## 📋 요구사항

### 1. 학원 구독 만료 시 자동 비활성화
- 학원장이 받은 구독 기간이 끝나면 → 할당된 모든 학생의 봇 사용 자동 중지
- 학생에게 할당한 기간이 남아있어도 무시

### 2. 재구매/재할당 시 자동 복구
- 같은 봇을 재구매/재할당 받으면 → 기존 학생들 자동으로 다시 사용 가능

### 3. 학생 수 제한 (우선순위)
- 기존: 20명 할당
- 재구매: 18명으로 재구매
- 결과: 20명 중 18명만 사용 가능
- 우선순위: 할당일 기준 오래된 순 (first-come, first-served)

## 🔍 현재 구조 분석

### AcademyBotSubscription 테이블
```sql
- id
- academyId
- productId (botId)
- productName
- totalStudentSlots (총 학생 수)
- usedStudentSlots (사용 중인 슬롯)
- remainingStudentSlots (남은 슬롯)
- subscriptionStart
- subscriptionEnd (만료일)
- isActive
```

### ai_bot_assignments 테이블
```sql
- id
- botId
- userId
- startDate
- endDate (학생 할당 기간)
- status ('active' | 'expired')
- userAcademyId
```

## ✅ 구현 방안

### 1. 봇 조회 API 수정 (/api/user/academy-bots)
현재: 학원 구독만 체크
개선: 학원 구독 + 학생 할당 상태 + 우선순위 체크

### 2. 봇 사용 권한 체크 로직
```javascript
function canStudentUseBot(studentAssignment, academySubscription) {
  // 1. 학원 구독 만료 체크
  if (academySubscription.subscriptionEnd < now) {
    return false;
  }
  
  // 2. 학생 할당 개수 체크 (우선순위)
  const activeAssignments = getActiveAssignments(academyId, botId);
  const sortedByDate = activeAssignments.sort((a, b) => a.startDate - b.startDate);
  const allowedCount = academySubscription.totalStudentSlots;
  
  // 3. 상위 N명만 허용
  const studentRank = sortedByDate.findIndex(a => a.userId === studentId) + 1;
  return studentRank <= allowedCount;
}
```

### 3. 새로운 API: /api/user/bot-access-check
학생이 특정 봇을 사용할 수 있는지 체크

입력:
- userId
- botId
- academyId

출력:
```json
{
  "hasAccess": true,
  "reason": "active",
  "subscription": {
    "endDate": "2026-12-31",
    "totalSlots": 20,
    "usedSlots": 18,
    "studentRank": 5
  }
}
```

### 4. AI 챗 페이지 수정
- 봇 선택 시 접근 권한 체크
- 대화 전송 전 권한 재확인
- 만료 시 안내 메시지 표시

## 📝 구현 순서

1. ✅ ai_bot_assignments 테이블에 `priority` 필드 추가 (자동 계산)
2. ✅ /api/user/bot-access-check API 생성
3. ✅ /api/user/academy-bots API에 접근 권한 정보 추가
4. ✅ AI 챗 API에서 권한 체크 로직 추가
5. ✅ 프론트엔드에서 권한 체크 UI 개선

## 🧪 테스트 시나리오

### 시나리오 1: 학원 구독 만료
1. 학원장이 20명 구독 (2026-03-01 ~ 2026-03-31)
2. 20명 학생에게 할당 (각각 2026-03-01 ~ 2026-06-30)
3. 2026-04-01: 학원 구독 만료 → 20명 모두 사용 불가
4. 재구매: 2026-04-01 ~ 2026-06-30 (20명) → 20명 자동 복구

### 시나리오 2: 학생 수 감소
1. 학원장이 20명 구독
2. 20명 학생에게 할당
3. 재구매: 18명 구독
4. 결과: 할당일 기준 18명만 사용 가능, 나머지 2명 대기

### 시나리오 3: 학생 수 증가
1. 학원장이 18명 구독
2. 18명 학생에게 할당
3. 재구매: 20명 구독
4. 결과: 기존 18명 + 신규 2명 할당 가능
