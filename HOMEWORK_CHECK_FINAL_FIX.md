# 숙제 검사 카운트 최종 수정 완료 (채점 완료 기반)

## 📋 문제 분석

### 이전 문제점
1. **설정 페이지에 0이 표시됨**
   - `homework_images` 테이블이 비어있음
   - 업로드만 세고, 실제 채점 완료를 추적하지 않음

2. **플랜 기간 추적 불가**
   - 채점 완료 시 `usage_logs`에 기록하는 로직이 없었음
   - 플랜 시작일부터 채점된 횟수를 셀 수 없었음

3. **사용자 요구사항**
   - "플랜 시작일부터 채점을 한 횟수가 제대로 나와야 해"

---

## ✅ 최종 해결 방안

### 1. 채점 완료 시 usage_logs에 기록
**파일**: `functions/api/homework/process-grading.ts`

**추가된 로직** (채점 결과 저장 직후):
```typescript
// usage_logs에 숙제 검사 기록 (플랜 사용량 집계용)
await DB.prepare(`
  INSERT INTO usage_logs (id, userId, academyId, type, metadata, createdAt)
  VALUES (?, ?, ?, ?, ?, ?)
`).bind(
  `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  submission.userId,
  submission.academyId || null,
  'homework_check',
  JSON.stringify({
    submissionId: submissionId,
    gradingId: gradingId,
    score: gradingResult.score,
    pageCount: imageArray.length,  // 채점된 페이지 수
    subject: gradingResult.subject
  }),
  kstTimestamp
).run();
```

**효과**:
- 채점 완료될 때마다 `usage_logs`에 기록
- `pageCount` 메타데이터에 채점된 페이지 수 저장
- 플랜 기간별 집계 가능

---

### 2. 설정 페이지 카운트 로직 변경
**파일**: `functions/api/subscription/check.ts`

**변경 전**:
```typescript
// homework_images에서 업로드된 이미지 수만 카운트 (비어있음)
SELECT COUNT(*) as count 
FROM homework_images hi
JOIN homework_submissions hs ON hi.submissionId = hs.id
...
```

**변경 후**:
```typescript
// usage_logs에서 채점 완료된 페이지 수 합산
SELECT SUM(CAST(json_extract(metadata, '$.pageCount') AS INTEGER)) as pageCount
FROM usage_logs ul
JOIN User u ON CAST(ul.userId AS TEXT) = u.id
WHERE u.academyId = ?
  AND ul.type = 'homework_check'
  AND ul.createdAt >= ?  -- 플랜 시작일
  AND ul.createdAt <= ?  -- 플랜 종료일
```

**효과**:
- 플랜 시작일부터 종료일까지 채점된 페이지 수 정확히 집계
- `metadata.pageCount`를 합산하여 총 페이지 수 계산
- 설정 페이지에 정확한 숫자 표시

---

### 3. 숙제 제출 시 초과 차단
**파일**: `functions/api/homework/submit/index.ts`

**변경된 로직**:
```typescript
// 플랜 기간 동안 채점된 페이지 수 조회 (usage_logs 기반)
const currentUsage = await DB.prepare(`
  SELECT SUM(CAST(json_extract(metadata, '$.pageCount') AS INTEGER)) as pageCount
  FROM usage_logs ul
  WHERE u.academyId = ?
    AND ul.type = 'homework_check'
    AND ul.createdAt >= ?  -- 플랜 시작일
    AND ul.createdAt <= ?  -- 플랜 종료일
`).first();

const currentPages = currentUsage?.pageCount || 0;

// 초과 시 완전 차단 (403)
if (maxPages !== -1 && currentPages + imageArray.length > maxPages) {
  return 403 Forbidden;
}
```

**효과**:
- 현재 채점된 페이지 수 + 제출하려는 페이지 수 검증
- 한도 초과 시 즉시 차단

---

## 🎯 데이터 흐름

```
1. 학생이 숙제 제출 (3페이지)
   ↓
