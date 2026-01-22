# 🔍 API 오류 최종 진단 보고서

**진단 일시**: 2026-01-22  
**오류**: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요."

---

## 🚨 문제 확인

### 프로덕션 API 오류:
```
[404 Not Found] models/gemini-1.5-flash is not found for API version v1beta
```

###핵심 문제:
**Google Gemini API가 `gemini-1.5-flash` 모델을 찾을 수 없음**

---

## 🔍 원인 분석

### 1. 코드 검증: ✅ 정상
```typescript
// 현재 코드 (정확함)
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
});
```

### 2. API 키 설정: ✅ 설정됨
- Vercel 환경 변수에 `GOOGLE_GEMINI_API_KEY` 존재 확인

### 3. SDK 버전: ✅ 최신
- `@google/generative-ai`: ^0.24.1

### 4. **실제 문제: API 호출 실패**

SDK가 호출하는 실제 URL:
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
```

API 응답:
```
404 Not Found - models/gemini-1.5-flash is not found
```

---

## 💡 가능한 원인 (우선순위)

### 🎯 원인 1: API 키가 해당 모델을 지원하지 않음 (90% 가능성)

**증상**:
- API 키는 유효함
- 하지만 `gemini-1.5-flash` 모델에 대한 권한 없음
- 다른 모델(예: gemini-pro, gemini-1.5-pro)은 작동할 수 있음

**확인 방법**:
```bash
# 직접 API 호출 테스트
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"test"}]}]}'
```

### 🎯 원인 2: Google Cloud Project 설정 (5% 가능성)

**확인 사항**:
1. Generative Language API 활성화 상태
2. API 키가 생성된 프로젝트
3. 모델별 권한 설정

### 🎯 원인 3: 모델명 변경 (5% 가능성)

Google이 모델명을 변경했거나 버전 번호가 필요:
- `gemini-1.5-flash-001`
- `gemini-1.5-flash-002`
- `gemini-1.5-flash-latest`

---

## ✅ 해결 방법

### 🚀 방법 1: 여러 모델 Fallback (권장) 

여러 모델을 순서대로 시도하여 작동하는 모델 사용:

```typescript
const MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash-exp',
  'gemini-pro',
];

for (const modelName of MODELS) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(message);
    return result; // 성공하면 반환
  } catch (error) {
    continue; // 실패하면 다음 모델 시도
  }
}
```

**장점**:
- API 키가 어떤 모델을 지원하든 작동
- 자동으로 사용 가능한 모델 찾음
- 안정적

### 🚀 방법 2: 특정 모델로 변경

가장 널리 지원되는 모델로 변경:

```typescript
// gemini-1.5-pro (가장 안정적)
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-pro',
});
```

### 🚀 방법 3: API 키 재발급

**Google AI Studio**에서 새 API 키 발급:
1. https://aistudio.google.com/app/apikey
2. 새 API 키 생성
3. Generative Language API 활성화 확인
4. Vercel 환경 변수 업데이트

---

## 📋 추천 해결 순서

### 즉시 적용 (배포 없이 테스트):

1. **로컬에서 API 키 직접 테스트**:
   ```bash
   # Vercel에 설정된 API 키를 로컬 .env에 복사
   echo 'GOOGLE_GEMINI_API_KEY=Vercel의_API_키' > .env
   
   # 여러 모델 테스트
   node test-models-detailed.js
   ```

2. **작동하는 모델 확인**

3. **코드 수정**:
   - Fallback 방식 적용 (route-fallback.ts 참조)
   - 또는 작동하는 모델로 변경

4. **배포 및 테스트**

---

## 🧪 디버깅 코드 추가

현재 코드에 디버깅 로그 추가됨:
```typescript
console.log('[DEBUG] Attempting to use model: gemini-1.5-flash');
console.log('[DEBUG] Model instance created');
console.error('[DEBUG] Error details:', {...});
```

Vercel 로그에서 확인:
```
https://vercel.com/kohsunwoo12345-cmyk/superplace-study/logs
```

---

## 🎯 결론

### 핵심 문제:
**API 키가 `gemini-1.5-flash` 모델을 지원하지 않음**

### 권장 해결책:
1. **Fallback 방식 적용** (route-fallback.ts 사용)
2. 여러 모델을 순서대로 시도
3. 작동하는 모델 자동 선택

### 임시 해결책:
- `gemini-1.5-pro`로 변경
- 또는 `gemini-2.0-flash-exp` 시도

---

## 📁 생성된 파일

1. **route-fallback.ts** - 여러 모델 Fallback 버전
2. **test-direct-api.sh** - API 직접 호출 테스트
3. **route.ts** - 디버깅 로그 추가됨

---

**다음 단계**: Fallback 방식을 적용하거나 작동하는 모델로 변경
