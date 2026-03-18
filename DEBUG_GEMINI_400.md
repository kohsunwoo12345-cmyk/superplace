# 🔍 Gemini API 400 에러 디버깅 가이드

**날짜**: 2026-03-18  
**커밋**: 8745b378  
**상태**: 🚀 배포 중 (3-5분 소요)  

---

## ✅ 추가된 디버깅 로그

### 1. 요청 정보 로그
```typescript
console.log('📤 API 요청:', {
  endpoint: apiEndpoint.replace(/key=.+/, 'key=[HIDDEN]'),
  model: model,
  messageLength: message.length,
  systemPromptLength: enhancedSystemPrompt?.length || 0,
  temperature,
  maxTokens,
});
```

### 2. 에러 응답 상세 로그
```typescript
console.error('❌ Gemini API Error (status):', errorData);
console.error('📋 Parsed Error:', JSON.stringify(parsedError, null, 2));
```

---

## 🧪 다음 단계 (배포 후 3-5분 대기)

### 1. 테스트 실행
1. **https://suplacestudy.com/ai-chat/** 접속
2. **Gemini 2.5 Flash Lite 봇 선택**
3. **메시지 입력**: "안녕하세요"
4. **F12 콘솔에서 500 에러 확인**

### 2. Cloudflare Pages Functions 로그 확인
1. **Cloudflare Dashboard 접속**: https://dash.cloudflare.com
2. **Pages → superplace → View details → Functions → Logs**
3. **최근 로그에서 다음 정보 확인**:

```
📤 API 요청: {
  endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=[HIDDEN]",
  model: "gemini-2.5-flash-lite",
  messageLength: 12,
  systemPromptLength: 1234,  ← 이 값이 중요!
  temperature: 1,
  maxTokens: 4096
}

❌ gemini-2.5-flash-lite API Error (400): {...}
📋 Parsed Error: {
  "error": {
    "code": 400,
    "message": "...",  ← 정확한 에러 메시지!
    "status": "INVALID_ARGUMENT"
  }
}
```

### 3. 예상되는 에러 원인

#### A) 토큰 제한 초과
```json
{
  "error": {
    "code": 400,
    "message": "Request payload size exceeds the limit: 20000 bytes",
    "status": "INVALID_ARGUMENT"
  }
}
```
**해결책**: `systemPromptLength` 줄이기

#### B) 잘못된 파라미터
```json
{
  "error": {
    "code": 400,
    "message": "Invalid value for 'generationConfig.topK'",
    "status": "INVALID_ARGUMENT"
  }
}
```
**해결책**: topK, topP, temperature 값 조정

#### C) 모델 이름 오류
```json
{
  "error": {
    "code": 400,
    "message": "models/gemini-2.5-flash-lite is not found",
    "status": "NOT_FOUND"
  }
}
```
**해결책**: 모델 이름 확인 또는 변경

#### D) API 키 문제
```json
{
  "error": {
    "code": 400,
    "message": "API key not valid",
    "status": "INVALID_ARGUMENT"
  }
}
```
**해결책**: `GOOGLE_GEMINI_API_KEY` 환경 변수 확인

---

## 📊 로그 수집 후 보고해야 할 정보

**다음 정보를 복사해서 보내주세요**:

1. **📤 API 요청 로그** (전체)
2. **❌ API Error 로그** (전체)
3. **📋 Parsed Error 로그** (전체)

---

## 🎯 현재 상태

✅ 디버깅 로그 추가 완료  
✅ 배포 대기 중 (3-5분)  
⏳ 로그 수집 대기  
⏳ 원인 파악 후 수정  

---

**커밋**: 8745b378  
**배포 시작**: 2026-03-18 09:50 UTC  
**예상 완료**: 2026-03-18 09:53-09:55 UTC  

