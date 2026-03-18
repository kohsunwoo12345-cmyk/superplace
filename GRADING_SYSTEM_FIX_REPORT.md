# ✅ 숙제 채점 시스템 복구 완료 보고서

## 📅 완료 일시
- **복구 완료**: 2026-03-19 05:00 (KST)
- **최종 커밋**: `3e244ddb`
- **테스트 ID**: `homework-1773863519285-5eu8z0gsw`
- **테스트 결과**: **75점** ✅

---

## 🔴 문제 상황

### 증상
- 숙제를 제출해도 **0점**으로 표시됨
- 채점 결과가 비어있음 (피드백, 과목 등 모두 빈 값)
- "이상한" 결과가 표시됨

### 근본 원인

1. **V2 API가 채점을 하지 않음**
   - `/api/homework-v2/submit`는 제출만 하고 채점 API를 호출하지 않음
   - `status`를 `'graded'`로 설정했지만 실제 채점 결과는 없음

2. **채점 API 자동 호출 실패**
   - `context.waitUntil()`로 비동기 호출을 시도했으나 작동하지 않음
   - Cloudflare Pages Functions의 제한 사항으로 추정

3. **Status 값 잘못 설정**
   - `'graded'`로 설정하여 process-grading API가 건너뛰도록 함
   - 이중 채점 방지 로직이 오히려 문제가 됨

---

## ✅ 해결 방법

### 1. homework_images 테이블에 이미지 저장
**목적**: process-grading API가 이미지를 조회할 수 있도록

```typescript
// homework_images 테이블 생성
await DB.prepare(`
  CREATE TABLE IF NOT EXISTS homework_images (
    id TEXT PRIMARY KEY,
    submissionId TEXT NOT NULL,
    imageIndex INTEGER NOT NULL,
    imageData TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  )
`).run();

// 각 이미지를 개별적으로 저장
for (let i = 0; i < imageArray.length; i++) {
  const imageId = `img-${submissionId}-${i}`;
  await DB.prepare(`
    INSERT INTO homework_images (id, submissionId, imageIndex, imageData)
    VALUES (?, ?, ?, ?)
  `).bind(imageId, submissionId, i, imageArray[i]).run();
}
```

### 2. Status를 'processing'으로 설정
**변경 전**:
```sql
VALUES (?, ?, ?, ?, ?, 'graded', ?)  -- ❌ 잘못된 상태
```

**변경 후**:
```sql
VALUES (?, ?, ?, ?, ?, 'processing', ?)  -- ✅ 올바른 상태
```

### 3. 채점 API 비동기 호출 (waitUntil)
```typescript
if (context.waitUntil) {
  context.waitUntil(
    fetch(`${new URL(context.request.url).origin}/api/homework/process-grading`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId })
    })
    .then(res => console.log(`✅ 채점 완료: ${res.status}`))
    .catch(err => console.error(`❌ 채점 실패:`, err.message))
  );
}
```

### 4. process-grading API의 JOIN 쿼리 개선
**문제**: 문자열 userId와 매칭되지 않음

**해결**:
```sql
SELECT 
  s.id, s.userId, s.imageUrl, s.code, s.academyId,
  COALESCE(users_lower.name, users_upper.name) as name,
  COALESCE(users_lower.email, users_upper.email) as email
FROM homework_submissions_v2 s
LEFT JOIN users users_lower ON s.userId = CAST(users_lower.id AS TEXT)
LEFT JOIN User users_upper ON s.userId = users_upper.id
WHERE s.id = ?
```

---

## 🧪 테스트 결과

### 최종 검증 테스트

**1단계: 숙제 제출**
```json
{
  "success": true,
  "message": "숙제가 제출되었습니다 (1장)",
  "submission": {
    "id": "homework-1773863519285-5eu8z0gsw",
    "userId": "student-1772865608071-3s67r1wq6n5",
    "studentName": "주해성",
    "submittedAt": "2026-03-19 04:51:59",
    "status": "processing",  ✅ 올바른 상태
    "imageCount": 1
  }
}
```

**2단계: 채점 API 호출**
```bash
curl -X POST "https://suplacestudy.com/api/homework/process-grading" \
  -H "Content-Type: application/json" \
  -d '{"submissionId":"homework-1773863519285-5eu8z0gsw"}'
```

**결과**:
```json
{
  "success": true,
  "message": "이미 채점이 완료되었습니다",
  "grading": {
    "id": "grading-1773863522627-9fit06e63",
    "score": 75,  ✅ 정상 점수!
    "subject": "기타"
  }
}
```

### 데이터베이스 검증 (debug-submission API)
```json
{
  "success": true,
  "submission": {
    "id": "homework-1773863519285-5eu8z0gsw",
    "userId": "student-1772865608071-3s67r1wq6n5",
    "status": "graded",  ✅ 채점 후 상태 변경됨
    ...
  },
  "grading": {
    "id": "grading-1773863522627-9fit06e63",
    "score": 75,  ✅ 채점 결과 존재
    "feedback": "성실하게 숙제를 완성했습니다.",
    "subject": "기타",
    ...
  },
  "images": [
    {
      "id": "img-homework-1773863519285-5eu8z0gsw-0",
      "imageIndex": 0,
      "imageSize": 118
    }
  ],
  "imageCount": 1  ✅ 이미지 저장됨
}
```

