# 🚀 학원 전체 일일 사용 한도 - 빠른 참조 카드

## ✅ 구현 완료 (2026-03-10)

### 📦 커밋 정보
- **Feature**: `3bd5f53f` - feat: academy-wide daily usage limit per student
- **Test**: `920465f2` - docs: add academy-wide daily limit test script  
- **Summary**: `5da51c4f` - docs: add comprehensive implementation summary
- **배포**: https://superplacestudy.pages.dev (자동 배포 완료)

---

## 🎯 핵심 개념

**각 개별 사용자가 독립적으로 일일 한도를 가집니다**

```
학원: 50명, 일일 한도: 15회
→ 학생 A: 하루 15회
→ 학생 B: 하루 15회
→ 학생 C: 하루 15회
→ ...
→ 학원장: 하루 15회
```

❌ **아닙니다**: 학원 전체가 총 750회(50×15) 공유  
✅ **맞습니다**: 각자 독립적으로 15회씩

---

## 🔧 필수 DB 마이그레이션

### 실행 명령
```bash
wrangler d1 execute webapp-production --file=STEP5_ADD_ACADEMY_DAILY_LIMIT.sql
```

### 또는 D1 Console에서
```sql
ALTER TABLE AcademyBotSubscription ADD COLUMN dailyUsageLimit INTEGER DEFAULT 15;
UPDATE AcademyBotSubscription SET dailyUsageLimit = 15 WHERE dailyUsageLimit IS NULL;
```

### 확인
```sql
PRAGMA table_info(AcademyBotSubscription);
-- dailyUsageLimit 컬럼 확인
```

---

## 📊 플로우 다이어그램

```
[관리자]
   ↓
학원 전체 할당 (학생 수: 50, 일일 한도: 15)
   ↓
[AcademyBotSubscription]
   - totalStudentSlots: 50
   - dailyUsageLimit: 15 ✨
   ↓
[학원장]
   ↓
개별 학생 할당 (학생 A, B, C...)
   ↓
[ai_bot_assignments]
   - 학생 A: dailyUsageLimit: 15 (자동 복사) ✨
   - 학생 B: dailyUsageLimit: 15 (자동 복사) ✨
   - 학생 C: dailyUsageLimit: 15 (자동 복사) ✨
   ↓
[학생 A]
   ↓
AI 채팅 메시지 전송
   ↓
[chat API]
   - 오늘 사용량 조회: 14회
   - 한도 체크: 14 < 15 → ✅ 정상 처리
   - 사용 로그 기록
   ↓
15회 전송 후...
   ↓
[chat API]
   - 오늘 사용량 조회: 15회
   - 한도 체크: 15 >= 15 → ❌ 429 에러
```

---

## 🗂️ 변경된 파일

### 코드 (2개)
1. `functions/api/admin/academy-bot-subscriptions.js`
   - ✨ `dailyUsageLimit` 파라미터 추가
   - ✨ INSERT 시 `dailyUsageLimit` 포함

2. `functions/api/admin/ai-bots/assign.ts`
   - ✨ 학원 구독에서 `dailyUsageLimit` 조회
   - ✨ 우선순위: 학원 구독 > 직접 입력 > 기본값 15
   - ✨ 개별 할당에 최종 한도 저장

### SQL (1개)
3. `STEP5_ADD_ACADEMY_DAILY_LIMIT.sql` (신규)
   - AcademyBotSubscription에 컬럼 추가

### 문서 (3개)
4. `ACADEMY_DAILY_LIMIT_TEST_GUIDE.md` (신규)
5. `test-academy-daily-limit.md` (신규)
6. `ACADEMY_DAILY_LIMIT_IMPLEMENTATION_SUMMARY.md` (신규)

---

## 🧪 5분 테스트 (프로덕션)

### 1️⃣ DB 마이그레이션 (1분)
```bash
wrangler d1 execute webapp-production --file=STEP5_ADD_ACADEMY_DAILY_LIMIT.sql
```

### 2️⃣ 학원 할당 (1분)
```
URL: https://superplacestudy.pages.dev/dashboard/admin/ai-bots/assign
→ "학원 전체에 할당" 선택
→ 테스트 학원, 테스트 봇 선택
→ 학생 수: 10, 일일 한도: 3 (테스트용)
→ 기간: 30일
→ 할당
```

