# 숙제 검사 카운트 및 초과 차단 수정 완료

## 📋 문제 현황
- **설정 페이지 숫자 오류**: 숙제 검사 숫자가 제대로 표시되지 않음
- **카운트 로직 문제**: 제출 건수만 세고, 실제 업로드된 페이지 수를 세지 않음
- **한도 초과 미차단**: 한도를 초과해도 제출이 계속 가능한 문제

## ✅ 해결 방안

### 1. 숙제 검사 카운트 로직 수정 (API)
**파일**: `functions/api/subscription/check.ts`

**변경 전**:
```typescript
// homework_submissions 테이블에서 제출 건수만 카운트
SELECT COUNT(*) as count 
FROM homework_submissions hs
JOIN User u ON CAST(hs.userId AS TEXT) = u.id
WHERE u.academyId = ?
  AND hs.submittedAt IS NOT NULL
  AND hs.submittedAt >= ?
  AND hs.submittedAt <= ?
```

**변경 후**:
```typescript
// homework_images 테이블에서 업로드된 페이지 수 카운트
SELECT COUNT(*) as count 
FROM homework_images hi
JOIN homework_submissions hs ON hi.submissionId = hs.id
JOIN User u ON CAST(hs.userId AS TEXT) = u.id
WHERE u.academyId = ?
  AND hs.submittedAt IS NOT NULL
  AND hs.submittedAt >= ?
  AND hs.submittedAt <= ?
```

**효과**:
- 설정 페이지(`/dashboard/settings/`)에 정확한 업로드된 페이지 수 표시
- 실제 사용량과 UI가 일치

---

### 2. 초과 시 완전 차단 로직 추가
**파일**: `functions/api/homework/submit/index.ts`

**추가된 로직**:
```typescript
// 사용자 확인 후 즉시 구독 제한 체크
if (user.academyId) {
  // 활성 구독 조회
  const subscription = await DB.prepare(`...`).first();
  
  if (subscription) {
    // 현재 업로드된 페이지 수 조회
    const currentUsage = await DB.prepare(`
      SELECT COUNT(*) as count 
      FROM homework_images hi
      JOIN homework_submissions hs ON hi.submissionId = hs.id
      WHERE ...
    `).first();
    
    const currentPages = currentUsage?.count || 0;
    const maxPages = subscription.maxHomeworkChecks || -1;
    
    // 초과 시 완전 차단 (403 Forbidden)
    if (maxPages !== -1 && currentPages + imageArray.length > maxPages) {
      return new Response(JSON.stringify({ 
        error: "Homework check limit exceeded",
        message: `숙제 검사 한도를 초과했습니다 (현재 ${currentPages}/${maxPages} 사용 중)`,
        currentUsage: currentPages,
        maxLimit: maxPages,
        attemptedPages: imageArray.length
      }), { status: 403 });
    }
  }
}
```

**효과**:
- 한도 초과 시 숙제 제출 **완전 차단**
- 명확한 에러 메시지 (현재 사용량, 한도, 시도한 페이지 수)
- 플랜 업그레이드 유도

---

## 🚀 배포 정보

| 항목 | 내용 |
|------|------|
| **Commit** | `38a7d87c` |
| **배포 시간** | 2026-03-17 01:58 KST |
| **배포 URL** | https://superplacestudy.pages.dev |
| **설정 페이지** | https://superplacestudy.pages.dev/dashboard/settings/ |
| **전파 시간** | 약 5분 |

---

## ✅ 테스트 방법

### 1. 설정 페이지 숫자 확인
```
1. https://superplacestudy.pages.dev/dashboard/settings/ 접속
2. "플랜" 섹션의 "숙제 검사" 항목 확인
3. 업로드된 페이지 수가 정확하게 표시되는지 확인
```

### 2. 한도 초과 차단 테스트
```
1. 숙제 제출 페이지 접속
2. 한도를 초과하는 페이지 수 업로드 시도
3. 403 Forbidden 에러 발생 확인
4. 에러 메시지 내용 확인:
   - 현재 사용량
   - 최대 한도
   - 시도한 페이지 수
```

---

## 🎯 예상 결과

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| **설정 페이지 숫자** | 제출 건수 (부정확) | 업로드된 페이지 수 (정확) |
| **한도 초과 시** | 제출 가능 (문제) | 403 에러로 차단 (정상) |
| **에러 메시지** | 없음 | 현재 사용량/한도/시도 페이지 수 |
| **다른 기능** | 정상 | 정상 (영향 없음) |

---

## 📝 수정 사항 요약

### ✅ 완료
1. ✅ 숙제 검사 카운트를 업로드된 페이지 수로 변경
2. ✅ 초과 시 완전 차단 로직 추가 (403 Forbidden)
3. ✅ 명확한 에러 메시지 제공
4. ✅ 다른 기능에 영향 없음

### 🔒 영향 범위
- **수정**: `functions/api/subscription/check.ts`, `functions/api/homework/submit/index.ts`
- **영향 없음**: 다른 API, UI 컴포넌트, 데이터베이스 스키마

---

## 🔗 관련 링크
- **설정 페이지**: https://superplacestudy.pages.dev/dashboard/settings/
- **GitHub 커밋**: https://github.com/kohsunwoo12345-cmyk/superplace/commit/38a7d87c

---

**배포 완료 시간**: 2026-03-17 01:58 KST  
**예상 전파 완료**: 2026-03-17 02:03 KST (약 5분 후)