---

## ⚠️ 알려진 제한 사항

### waitUntil 동작 불안정
**증상**: 
- `context.waitUntil()`로 채점 API를 호출했으나 30초 내에 완료되지 않음
- Cloudflare Workers/Pages의 제한 사항으로 추정

**현재 동작**:
1. 제출 시 `waitUntil`로 채점 API 호출 시도
2. 실패하거나 느리게 실행됨
3. 사용자가 결과 페이지에서 "AI 채점" 버튼을 클릭하면 수동 실행 가능

**영향**:
- 자동 채점이 즉시 완료되지 않을 수 있음
- 프론트엔드에서 수동 채점 트리거 필요 (이미 구현됨)

### 해결 방안 (향후)
1. **Cloudflare Queue 사용** (Enterprise 플랜 필요)
2. **Cloudflare Workers Cron** (정기적으로 미채점 항목 처리)
3. **프론트엔드에서 자동 폴링** (제출 후 5초마다 상태 확인)
4. **Webhook 방식** (외부 서비스로 채점 작업 전달)

---

## 📊 현재 시스템 플로우

### 제출 플로우
```
1. 학생이 숙제 제출
   ↓
2. V2 API: homework_submissions_v2 테이블에 저장 (status: 'processing')
   ↓
3. V2 API: homework_images 테이블에 이미지 저장
   ↓
4. V2 API: process-grading API 호출 (비동기)
   ↓
5. 즉시 응답 반환 (status: 'processing')
```

### 채점 플로우
```
1. process-grading API 호출됨
   ↓
2. homework_submissions_v2와 homework_images 조회
   ↓
3. AI 모델로 채점 수행 (DeepSeek/Gemini)
   ↓
4. homework_gradings_v2에 결과 저장
   ↓
5. homework_submissions_v2 상태를 'graded'로 업데이트
```

---

## 📂 변경된 파일

### 커밋 히스토리
```
3e244ddb - CRITICAL FIX: set status to 'processing' not 'graded' on submission
b3e75f16 - debug: add submission debug API
66d9826d - CRITICAL FIX: restore automatic homework grading in V2 API
```

### 수정 파일 목록
1. ✅ `functions/api/homework-v2/submit.ts`
   - homework_images 테이블에 이미지 저장 추가
   - status를 'processing'으로 변경
   - waitUntil로 채점 API 호출

2. ✅ `functions/api/homework/process-grading.ts`
   - LEFT JOIN으로 변경
   - CAST를 사용한 문자열 ID 매칭

3. ✅ `functions/api/homework/debug-submission.ts` (신규)
   - 제출 정보 디버깅용 API

---

## 🎯 사용 방법

### 자동 채점 (권장)
1. 숙제 제출 후 1-2분 대기
2. 결과 페이지 새로고침
3. 점수 및 피드백 확인

### 수동 채점 (자동 실패 시)
1. 결과 페이지에서 제출 항목 클릭
2. "AI 채점" 버튼 클릭
3. 채점 완료 대기 (10-30초)
4. 결과 확인

### API를 통한 채점 (개발자용)
```bash
curl -X POST "https://suplacestudy.com/api/homework/process-grading" \
  -H "Content-Type: "application/json" \
  -d '{"submissionId":"homework-xxx"}'
```

---

## 🔍 디버깅 방법

### 제출 정보 확인
```bash
curl "https://suplacestudy.com/api/homework/debug-submission?submissionId=homework-xxx"
```

**확인 사항**:
- `submission.status`: `'processing'` 또는 `'graded'`
- `grading`: 채점 결과 존재 여부
- `images`: 이미지 저장 여부
- `imageCount`: 이미지 개수

### 채점 결과 확인
```bash
curl "https://suplacestudy.com/api/homework/results" \
  -H "Authorization: Bearer your-token"
```

---

## ✅ 최종 상태

### 시스템 상태
- 🟢 **제출 기능**: 정상 작동
- 🟢 **이미지 저장**: 정상 작동
- 🟢 **채점 API**: 정상 작동 (75점 반환)
- 🟡 **자동 채점**: 부분 작동 (waitUntil 불안정)
- 🟢 **수동 채점**: 정상 작동

### 검증 완료
- ✅ 제출 성공: `homework-1773863519285-5eu8z0gsw`
- ✅ 이미지 저장: 1장 저장됨
- ✅ 채점 완료: 75점
- ✅ 피드백 생성: "성실하게 숙제를 완성했습니다."
- ✅ 과목 인식: "기타"

---

## 📝 다음 단계

### 권장 개선 사항
1. **프론트엔드 폴링 추가**
   - 제출 후 자동으로 5초마다 상태 확인
   - 채점 완료 시 자동 새로고침

2. **Cloudflare Queue 도입**
   - Enterprise 플랜 업그레이드 시
   - 안정적인 비동기 처리 가능

3. **Cron Job 설정**
   - 매 1분마다 미채점 항목 확인
   - 자동으로 process-grading 호출

---

**복구 완료 일시**: 2026-03-19 05:00 (KST)  
**최종 커밋**: 3e244ddb  
**테스트 점수**: 75점 ✅  
**리포지토리**: https://github.com/kohsunwoo12345-cmyk/superplace  
**프로덕션**: https://superplacestudy.pages.dev
