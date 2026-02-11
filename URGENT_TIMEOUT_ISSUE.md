# 🚨 긴급 문제 분석 보고서

날짜: 2026-02-12 04:45 KST

---

## 📋 문제 상황

### 증상
- 숙제 제출 후 20분 이상 지났는데도 **여전히 `pending` 상태**
- 수동으로 채점 API 호출 시 **30초 타임아웃 발생**
- 자동 채점이 전혀 작동하지 않음

### 테스트 결과
```bash
# 최신 제출 확인
curl "https://superplacestudy.pages.dev/api/homework/history?userId=3"
→ status: "pending", score: null (20분 경과)

# 수동 채점 시도
curl -X POST "/api/homework/process-grading" \
  -d '{"submissionId":"homework-1770837819995-qeqbi7btx"}'
→ Error: context deadline exceeded (30초 타임아웃)
```

---

## 🔍 근본 원인

### 1. Cloudflare Workers 타임아웃 제한
- **최대 실행 시간: 30초** (Pages Functions)
- 채점 API가 30초 내에 완료되지 않으면 강제 종료

### 2. Gemini API 호출 2회
```typescript
// functions/api/homework/process-grading.ts
// 1차 호출 (240줄): 채점 수행
fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`)

// 2차 호출 (365줄): 추가 분석?
fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`)
```

각 호출당 10-20초 소요 → 총 20-40초 → **타임아웃 발생**

### 3. 클라이언트 자동 호출도 실패
```typescript
// src/app/attendance-verify/page.tsx
fetch('/api/homework/process-grading', { ... })
  .then(gradingResponse => { ... })
```
→ 30초 타임아웃으로 실패하지만 **에러가 무시됨** (catch 없음)

---

## ✅ 해결 방안

### 방안 1: 타임아웃 처리 추가 (즉시 적용 가능)

#### 1-1. 프론트엔드에서 타임아웃 에러 처리
```typescript
// src/app/attendance-verify/page.tsx
if (submissionId) {
  console.log('🤖 자동 채점 시작:', submissionId);
  
  // 타임아웃 설정 (60초)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  
  fetch('/api/homework/process-grading', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ submissionId }),
    signal: controller.signal
  }).then(gradingResponse => {
    clearTimeout(timeoutId);
    if (gradingResponse.ok) {
      return gradingResponse.json();
    }
    throw new Error('채점 API 오류: ' + gradingResponse.status);
  }).then(gradingData => {
    console.log('✅ 자동 채점 완료:', gradingData);
  }).catch(err => {
    console.error('❌ 자동 채점 실패:', err);
    // 실패해도 사용자에게 알리지 않음 (백그라운드 작업)
  });
}
```

하지만 이것만으로는 해결 안됨 → **API 자체가 30초 안에 완료되어야 함**

### 방안 2: Gemini API 호출 최적화 (권장)

#### 2-1. 두 번 호출을 한 번으로 통합
- 현재: 채점 + 분석 = 2회 호출
- 개선: 한 번에 모든 정보 요청

#### 2-2. 더 빠른 모델 사용
- 현재: `gemini-2.5-flash` (느림)
- 개선: `gemini-1.5-flash` 또는 `gemini-1.5-pro` (더 빠름)

#### 2-3. 프롬프트 단순화
- 요청 JSON 크기 줄이기
- 응답 JSON 크기 줄이기

### 방안 3: 비동기 처리 (최선)

#### 3-1. Queue 시스템 사용
1. 제출 → Queue에 추가 (즉시 반환)
2. Worker가 Queue에서 꺼내서 채점 (비동기)
3. 채점 완료 → DB 업데이트

**문제**: Cloudflare Pages Functions에서는 Queue를 직접 사용할 수 없음

#### 3-2. 외부 서비스 사용
- Cloudflare Workers (유료 플랜) + Durable Objects
- 또는 다른 서버리스 플랫폼 (AWS Lambda, Google Cloud Functions)

---

## 🔧 즉시 적용 가능한 해결책

### 해결책: Gemini API 호출을 1회로 줄이기

현재 코드에서 **불필요한 2차 호출을 제거**하고, **한 번에 모든 정보를 요청**합니다.

#### 수정할 파일
- `functions/api/homework/process-grading.ts`

#### 수정 내용
1. 2차 Gemini API 호출 제거
2. 1차 호출에서 모든 정보 한 번에 요청
3. 타임아웃 에러 처리 추가

---

## 📊 예상 효과

### Before
- Gemini API 호출: 2회
- 총 소요 시간: 20-40초
- 결과: **타임아웃 발생** ❌

### After
- Gemini API 호출: 1회
- 총 소요 시간: 10-20초
- 결과: **성공** ✅

---

## 🚀 다음 단계

1. ✅ Gemini API 호출 횟수 확인 (완료)
2. ⏳ 2차 호출 제거 코드 수정 (진행 중)
3. ⏳ 타임아웃 에러 처리 추가
4. ⏳ 배포 및 테스트

---

## 💡 장기 개선 방안

### 1. Cloudflare Workers 유료 플랜
- 타임아웃: 최대 15분
- Durable Objects 사용 가능
- Queue 시스템 구축 가능

### 2. 하이브리드 아키텍처
- Cloudflare Pages: UI + 간단한 API
- 별도 서버: 채점 API (긴 작업)

### 3. 캐싱 강화
- 동일한 이미지 재제출 시 이전 결과 반환
- 채점 결과 영구 저장

---

**작성일**: 2026-02-12 04:45 KST  
**작성자**: AI Assistant  
**상태**: 🔧 수정 진행 중
