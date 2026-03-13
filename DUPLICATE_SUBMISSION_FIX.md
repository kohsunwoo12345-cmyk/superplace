# Duplicate Submission Fix Report

## 문제 상황
- **현상**: 학생이 숙제 1개를 제출하면 데이터베이스에 2개의 submission 레코드가 생성됨
- **점수**: 모든 제출이 0점으로 표시됨
- **피드백**: "이미지에서 충분한 텍스트를 인식하지 못했습니다" 메시지만 표시

## 원인 분석

### 중복 생성 원인
1. `/api/homework/submit` (submit/index.ts:143-146)에서 submission 레코드 생성
2. `/api/homework/submit`이 `/api/homework/grade`를 호출 (submit/index.ts:224)
3. `/api/homework/grade` (grade.ts:108-111)에서 **또 다른** submission 레코드 생성

### 데이터 흐름
```
Student Upload
    ↓
POST /api/homework/submit
    ├─ INSERT homework_submissions_v2 (submission #1) ✓
    ├─ INSERT homework_images ✓
    └─ Call POST /api/homework/grade
           └─ INSERT homework_submissions_v2 (submission #2) ❌ DUPLICATE!
```

## 해결 방법

### 1. submit/index.ts 수정
**변경 사항**: `/api/homework/grade` 호출 시 `submissionId` 전달

```typescript
// Line 227-231
body: JSON.stringify({ 
  userId, 
  code, 
  images: imageArray,
  submissionId  // ✅ 이미 생성된 제출 ID 전달
})
```

### 2. grade.ts 수정
**변경 사항**: 기존 submission 사용 또는 새로 생성 (하위 호환성 유지)

```typescript
// Line 32: submissionId 파라미터 추가
const { userId, code, images, image, submissionId: existingSubmissionId } = body;

// Line 101-133: 조건부 로직
if (existingSubmissionId) {
  // ✅ 기존 제출 기록 사용 (중복 방지)
  submissionId = existingSubmissionId;
  // UPDATE status만 수행
} else {
  // ✅ 새 제출 기록 생성 (하위 호환성)
  submissionId = `homework-${Date.now()}-...`;
  // INSERT 수행
}
```

## 수정된 데이터 흐름
```
Student Upload
    ↓
POST /api/homework/submit
    ├─ INSERT homework_submissions_v2 (submission #1) ✓
    ├─ INSERT homework_images ✓
    └─ Call POST /api/homework/grade (with submissionId)
           └─ UPDATE homework_submissions_v2 (submission #1) ✓
              └─ No duplicate! ✅
```

## 테스트 방법

### 1. Build & Deploy
```bash
npm run build
npx wrangler pages deploy out --project-name superplacestudy
```

### 2. 실제 숙제 제출 테스트
https://superplacestudy.pages.dev/dashboard/homework/student

1. 학생으로 로그인 (테스트학생1771491306)
2. 숙제 사진 촬영 및 제출
3. 결과 페이지 확인: https://superplacestudy.pages.dev/dashboard/homework/results

### 3. 예상 결과
- ✅ 제출 건수: 1개 (중복 없음)
- ✅ 채점 상태: 'graded' (pending 아님)
- ✅ 점수: 0점이 아닌 실제 점수
- ✅ 피드백: Gemini API가 생성한 실제 피드백 표시

## 추가 개선 사항

### Worker 상태
- **Model**: `gemini-2.5-flash-lite` ✓ 정상
- **OCR**: Gemini Vision API 호출 ✓ 정상
- **Grading**: Gemini API 호출 ✓ 정상
- **URL**: https://physonsuperplacestudy.kohsunwoo12345.workers.dev

### 확인 필요
1. Gemini API 키가 올바르게 설정되었는지 확인
2. Worker logs 확인: https://dash.cloudflare.com/117379ce5c9d9af026b16c9cf21b10d5/workers/services/view/physonsuperplacestudy/logs
3. 실제 숙제 이미지로 OCR 텍스트 추출 확인
4. 채점 결과 JSON 구조 확인

## 배포 정보
- **Fix Version**: v2.6.0
- **Date**: 2026-03-13 22:00 UTC
- **Changed Files**:
  - `/functions/api/homework/submit/index.ts`
  - `/functions/api/homework/grade.ts`
- **Cloudflare Pages**: https://superplacestudy.pages.dev
- **Worker**: https://physonsuperplacestudy.kohsunwoo12345.workers.dev

## 관련 파일
- `test_homework_submission_complete.sh` - 전체 제출 프로세스 테스트 스크립트
- `WORKER_FIX_REPORT.md` - Worker OCR/채점 수정 리포트
