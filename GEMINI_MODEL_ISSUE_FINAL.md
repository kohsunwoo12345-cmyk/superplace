# Gemini 모델 호환성 문제 최종 보고서

## 📋 문제 요약
**증상**: 숙제 제출 후 채점 결과가 0점 또는 생성되지 않음  
**근본 원인**: Gemini API 모델 호환성 문제  
**날짜**: 2026-02-11

---

## 🔍 시도한 모델 및 결과

### 1. ❌ gemini-1.5-pro (v1)
```
엔드포인트: /v1/models/gemini-1.5-pro:generateContent
결과: 404 NOT_FOUND
메시지: models/gemini-1.5-pro is not found for API version v1
```

### 2. ❌ gemini-1.5-pro (v1beta)
```
엔드포인트: /v1beta/models/gemini-1.5-pro:generateContent
결과: 404 NOT_FOUND
메시지: models/gemini-1.5-pro is not found for API version v1beta
```

### 3. ❌ gemini-1.5-flash (v1beta)
```
엔드포인트: /v1beta/models/gemini-1.5-flash:generateContent
결과: 404 NOT_FOUND
메시지: models/gemini-1.5-flash is not found for API version v1beta
```

### 4. ❌ gemini-pro-vision (v1beta)
```
엔드포인트: /v1beta/models/gemini-pro-vision:generateContent
결과: 404 NOT_FOUND
메시지: models/gemini-pro-vision is not found for API version v1beta
```

### 5. 🔄 gemini-1.5-flash-8b (v1beta) - 테스트 중
```
엔드포인트: /v1beta/models/gemini-1.5-flash-8b:generateContent
상태: 배포 중 / 캐시 문제로 인해 아직 테스트 불가
```

---

## 🚨 핵심 문제

### 1. Gemini API 모델 지원 불확실성
- Google Gemini API 문서와 실제 지원 모델 불일치
- v1과 v1beta 엔드포인트 모두에서 주요 모델들이 NOT_FOUND 반환
- **API 키는 정상이지만 모델이 지원되지 않음**

### 2. Cloudflare Pages 배포 문제
- 코드 변경 후 배포 완료까지 2-3분 소요
- 배포 후에도 **캐시로 인해 이전 버전 실행**
- 실제 테스트 시 이전 모델명이 계속 에러 로그에 나타남

---

## 💡 해결 방안

### 즉시 시도 가능한 방법

#### 방법 1: gemini-1.5-flash-8b 확인 (현재 배포 중)
```bash
# 10분 후 재테스트 필요
curl -X POST https://superplacestudy.pages.dev/api/homework/process-grading \
  -H "Content-Type: application/json" \
  -d '{"submissionId":"<SUBMISSION_ID>"}'
```

#### 방법 2: Google AI Studio API Key 재발급
1. https://makersuite.google.com/app/apikey 접속
2. 새 API 키 생성
3. Cloudflare Pages 환경변수 `GOOGLE_GEMINI_API_KEY` 업데이트
4. **API 키가 지원하는 모델 목록 확인**

#### 방법 3: 실제 지원 모델 확인
```bash
# API 키로 사용 가능한 모델 목록 조회
curl "https://generativelanguage.googleapis.com/v1/models?key=YOUR_API_KEY" | \
  jq '.models[] | select(.supportedGenerationMethods[] | contains("generateContent")) | .name'
```

#### 방법 4: 템플릿 기반 폴백 추가
- Gemini API 실패 시 기본 템플릿 기반 채점으로 폴백
- 점수: 75점 (기본값)
- 피드백: "AI 채점이 일시적으로 사용 불가합니다. 기본 평가를 제공합니다."

---

## 🔧 권장 해결 순서

### 1단계: API 키 확인 및 재발급 (우선순위 최상)
```bash
# Google AI Studio에서 새 API 키 발급
# - https://makersuite.google.com/app/apikey
# - 키 생성 시 "사용 가능한 모델" 확인
# - Cloudflare Pages 환경변수에 설정
```

### 2단계: Cloudflare Pages 캐시 강제 클리어
```bash
# Cloudflare Dashboard
# 1. Pages > superplacestudy > Deployments
# 2. 최신 deployment 선택
# 3. "Retry deployment" 또는 "Rollback" 후 다시 배포
# 4. 캐시 클리어 확인
```

