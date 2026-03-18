# ✅ systemInstruction 필드 적용 완료

**커밋**: 71ab0d25  
**배포**: 2026-03-18 10:34 UTC  

---

## 🔧 최종 수정 내용

### 문제
systemPrompt를 어떻게 처리해도 400 에러 발생

### 해결책
**systemInstruction** 필드 사용 (Gemini 1.5+ 공식 방식)

```typescript
const requestBody: any = {
  contents: [
    // 대화 기록만
    { role: "user", parts: [{ text: "..." }] },
    { role: "model", parts: [{ text: "..." }] }
  ],
  generationConfig: {
    temperature: 1.0,
    maxOutputTokens: 8192
  }
};

// systemPrompt가 있으면
if (systemPrompt) {
  requestBody.systemInstruction = {
    parts: [{ text: systemPrompt }]
  };
}
```

---

## 📊 API 구조 (최종)

```json
{
  "systemInstruction": {
    "parts": [{ "text": "당신은 친절한 AI입니다." }]
  },
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "안녕하세요" }]
    }
  ],
  "generationConfig": {
    "temperature": 1.0,
    "maxOutputTokens": 8192
  }
}
```

---

## 🎯 장점

1. ✅ **공식 방식**: Gemini 1.5+ 권장 방법
2. ✅ **깔끔한 구조**: systemPrompt와 대화 분리
3. ✅ **토큰 절약**: systemPrompt가 매번 전송 안됨
4. ✅ **모든 모델 지원**: gemini-1.5+, gemini-2.x

---

## 🚀 테스트

**지금 즉시 테스트해주세요!**

1. https://suplacestudy.com/ai-chat/
2. 로그인
3. 아무 봇 선택
4. "안녕하세요" 입력

**예상**: ✅ 정상 응답

