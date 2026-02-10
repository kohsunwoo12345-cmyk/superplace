# Gemini API 키 설정 가이드

## 문제 설명

숙제 제출 페이지에서 사진을 제출하면 "Gemini API key not configured" 오류가 발생하는 문제입니다.

## 원인

Cloudflare Pages의 환경 변수에 `GEMINI_API_KEY`가 설정되지 않았습니다.

## 해결 방법

### 1. Gemini API 키 발급

1. Google AI Studio 접속: https://makersuite.google.com/app/apikey
2. "Create API Key" 버튼 클릭
3. 생성된 API 키 복사 (예: `AIzaSyABC123...`)

### 2. Cloudflare Pages 환경 변수 설정

#### 방법 A: Cloudflare Dashboard 사용 (권장)

1. Cloudflare Dashboard 로그인: https://dash.cloudflare.com/
2. 프로젝트 선택: `genspark-ai-developer.superplacestudy`
3. "Settings" 탭 클릭
4. "Environment variables" 섹션으로 스크롤
5. "Add variable" 버튼 클릭
6. 다음 정보 입력:
   - Variable name: `GEMINI_API_KEY`
   - Value: (발급받은 API 키 붙여넣기)
   - Environment: `Production` 및 `Preview` 모두 선택
7. "Save" 버튼 클릭
8. 프로젝트 재배포 (자동으로 실행될 수 있음)

#### 방법 B: wrangler CLI 사용

```bash
# Cloudflare에 로그인
npx wrangler login

# 환경 변수 설정
npx wrangler pages secret put GEMINI_API_KEY

# 프롬프트에서 API 키 입력
```

### 3. 설정 확인

#### 로컬 개발 환경

로컬에서 테스트하려면 `.dev.vars` 파일 생성:

```bash
# /home/user/webapp/.dev.vars
GEMINI_API_KEY=your-api-key-here
```

⚠️ **주의**: `.dev.vars` 파일은 절대 Git에 커밋하지 마세요!

`.gitignore`에 이미 추가되어 있는지 확인:
```
.dev.vars
```

#### 배포 환경 테스트

1. 환경 변수 설정 후 배포 대기 (약 1-2분)
2. 테스트 URL: https://genspark-ai-developer.superplacestudy.pages.dev/homework-check
3. 출석 인증 후 숙제 사진 제출
4. 정상 동작 확인:
   - Gemini AI가 사진 분석
   - 점수 및 피드백 표시
   - "채점 완료" 메시지

## API 사용 예시

### 요청

```typescript
// POST /api/homework/submit
{
  "userId": "107",
  "attendanceRecordId": "attendance-1770313795348-1qi4qug0c",
  "imageData": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### 응답 (성공)

```json
{
  "success": true,
  "submissionId": "homework-1738664400000-abc123",
  "grading": {
    "score": 85,
    "feedback": "전반적으로 잘 작성되었습니다. 계산 과정이 명확하고 답도 정확합니다.",
    "strengths": [
      "계산 과정을 단계별로 명확히 작성",
      "최종 답이 정확함"
    ],
    "suggestions": [
      "수식을 더 깔끔하게 정리하면 좋겠음",
      "단위 표기를 추가하면 완벽함"
    ],
    "subject": "수학",
    "completion": "상",
    "effort": "상",
    "submittedAt": "2026-02-05 23:30:00",
    "gradedAt": "2026-02-05 23:30:05"
  },
  "message": "숙제가 성공적으로 제출되고 채점되었습니다"
}
```

### 응답 (API 키 미설정)

```json
{
  "success": false,
  "error": "Gemini API key not configured"
}
```

## 보안 고려사항

1. **API 키 노출 방지**
   - 절대 클라이언트 코드에 하드코딩하지 않음
   - 환경 변수로만 관리
   - Git에 커밋하지 않음

2. **사용량 제한**
   - Gemini API 무료 플랜: 분당 60 요청
   - 필요시 유료 플랜으로 업그레이드

3. **에러 처리**
   - API 키가 없으면 명확한 에러 메시지
   - 사용자에게 "관리자에게 문의하세요" 안내

## 관련 파일

- `/home/user/webapp/functions/api/homework/submit.ts` - 숙제 제출 API
- `/home/user/webapp/wrangler.toml` - Cloudflare 설정 (API 키는 환경 변수로 관리)
- `/home/user/webapp/.dev.vars` - 로컬 개발용 환경 변수 (Git 제외)

## 문제 해결

### 문제: 환경 변수 설정 후에도 에러 발생

**해결책:**
1. Cloudflare Pages 대시보드에서 재배포 강제 실행
2. 브라우저 캐시 삭제 (Ctrl + Shift + R)
3. 환경 변수 이름 확인 (대소문자 구분)

### 문제: API 키가 유효하지 않음

**해결책:**
1. Google AI Studio에서 API 키 재생성
2. API 키에 특수문자나 공백이 없는지 확인
3. Cloudflare 환경 변수에 정확히 복사

### 문제: 로컬에서는 작동하지만 배포 환경에서 실패

**해결책:**
1. Cloudflare 환경 변수가 Production 환경에 설정되었는지 확인
2. wrangler.toml에 [vars] 섹션이 비어있는지 확인 (비밀 키는 환경 변수로만 관리)
3. 배포 로그 확인

## 테스트 시나리오

1. **정상 경로**
   - 출석 인증 → 숙제 촬영 → 제출 → Gemini 분석 → 결과 표시

2. **에러 처리**
   - API 키 없음 → 명확한 에러 메시지
   - 이미지 불명확 → "다시 촬영해주세요" 안내
   - 네트워크 에러 → 재시도 안내

## 추가 정보

- Gemini API 문서: https://ai.google.dev/docs
- Cloudflare Pages 환경 변수: https://developers.cloudflare.com/pages/configuration/build-configuration/#environment-variables
- Wrangler 문서: https://developers.cloudflare.com/workers/wrangler/

---

## 요약

✅ **필수 작업**: Cloudflare Pages 대시보드에서 `GEMINI_API_KEY` 환경 변수 추가
✅ **설정 위치**: Settings → Environment variables
✅ **적용 환경**: Production 및 Preview 모두 선택
✅ **테스트**: 숙제 제출 페이지에서 정상 동작 확인

이 설정을 완료하면 "Gemini API key not configured" 오류가 해결됩니다.