2. homework_submissions_v2에 저장
   ↓
3. 채점 API 호출 (process-grading)
   ↓
4. AI가 3페이지 채점 완료
   ↓
5. homework_gradings_v2에 채점 결과 저장
   ↓
6. 🆕 usage_logs에 기록:
   - type: 'homework_check'
   - metadata: { pageCount: 3, score: 85, ... }
   - createdAt: 2026-03-17 02:10 KST
   ↓
7. 설정 페이지에서 조회:
   - 플랜 시작일 ~ 현재까지
   - SUM(metadata.pageCount) = 3
   - 화면에 "3" 표시 ✅
```

---

## 🚀 배포 정보

| 항목 | 내용 |
|------|------|
| **Commit** | `789f5a11` |
| **배포 시간** | 2026-03-17 02:11 KST |
| **GitHub** | https://github.com/kohsunwoo12345-cmyk/superplace/commit/789f5a11 |
| **배포 URL** | https://superplacestudy.pages.dev/dashboard/settings/ |
| **전파 시간** | 약 5분 |

---

## ✅ 테스트 시나리오

### 1. 신규 채점 테스트
```
1. 숙제 제출 (예: 5페이지)
2. 채점 완료 대기
3. 설정 페이지 새로고침
4. "숙제 검사" 숫자 확인
   ✅ 예상: 5 표시됨
```

### 2. 누적 카운트 테스트
```
1. 첫 번째 제출: 3페이지 → 채점 완료
2. 두 번째 제출: 2페이지 → 채점 완료
3. 설정 페이지 확인
   ✅ 예상: 5 (3+2) 표시됨
```

### 3. 플랜 기간 테스트
```
1. 플랜 시작일: 2026-03-01
2. 3월 10일: 10페이지 채점
3. 3월 17일: 5페이지 채점
4. 설정 페이지 확인
   ✅ 예상: 15 (플랜 시작일부터 누적)
```

### 4. 한도 초과 테스트
```
1. 플랜 한도: 100페이지
2. 현재 사용: 97페이지
3. 5페이지 제출 시도
4. 결과 확인
   ✅ 예상: 403 Forbidden (97+5 > 100)
```

---

## 🎯 예상 결과

| 시나리오 | 이전 | 수정 후 |
|----------|------|---------|
| **설정 페이지 숫자** | 0 (데이터 없음) | 채점된 페이지 수 정확 표시 ✅ |
| **플랜 기간 집계** | 불가능 | 시작일부터 정확히 집계 ✅ |
| **한도 초과 차단** | 미작동 | 403 에러로 완전 차단 ✅ |
| **채점 추적** | 불가능 | usage_logs에 모든 채점 기록 ✅ |

---

## 📝 수정 사항 요약

### ✅ 완료
1. ✅ 채점 완료 시 usage_logs에 기록 (type: homework_check)
2. ✅ 설정 페이지 카운트를 usage_logs 기반으로 변경
3. ✅ 플랜 시작일부터 채점된 페이지 수 정확히 집계
4. ✅ 숙제 제출 시 초과 차단도 usage_logs 기반
5. ✅ metadata.pageCount에 채점된 페이지 수 저장

### 🔒 영향 범위
- **수정**: 3개 파일 (process-grading.ts, check.ts, submit/index.ts)
- **영향 없음**: 다른 API, UI, DB 스키마

---

## 🔗 관련 링크
- **설정 페이지**: https://superplacestudy.pages.dev/dashboard/settings/
- **GitHub 커밋**: https://github.com/kohsunwoo12345-cmyk/superplace/commit/789f5a11

---

**배포 완료 시간**: 2026-03-17 02:11 KST  
**예상 전파 완료**: 2026-03-17 02:16 KST (약 5분 후)

**🎯 핵심**: 이제 플랜 시작일부터 채점 완료된 페이지 수가 정확하게 표시됩니다!