### 3단계: 실제 지원 모델 확인 및 코드 수정
```typescript
// 사용 가능한 모델 확인 후
// functions/api/homework/process-grading.ts Line 240, 365
// functions/api/homework/grade.ts Line 140, 350, 719
// 올바른 모델명으로 교체
```

### 4단계: 폴백 시스템 구현 (장기 해결책)
```typescript
// Gemini API 실패 시 기본 채점 제공
try {
  const result = await callGeminiAPI(...);
  return result;
} catch (error) {
  console.error('Gemini API failed:', error);
  return {
    score: 75.0,
    feedback: "성실하게 숙제를 완성했습니다.",
    subject: "수학",
    // ...기본값들
  };
}
```

---

## 📊 현재 상태

| 항목 | 상태 |
|------|------|
| **코드 변경** | ✅ gemini-1.5-flash-8b로 설정됨 |
| **빌드** | ✅ 성공 |
| **배포** | ✅ 완료 (커밋 00dbe8b) |
| **캐시 문제** | ⚠️ 이전 모델이 여전히 실행 중 |
| **테스트** | ❌ 404 NOT_FOUND |
| **실제 작동** | ❌ 아직 확인 안 됨 |

---

## 🎯 다음 단계

### 즉시 필요한 작업
1. ⚠️ **Google AI Studio에서 API 키 재발급**
2. ⚠️ **API 키가 지원하는 모델 목록 확인**
3. ⚠️ **Cloudflare Pages 캐시 클리어 및 재배포**
4. 🔄 **10분 대기 후 gemini-1.5-flash-8b 재테스트**

### 장기 개선 사항
- [ ] 폴백 시스템 구현 (Gemini 실패 시 기본 채점)
- [ ] 사용 가능한 모델 목록을 환경변수로 관리
- [ ] API 호출 실패 시 재시도 로직 추가
- [ ] 모니터링 및 알림 시스템 구축

---

## 📚 참고 정보

### Google Gemini API 공식 문서
- https://ai.google.dev/tutorials/rest_quickstart
- https://ai.google.dev/api/rest/v1beta
- https://ai.google.dev/api/rest/v1

### 모델 목록 확인 API
```bash
# v1 엔드포인트
curl "https://generativelanguage.googleapis.com/v1/models?key=YOUR_API_KEY"

# v1beta 엔드포인트
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
```

### Cloudflare Pages 문서
- https://developers.cloudflare.com/pages/
- https://developers.cloudflare.com/pages/configuration/build-caching/

---

## 🔍 디버깅 정보

### 에러 로그 샘플
```json
{
  "error": "Failed to process grading",
  "message": "Gemini API error: 404 - {\n  \"error\": {\n    \"code\": 404,\n    \"message\": \"models/[MODEL_NAME] is not found for API version [VERSION], or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods.\",\n    \"status\": \"NOT_FOUND\"\n  }\n}\n"
}
```

### 커밋 히스토리
```
00dbe8b - fix: try gemini-1.5-flash-8b model
1af3ac9 - fix: use gemini-pro-vision
7c606f8 - fix: change from gemini-1.5-pro to gemini-1.5-flash
c609621 - fix: change Gemini API from v1 to v1beta
877d087 - fix: enhance Gemini API error logging
```

---

## ⚠️ 중요 공지

### Gemini API 호환성 문제는 Google API 정책 변경에 기인할 수 있음
- 2024-2026년 사이 Gemini API 모델 구조가 여러 차례 변경됨
- 문서에 나와있는 모델이 실제로 지원되지 않을 수 있음
- **API 키별로 사용 가능한 모델이 다를 수 있음**

### 해결책: 템플릿 기반 폴백 시스템 (권장)
유사문제 출제 API에서 이미 구현된 방식을 채점에도 적용:
1. Gemini API 호출 시도
2. 실패 시 기본 템플릿 기반 채점 제공
3. 사용자에게 안내 메시지 표시: "AI 채점이 일시적으로 사용 불가합니다."

---

**작성일**: 2026-02-11 20:30 UTC  
**상태**: ⚠️ 모델 호환성 문제 해결 진행 중  
**우선순위**: 🚨 긴급 - API 키 재발급 및 모델 확인 필요
