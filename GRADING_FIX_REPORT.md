# 🔧 숙제 채점 문제 해결 보고서

## 📋 문제 상황

**사용자 보고:**
- 고선우 학생이 숙제를 제출했지만 채점이 완료되지 않음
- 상태: "채점 중..." → 0점, 완성도: pending

**증상:**
```
고선우님의 숙제
채점 중...
✕ 닫기
🔥 0점
Homework
완성도: pending
노력도: 0
제출된 숙제 사진 (2장)
```

---

## 🔍 원인 분석

### 근본 원인: Cloudflare Pages Functions의 제약

**문제 1: 백그라운드 실행 불가**
```typescript
// functions/api/homework/submit.ts (기존 코드)
fetch(gradingUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ submissionId })
}).then(res => {
  // ❌ 이 코드는 응답이 반환된 후 실행 컨텍스트가 종료되어 완료되지 않음!
  console.log(`📊 채점 API 응답: ${res.status}`);
  return res.json();
}).catch(err => {
  console.error('❌ 백그라운드 채점 오류:', err.message);
});

// 즉시 응답 반환
return new Response(JSON.stringify({ success: true }));
```

**Cloudflare Pages Functions 동작:**
1. 클라이언트 요청 → 함수 실행
2. `Response` 반환 → **실행 컨텍스트 즉시 종료**
3. 백그라운드 `fetch`는 완료되지 못함

**문제 2: context.waitUntil 미지원**
- Cloudflare Workers는 `context.waitUntil()`을 지원하지만
- **Cloudflare Pages Functions는 지원하지 않음**

---

## ✅ 해결 방법

### 클라이언트에서 명시적으로 채점 API 호출

**수정된 코드:**

```typescript
// src/app/homework-check/page.tsx
const submitHomework = async () => {
  // ... (제출 로직)
  
  if (response.ok && data.success) {
    setResult(data);
    fetchHomeworkHistory(currentUser.id);
    setCapturedImages([]);
    
    // 🚀 채점 API 명시적 호출 (추가됨!)
    console.log('🚀 채점 API 호출 시작:', data.submission.id);
    fetch("/api/homework/process-grading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        submissionId: data.submission.id
      })
    }).then(res => res.json())
      .then(gradingData => {
        console.log('✅ 채점 완료:', gradingData);
        // 채점 완료 후 히스토리 다시 불러오기
        fetchHomeworkHistory(currentUser.id);
      })
      .catch(err => {
        console.error('❌ 채점 오류:', err);
      });
  }
};
```

**submit.ts 수정:**
```typescript
// functions/api/homework/submit.ts
// 백그라운드 fetch 호출 제거
// 클라이언트에서 채점 API를 직접 호출하도록 변경
```

---

## 🔄 처리 흐름

### 이전 (문제 있음):
```
1. 클라이언트 → POST /api/homework/submit
2. 서버: 제출 저장 → fetch(/api/homework/process-grading) 호출 (백그라운드)
3. 서버: 즉시 응답 반환
4. ❌ 실행 컨텍스트 종료 → fetch 완료되지 못함
5. ❌ 채점 안됨 → pending 상태 유지
```

### 수정 후 (정상 동작):
```
1. 클라이언트 → POST /api/homework/submit
2. 서버: 제출 저장 → 즉시 응답 반환
3. 클라이언트: 응답 수신 → POST /api/homework/process-grading 호출
4. 서버: Gemini API로 채점 수행
5. 서버: 채점 결과 DB 저장
6. ✅ 클라이언트: 채점 완료 응답 수신 → 히스토리 새로고침
```

---

## 🧪 테스트 계획

### 1. 기존 제출 건 재채점

**고선우 학생 제출 건 찾기:**
```sql
SELECT id, userId, submittedAt, status
FROM homework_submissions_v2
WHERE status = 'pending'
ORDER BY submittedAt DESC
LIMIT 10;
```

**수동 재채점:**
```bash
curl -X POST https://superplacestudy.pages.dev/api/homework/process-grading \
  -H "Content-Type: application/json" \
  -d '{"submissionId": "homework-XXXX-YYYY"}'
```

### 2. 새로운 제출 테스트

1. 숙제 제출 페이지 접속
2. 사진 2장 촬영
3. 제출 버튼 클릭
4. 콘솔 확인:
   - "🚀 채점 API 호출 시작"
   - "✅ 채점 완료"
5. 히스토리에서 채점 결과 확인

---

## 📊 배포 정보

- **커밋**: `150c3ef`
- **브랜치**: `main`
- **배포 URL**: https://superplacestudy.pages.dev/
- **배포 시작**: 2026-02-11 13:40:00 UTC
- **예상 소요**: 약 2-3분

---

## ✅ 예상 결과

- ✅ 새로운 제출은 자동으로 채점됨
- ✅ 기존 pending 상태 제출은 수동 재채점 가능
- ✅ 채점 완료 시 히스토리에 즉시 반영
- ✅ 점수, 피드백, 강점/약점 분석 모두 표시

---

**생성 시간**: 2026-02-11 13:40:30 UTC
**작성자**: AI Assistant
**프로젝트**: Super Place Study
