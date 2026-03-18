# 🚨 긴급 디버깅 가이드

**현재 상황**: 답변이 여전히 나오지 않음  
**확인 필요**: 실제 에러 메시지 확인  

---

## 🔍 F12 콘솔에서 확인해야 할 정보

### 1. 에러 객체 상세 확인
F12 콘솔에서 다음을 찾아주세요:

```javascript
❌ API 응답 오류: {status: 500, errorData: {...}}
```

이 부분을 **펼쳐서** `errorData` 안의 내용을 확인:

```javascript
errorData: {
  success: false,
  message: "오류가 발생했습니다",
  error: "..." // ← 이 부분이 중요!
  details: {...} // ← 이 부분도 확인!
}
```

### 2. 필요한 정보
다음 정보를 **모두** 복사해서 보내주세요:

1. `errorData.error` 값 (전체)
2. `errorData.details` 값 (있다면 전체)
3. `errorData.message` 값

---

## 🧪 추가 확인 사항

### Cloudflare Functions 로그 확인 (선택)
1. https://dash.cloudflare.com 접속
2. **Pages** → **superplace** → **Functions** → **Logs**
3. 최근 로그에서 다음 확인:
   - `🤖 AI 챗봇 요청` 로그
   - `✅ 봇 발견` 로그
   - `❌ Gemini API Error` 로그 (있다면)
   - `📤 API 요청` 로그 (있다면)

---

## 🔧 예상되는 문제들

### A) Worker RAG 오류
```
Worker RAG 실패, Fallback 모드: ...
```
→ Worker가 실패하고 직접 호출로 전환 (정상)

### B) Gemini API 400 에러
```
Gemini API 오류: 400
```
→ 요청 페이로드 문제

### C) Gemini API 403 에러
```
Gemini API 오류: 403
```
→ API 키 문제 또는 쿼터 초과

### D) Gemini API 429 에러
```
Gemini API 오류: 429
```
→ Rate limit 초과

### E) DB 오류
```
봇을 찾을 수 없습니다
```
→ 봇이 비활성화되었거나 삭제됨

---

## 📋 현재 코드 상태

### functions/api/ai-chat.ts (callGeminiDirect)
```typescript
// API 버전 선택
let apiVersion = 'v1beta';
if (model === 'gemini-1.0-pro' || model === 'gemini-1.0-pro-latest') {
  apiVersion = 'v1';
}

const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;

// generationConfig 동적 생성
const generationConfig: any = {
  temperature: 0.7,
  maxOutputTokens: 2000,
  topP: 0.95
};

// topK는 Gemini 1.x만 지원
if (model.startsWith('gemini-1.')) {
  generationConfig.topK = 40;
}

const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    contents: contents,
    generationConfig: generationConfig
  }),
});

if (!response.ok) {
  const errorText = await response.text();
  console.error(`❌ Gemini API Error (${response.status}):`, errorText);
  throw new Error(`Gemini API 오류: ${response.status}`);
}
```

---

## 🎯 다음 단계

**F12 콘솔의 `errorData` 객체 내용을 모두 복사해서 보내주세요!**

특히:
- `errorData.error`
- `errorData.details` (있다면)
- HTTP 상태 코드 (500)

이 정보가 있어야 정확한 원인을 파악하고 즉시 수정할 수 있습니다.

