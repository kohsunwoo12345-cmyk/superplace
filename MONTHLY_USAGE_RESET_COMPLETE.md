# ✅ 월별 사용량 자동 초기화 구현 완료

## 🔄 구현된 기능

### 1. 월별 사용량 자동 초기화

**매달 1일 00:00:00에 자동으로 초기화되는 항목:**
- ✅ 숙제 검사 횟수
- ✅ AI 분석 횟수
- ✅ 유사문제 출제 횟수
- ✅ 랜딩페이지 생성 수

**초기화되지 않는 항목:**
- ❌ 학생 수 (누적, 퇴원 학생 제외)

### 2. 구독 기간 관리

#### 12개월 플랜
```
2024-01-01 구독 시작
↓
2024-02-01 → 사용량 초기화 (1개월차)
2024-03-01 → 사용량 초기화 (2개월차)
...
2024-12-01 → 사용량 초기화 (12개월차)
2025-01-01 → 구독 만료
```

#### 1개월 플랜
```
2024-01-15 구독 시작
↓
2024-02-01 → 사용량 초기화
2024-02-15 → 구독 만료
             → "구독이 만료되었습니다" 표시
             → /pricing 페이지로 안내
```

## 📊 사용량 카운트 방식

### Before (문제)
```sql
-- ❌ 전체 기간의 데이터 카운트
SELECT COUNT(*) FROM homework_gradings WHERE academyId = ?
-- → 2023년부터 현재까지 모든 데이터 합산
```

### After (해결)
```sql
-- ✅ 이번 달 데이터만 카운트
SELECT COUNT(*) FROM homework_gradings 
WHERE academyId = ? 
  AND createdAt >= '2024-03-01T00:00:00.000Z'
-- → 이번 달 1일부터 현재까지만 카운트
```

## 🗓️ 날짜 계산 로직

```typescript
// 이번 달 시작일 계산 (UTC 기준)
const thisMonthStart = new Date();
thisMonthStart.setUTCDate(1);           // 1일로 설정
thisMonthStart.setUTCHours(0, 0, 0, 0); // 00:00:00으로 설정
const thisMonthStartISO = thisMonthStart.toISOString();

// 예시:
// 현재: 2024-03-15 14:30:00
// 결과: 2024-03-01T00:00:00.000Z
```

## 📈 항목별 카운트 쿼리

### 1. 학생 수 (월별 초기화 ❌)
```sql
SELECT COUNT(*) as count 
FROM User 
WHERE academyId = ? 
  AND role = 'STUDENT' 
  AND withdrawnAt IS NULL
```
- 전체 기간의 활성 학생 수
- 퇴원 학생은 제외

### 2. 숙제 검사 (월별 초기화 ✅)
```sql
SELECT COUNT(*) as count 
FROM homework_gradings hg
JOIN User u ON hg.studentId = u.id
WHERE u.academyId = ?
  AND hg.createdAt >= ?  -- 이번 달 시작일
```

### 3. AI 분석 (월별 초기화 ✅)
```sql
SELECT COUNT(*) as count 
FROM usage_logs ul
JOIN User u ON ul.userId = u.id
WHERE u.academyId = ? 
  AND ul.type = 'ai_analysis'
  AND ul.createdAt >= ?  -- 이번 달 시작일
```

### 4. 유사문제 (월별 초기화 ✅)
```sql
SELECT COUNT(*) as count 
FROM usage_logs ul
JOIN User u ON ul.userId = u.id
WHERE u.academyId = ? 
  AND ul.type = 'similar_problem'
  AND ul.createdAt >= ?  -- 이번 달 시작일
```

### 5. 랜딩페이지 (월별 초기화 ✅)
```sql
SELECT COUNT(*) as count 
FROM landing_pages
WHERE academyId = ?
  AND createdAt >= ?  -- 이번 달 시작일
```

## 🔒 구독 만료 처리

```typescript
// 만료 확인
const now = new Date();
const endDate = new Date(subscription.endDate);

if (now > endDate) {
  // 구독 만료 처리
  await DB.prepare(`
    UPDATE user_subscriptions 
    SET status = 'expired', updatedAt = datetime('now')
    WHERE id = ?
  `).bind(subscription.id).run();

  return {
    success: false,
    hasSubscription: false,
    expired: true,
    message: "구독이 만료되었습니다. 요금제를 갱신해주세요.",
    redirectTo: "/pricing"
  };
}
```

## 📋 사용 예시

### 시나리오 1: 12개월 플랜 사용자
```
✅ 2024-03-01: 숙제 검사 0건, AI 분석 0건
   (전월 사용량 초기화)

📊 2024-03-15: 숙제 검사 50건, AI 분석 30건
   (현재까지 사용량)

✅ 2024-04-01: 숙제 검사 0건, AI 분석 0건
   (다시 초기화)

📅 2025-03-01: 구독 만료
   → "구독이 만료되었습니다" 표시
```

### 시나리오 2: 1개월 플랜 사용자
```
✅ 2024-03-15 구독 시작

📊 2024-03-20: 숙제 검사 10건
📊 2024-03-25: 숙제 검사 25건

✅ 2024-04-01: 숙제 검사 0건 (초기화)

📅 2024-04-15: 구독 만료
   → "플랜 없음" 표시
   → /pricing 페이지로 이동
```

## 🎯 동작 방식

### 매달 1일 자동 초기화
```
날짜          사용량 표시
─────────────────────────
2024-02-28   100건
2024-03-01   0건 ← 자동 초기화
2024-03-05   5건
2024-03-10   12건
2024-03-31   45건
2024-04-01   0건 ← 자동 초기화
```

### 학생 수는 누적
```
날짜          학생 수
─────────────────────────
2024-02-28   50명
2024-03-01   50명 ← 초기화 안됨
2024-03-15   55명 (신규 5명 추가)
2024-04-01   55명 ← 초기화 안됨
```

## 🚀 배포 상태

**커밋**: `54041b66`  
**상태**: ✅ 배포 완료  
**URL**: https://superplace-academy.pages.dev

## 💡 주의사항

1. **UTC 기준 날짜**
   - 모든 날짜 계산은 UTC 기준
   - 한국 시간(KST)은 UTC+9
   - 예: UTC 3/1 00:00 = KST 3/1 09:00

2. **데이터베이스 날짜 형식**
   - createdAt 컬럼이 ISO 8601 형식이어야 함
   - 예: `2024-03-01T00:00:00.000Z`

3. **테이블이 없는 경우**
   - try-catch로 안전하게 처리
   - 테이블 없으면 0으로 카운트

4. **성능 고려**
   - JOIN과 날짜 필터링으로 인한 쿼리 속도 저하 가능
   - 필요시 createdAt 컬럼에 인덱스 추가 권장

## 📚 관련 파일

- `/functions/api/subscription/check.ts` - 사용량 카운트 API
- `/src/app/dashboard/settings/page.tsx` - 사용량 표시 UI
- `/src/app/dashboard/admin/director-limitations/page.tsx` - 제한 설정 UI

---

**최종 수정**: 2026-03-07  
**커밋**: `54041b66`  
**상태**: ✅ 완료
