# 🔍 상세 에러 메시지 확인 가능

**커밋**: 17055668  
**배포**: 2026-03-18 10:46 UTC  

---

## ✅ 변경 사항

### 1. Worker RAG 복구
- 원래대로 동작

### 2. 상세 에러 메시지
```typescript
// Before
throw new Error(`Gemini API 오류: ${response.status}`);

// After  
const errorMessage = parsedError?.error?.message || errorText;
throw new Error(`Gemini API ${response.status}: ${errorMessage}`);
```

---

## 🧪 테스트 및 에러 확인

### 1. 테스트
https://suplacestudy.com/ai-chat/ 에서 메시지 전송

### 2. F12 콘솔에서 확인
```javascript
❌ API 응답 오류: {
  status: 500,
  errorData: {
    success: false,
    message: "오류가 발생했습니다",
    error: "Gemini API 400: 여기에 실제 에러 메시지!"  // ← 이제 상세함!
  }
}
```

---

## 📋 예상되는 에러 메시지들

### A) 모델 없음
```
error: "Gemini API 400: models/gemini-2.5-flash-lite is not found for API version v1beta"
```
→ 모델명 오류

### B) 잘못된 파라미터
```
error: "Gemini API 400: Invalid value at 'generationConfig.temperature': ..."
```
→ 파라미터 문제

### C) Contents 구조 오류
```
error: "Gemini API 400: Invalid value at 'contents[0]': ..."
```
→ contents 구조 문제

### D) API 키 문제
```
error: "Gemini API 403: API key not valid"
```
→ 환경 변수 확인

---

## 🎯 다음 단계

**테스트 후 F12 콘솔의 `errorData.error` 값을 알려주세요!**

예시:
```
error: "Gemini API 400: [정확한 메시지]"
```

이 메시지로 정확한 원인을 파악하고 즉시 수정하겠습니다!