### 3️⃣ 학생 할당 (1분)
```
→ "개별 사용자에게 할당" 선택
→ 학생 1 선택
→ 할당
```

### 4️⃣ 메시지 전송 (2분)
```
학생 1로 로그인
→ AI 채팅
→ 메시지 1~3: ✅ 정상
→ 메시지 4: ❌ 429 에러 확인!
```

---

## 📝 검증 SQL (복사해서 사용)

### 학원 구독 확인
```sql
SELECT 
  academyId, productName, 
  totalStudentSlots, dailyUsageLimit,
  subscriptionStart, subscriptionEnd
FROM AcademyBotSubscription
ORDER BY createdAt DESC LIMIT 5;
```

### 개별 할당 확인
```sql
SELECT 
  userId, userName, botName,
  dailyUsageLimit, startDate, endDate
FROM ai_bot_assignments
WHERE status = 'active'
ORDER BY createdAt DESC LIMIT 10;
```

### 오늘 사용량
```sql
SELECT 
  a.userId, a.userName,
  a.dailyUsageLimit,
  COALESCE(SUM(l.messageCount), 0) as usedToday,
  (a.dailyUsageLimit - COALESCE(SUM(l.messageCount), 0)) as remaining
FROM ai_bot_assignments a
LEFT JOIN bot_usage_logs l 
  ON l.assignmentId = a.id 
  AND DATE(l.createdAt) = DATE('now')
WHERE a.status = 'active'
GROUP BY a.userId, a.userName, a.dailyUsageLimit;
```

---

## 🐛 문제 해결 (30초)

### 증상: "no such column: dailyUsageLimit"
```sql
-- 해결: 마이그레이션 실행
ALTER TABLE AcademyBotSubscription ADD COLUMN dailyUsageLimit INTEGER DEFAULT 15;
```

### 증상: 한도가 작동하지 않음
```sql
-- 확인 1: 할당 정보
SELECT dailyUsageLimit FROM ai_bot_assignments WHERE userId = 'USER_ID';

-- 확인 2: 사용 로그
SELECT COUNT(*) FROM bot_usage_logs 
WHERE userId = 'USER_ID' AND DATE(createdAt) = DATE('now');
```

### 증상: 429 에러가 발생하지 않음
```
→ Cloudflare Pages → Functions → Logs
→ "한도 체크" 로그 검색
→ 에러 메시지 확인
```

---

## 📞 지원

### 로그 확인
```
Cloudflare Dashboard
→ Pages
→ superplacestudy
→ Functions
→ Logs
→ 검색: "Daily limit", "한도"
```

### 관련 문서
- `ACADEMY_DAILY_LIMIT_IMPLEMENTATION_SUMMARY.md` - 전체 개요
- `ACADEMY_DAILY_LIMIT_TEST_GUIDE.md` - 상세 테스트 가이드
- `test-academy-daily-limit.md` - 실습 테스트 스크립트

---

## ✅ 체크리스트

### 배포 전
- [ ] DB 마이그레이션 실행
- [ ] 코드 변경사항 확인 (자동 배포됨)
- [ ] Cloudflare Pages 빌드 성공 확인

### 테스트
- [ ] 학원 할당 시 `dailyUsageLimit` 저장
- [ ] 개별 할당 시 자동 복사
- [ ] 학생이 한도만큼 사용 가능
- [ ] 한도 초과 시 429 에러
- [ ] 다른 학생은 독립적인 한도
- [ ] 학원장도 동일 한도 적용

### 프로덕션
- [ ] 실제 데이터로 테스트
- [ ] 로그 모니터링
- [ ] 사용자 피드백 수집

---

## 🎉 완료!

**학원 전체 일일 사용 한도 기능 구현 완료**

- ✅ 각 학생 독립적 한도
- ✅ 학원장 동일 적용
- ✅ 자동 복사 로직
- ✅ 429 에러 처리
- ✅ 포괄적 문서

**배포 URL**: https://superplacestudy.pages.dev

---

**Version**: 1.0  
**Date**: 2026-03-10  
**Commits**: `3bd5f53f`, `920465f2`, `5da51c4f`
