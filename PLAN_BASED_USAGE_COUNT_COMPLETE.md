# ✅ 플랜 적용일 기준 사용량 카운트 구현 완료

## 🎯 주요 변경사항

### 1. 숙제 검사 카운트 변경 ✅

#### Before (❌ 잘못됨)
```sql
-- homework_gradings 테이블 (채점 결과)
SELECT COUNT(*) FROM homework_gradings WHERE ...
```
- 채점된 숙제만 카운트
- 채점 대기중인 숙제는 제외됨

#### After (✅ 올바름)
```sql
-- Homework 테이블 (제출된 숙제)
SELECT COUNT(*) FROM Homework 
WHERE submittedAt IS NOT NULL 
  AND submittedAt >= planStartDate
  AND submittedAt <= planEndDate
```
- **제출된 모든 숙제** 카운트
- 채점 여부와 무관하게 제출만 하면 카운트
- `/dashboard/homework/results/` 페이지와 동일한 데이터

### 2. 플랜 적용일 기준 카운트 ✅

#### Before (❌ 잘못됨)
```typescript
// 매달 1일부터 카운트
const thisMonthStart = new Date();
thisMonthStart.setUTCDate(1);
// → 2024-03-01부터 카운트
```

#### After (✅ 올바름)
```typescript
// 플랜 시작일부터 카운트
const planStartDate = new Date(subscription.startDate);
// → 2024-03-15부터 카운트 (플랜 시작일)
```

## 📅 플랜 기간 계산

### 1개월 플랜
```
플랜 시작: 2024-03-15
카운트 기간: 2024-03-15 ~ 2024-04-15
플랜 종료: 2024-04-15

→ 2024-04-15 이후: "구독이 만료되었습니다"
```

### 12개월 플랜
```
플랜 시작: 2024-03-15
1차 기간: 2024-03-15 ~ 2024-04-15 (1개월)
2차 기간: 2024-04-15 ~ 2024-05-15 (2개월)
...
12차 기간: 2025-02-15 ~ 2025-03-15 (12개월)
플랜 종료: 2025-03-15

→ 각 기간마다 사용량 초기화
```

## 🔄 자동 초기화 방식

### 플랜 갱신 시
```
이전 플랜: 2024-02-15 ~ 2024-03-15
- 숙제 검사: 120건
- AI 분석: 50건

새 플랜: 2024-03-15 ~ 2024-04-15
- 숙제 검사: 0건 ← 자동 초기화
- AI 분석: 0건 ← 자동 초기화
```

### 플랜 만료 시
```
현재 플랜: 2024-02-15 ~ 2024-03-15
- 플랜 종료: 2024-03-15
- 상태: "구독이 만료되었습니다"
- 카운트: 표시 안됨
- 리다이렉트: /pricing
```

## 📊 수정된 쿼리

### 1. 숙제 검사 (Homework 테이블)
```sql
SELECT COUNT(*) as count 
FROM Homework h
JOIN User u ON h.userId = u.id
WHERE u.academyId = ?
  AND h.submittedAt IS NOT NULL        -- 제출된 숙제만
  AND h.submittedAt >= ?               -- 플랜 시작일
  AND h.submittedAt <= ?               -- 현재 또는 플랜 종료일
```

### 2. AI 분석 (usage_logs 테이블)
```sql
SELECT COUNT(*) as count 
FROM usage_logs ul
JOIN User u ON ul.userId = u.id
WHERE u.academyId = ? 
  AND ul.type = 'ai_analysis'
  AND ul.createdAt >= ?                -- 플랜 시작일
  AND ul.createdAt <= ?                -- 현재 또는 플랜 종료일
```

### 3. 유사문제 (usage_logs 테이블)
```sql
SELECT COUNT(*) as count 
FROM usage_logs ul
JOIN User u ON ul.userId = u.id
WHERE u.academyId = ? 
  AND ul.type = 'similar_problem'
  AND ul.createdAt >= ?                -- 플랜 시작일
  AND ul.createdAt <= ?                -- 현재 또는 플랜 종료일
```

### 4. 랜딩페이지 (landing_pages 테이블)
```sql
SELECT COUNT(*) as count 
FROM landing_pages
WHERE academyId = ?
  AND createdAt >= ?                   -- 플랜 시작일
  AND createdAt <= ?                   -- 현재 또는 플랜 종료일
```

## 📝 API 응답 변경

### Before
```json
{
  "subscription": {
    "endDate": "2024-04-15",
    "usage": {
      "homeworkChecks": 150
    }
  }
}
```

### After
```json
{
  "subscription": {
    "startDate": "2024-03-15",  // ✅ 추가
    "endDate": "2024-04-15",
    "usage": {
      "homeworkChecks": 25  // 플랜 기간 동안만 카운트
    }
  }
}
```

## 🎯 실제 동작 예시

### 시나리오 1: 1개월 플랜 구독
```
📅 2024-03-15: 플랜 시작
   - 숙제 검사: 0건

📊 2024-03-20: 
   - 숙제 5건 제출
   - 표시: 5 / 100

📊 2024-03-31:
   - 숙제 25건 제출 (누적)
   - 표시: 25 / 100

📊 2024-04-05:
   - 숙제 35건 제출 (누적)
   - 표시: 35 / 100

❌ 2024-04-15: 플랜 만료
   - "구독이 만료되었습니다"
   - /pricing 페이지로 이동
```

### 시나리오 2: 12개월 플랜 구독
```
📅 2024-03-15: 플랜 시작 (1차 기간)
   - 숙제 검사: 0건

📊 2024-04-10:
   - 1차 기간: 숙제 80건
   - 표시: 80 / 100

📅 2024-04-15: 2차 기간 시작
   - 숙제 검사: 0건 ← 자동 초기화

📊 2024-05-10:
   - 2차 기간: 숙제 65건
   - 표시: 65 / 100

...

📅 2025-03-15: 플랜 만료
   - "구독이 만료되었습니다"
```

## 💡 중요 사항

### 1. 숙제 검사 페이지와 동기화
- `/dashboard/homework/results/` 페이지에 표시되는 숙제 수
- 사용 한도 페이지의 숙제 검사 수
- **완전히 동일한 데이터**를 카운트

### 2. 플랜 갱신 시 자동 초기화
- 새 플랜 구독 시 자동으로 카운트 초기화
- 수동으로 초기화할 필요 없음
- `startDate`를 기준으로 자동 계산

### 3. 학생 수는 누적
- 플랜 갱신과 무관
- 활성 학생만 카운트
- 퇴원 학생 제외

## 🚀 배포 상태

**커밋**: `56e14632`  
**URL**: https://superplace-academy.pages.dev  
**상태**: ✅ 배포 완료

## ✅ 검증 방법

### 1. 숙제 검사 페이지 확인
```
https://superplacestudy.pages.dev/dashboard/homework/results/
→ 표시된 숙제 수 확인
```

### 2. 설정 페이지 확인
```
https://superplacestudy.pages.dev/dashboard/settings
→ 구독 탭에서 숙제 검사 수 확인
```

### 3. 두 페이지의 숫자가 동일해야 함
```
숙제 검사 페이지: 25건
설정 페이지: 25 / 100
→ ✅ 동일함
```

## 📚 관련 파일

- `/functions/api/subscription/check.ts` - 사용량 카운트 API
- `/src/app/dashboard/settings/page.tsx` - 사용량 표시 UI
- `/src/app/dashboard/homework/results/page.tsx` - 숙제 검사 결과

---

**최종 수정**: 2026-03-07  
**커밋**: `56e14632`  
**상태**: ✅ 완료
