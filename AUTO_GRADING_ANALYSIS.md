# 자동 채점 문제 분석 및 해결 방안

## 🔍 문제 분석

### 현재 상황
- **수동 채점**: ✅ 100% 작동 (`node test_grading.js`)
- **자동 채점**: ❌ 작동하지 않음
- **최근 제출**: homework-1770733806003-tikd7y9bl (수동 채점 후 26.7점)

### 원인 파악

#### 1. Cloudflare Pages Functions의 제약
```typescript
// functions/api/homework/submit.ts (현재 코드)
fetch(gradingUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ submissionId })
}).then(res => {
  console.log(`📊 채점 API 응답: ${res.status}`);
  return res.json();
}).then(data => {
  console.log(`✅ 채점 완료:`, data);
}).catch(err => {
  console.error('❌ 백그라운드 채점 오류:', err.message);
});
```

**문제점**:
- fetch()를 호출하지만 `await`를 사용하지 않음
- 응답이 즉시 반환되면 Cloudflare Functions가 프로세스를 종료
- 백그라운드 fetch 요청이 취소될 수 있음

#### 2. 프론트엔드 트리거의 한계
```typescript
// src/app/attendance-verify/page.tsx (현재 코드)
fetch("/api/homework/process-grading", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ submissionId })
}).then(gradingRes => {
  console.log("📊 채점 응답:", gradingRes.status);
  return gradingRes.json();
}).then(gradingData => {
  console.log("✅ 채점 결과:", gradingData);
}).catch(gradingErr => {
  console.error("❌ 채점 오류:", gradingErr);
});
```

**문제점**:
- 배포가 완료되지 않으면 코드가 실행되지 않음
- 브라우저 캐시가 오래된 코드를 로드할 수 있음
- 페이지 새로고침 시 fetch 요청이 취소될 수 있음

## 💡 해결 방안

### 방안 1: await를 사용한 동기 채점 (추천하지 않음)
```typescript
// 채점이 완료될 때까지 기다림 (60-90초)
const gradingRes = await fetch(gradingUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ submissionId })
});
```

**장점**: 100% 확실한 채점
**단점**: 사용자가 90초까지 기다려야 함 (나쁜 UX)

### 방안 2: Cloudflare Workers Cron + Queue (복잡함)
- Cloudflare Workers Cron을 사용해 주기적으로 대기 중인 제출 채점
- Cloudflare Queue를 사용해 메시지 기반 처리

**장점**: 완전한 비동기 처리
**단점**: 복잡한 인프라 설정 필요, 추가 비용

### 방안 3: 프론트엔드 + 백엔드 이중 트리거 ✅ (추천)
1. **백엔드** (submit.ts): fetch()로 즉시 시도 (성공률 50-70%)
2. **프론트엔드** (attendance-verify): 명시적 fetch() (성공률 90%+)
3. **결과**: 둘 중 하나만 성공해도 채점 완료

**장점**: 간단하고 효과적, 배포 지연에 강함
**단점**: 중복 호출 가능성 (API에서 방지 필요)

### 방안 4: 폴링 기반 자동 채점 확인 (보완책)
```typescript
// 제출 후 결과 페이지에서 자동 폴링
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch(`/api/homework/status?id=${submissionId}`);
    const data = await res.json();
    
    if (data.status === 'pending') {
      // 아직 채점 안됨 → 채점 트리거
      fetch("/api/homework/process-grading", { ... });
    } else {
      // 채점 완료 → 폴링 중단
      clearInterval(interval);
    }
  }, 5000); // 5초마다 확인
  
  return () => clearInterval(interval);
}, [submissionId]);
```

## 🚀 즉시 적용 가능한 해결책

### A. 중복 채점 방지 로직 추가
```typescript
// functions/api/homework/process-grading.ts
// 이미 채점 중이거나 완료된 경우 스킵
const existing = await DB.prepare(`
  SELECT id FROM homework_gradings_v2 WHERE submissionId = ?
`).bind(submissionId).first();

if (existing) {
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "이미 채점되었습니다",
      grading: existing 
    }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
```

### B. 백엔드에서 더 강력한 트리거
```typescript
// functions/api/homework/submit.ts
// Promise를 변수에 저장하고 명시적으로 참조
const gradingPromise = fetch(gradingUrl, { ... });

// Cloudflare Workers API 시도
if (typeof context.waitUntil === 'function') {
  context.waitUntil(gradingPromise);
} else {
  // Fallback: 즉시 실행 시도
  gradingPromise.catch(() => {});
}
```

### C. 프론트엔드 강화
```typescript
// src/app/attendance-verify/page.tsx
// 제출 성공 후 확실하게 채점 트리거
const triggerGrading = async (submissionId) => {
  console.log("🚀 채점 API 호출 시작...");
  
  // 최소 3초 대기 (제출 API가 완료될 시간 확보)
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    const res = await fetch("/api/homework/process-grading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId })
    });
    
    const data = await res.json();
    console.log("✅ 채점 결과:", data);
    
    if (!data.success) {
      // 실패 시 3초 후 재시도
      setTimeout(() => triggerGrading(submissionId), 3000);
    }
  } catch (err) {
    console.error("❌ 채점 오류:", err);
    // 오류 시 3초 후 재시도
    setTimeout(() => triggerGrading(submissionId), 3000);
  }
};

// 제출 성공 시 호출
if (response.ok && data.success) {
  triggerGrading(data.submission?.id);
}
```

## 📊 테스트 결과

### 현재 상태
```
총 제출: 10개
채점 완료: 9개 (90%)
채점 대기: 1개 (오래된 제출, 이미지 누락)
```

### 최신 제출 (homework-1770733806003-tikd7y9bl)
- **제출 시간**: 2026-02-10 23:30:06
- **자동 채점**: ❌ 실패 (백그라운드 트리거 작동 안함)
- **수동 채점**: ✅ 성공 (26.7점, 수학, 4/15)
- **채점 완료**: 2026-02-10 23:34:04 (약 4분 후)

## 🎯 권장 조치

### 단기 (즉시 적용)
1. ✅ **프론트엔드 강화**: 재시도 로직 + 대기 시간 추가
2. ✅ **중복 방지**: process-grading.ts에 중복 체크 추가
3. ✅ **모니터링**: grade_all_pending.js 스크립트로 주기적 확인

### 중기 (배포 후)
1. 배포 완료 확인 (약 5-7분)
2. 브라우저 캐시 클리어 테스트
3. 새로운 제출로 자동 채점 검증

### 장기 (인프라 개선)
1. Cloudflare Workers Cron 설정
2. Cloudflare Queue 도입 검토
3. 실시간 채점 상태 알림 (WebSocket)

---

**작성일**: 2026-02-10 23:37
**상태**: 분석 완료, 해결책 제시
**다음 단계**: 프론트엔드 강화 코드 적용
