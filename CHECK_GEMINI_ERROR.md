# 🔍 Gemini API 400 에러 진단

## 현재 상황
- **에러**: `Gemini API 오류: 400`
- **발생 위치**: `/api/ai/chat` (functions/api/ai/chat.ts)
- **증상**: 챗봇이 작동하다가 갑자기 500 에러 발생

## Gemini API 400 에러 가능한 원인

### 1️⃣ 모델명 문제
```typescript
// 486번 라인
apiEndpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;
```

**확인 필요**:
- 사용 중인 모델명이 변경되었거나 deprecated 되었을 가능성
- 예: `gemini-pro` → `gemini-1.5-pro` 등

### 2️⃣ API 요청 본문 문제
```typescript
// 489-525번 라인
requestBody = {
  contents: [{
    parts: [{
      text: enhancedSystemPrompt 
        ? `${enhancedSystemPrompt}\n\n사용자: ${message}`
        : message,
    }],
  }],
  generationConfig: {...},
  safetySettings: [...]
};
```

**가능한 문제**:
- `enhancedSystemPrompt`가 너무 길거나 형식 오류
- `message`에 특수 문자나 잘못된 형식
- `safetySettings`가 잘못된 카테고리

### 3️⃣ API 버전 문제
```typescript
// 481-484번 라인
let apiVersion = 'v1beta';
if (model.includes('1.0') || model.includes('2.0')) {
  apiVersion = 'v1';
}
```

**확인 필요**:
- Gemini API 버전이 변경되었을 가능성
- `v1beta` → `v1` 또는 새로운 버전

### 4️⃣ API 키 문제
```typescript
// 486번 라인
?key=${context.env.GOOGLE_GEMINI_API_KEY}
```

**가능성 낮음** (이전에 작동했다면):
- API 키 만료
- API 키 할당량 초과

## 디버깅 방법

### Cloudflare Pages 로그 확인
1. Cloudflare Dashboard 접속
2. Pages → superplace 프로젝트
3. Functions → Logs 확인
4. 546번 라인 로그 확인:
   ```typescript
   console.error(`${model} API Error:`, errorData);
   ```

### 예상되는 에러 메시지 패턴
```json
// 모델명 오류
{
  "error": {
    "code": 400,
    "message": "Invalid model name: gemini-pro",
    "status": "INVALID_ARGUMENT"
  }
}

// 요청 본문 오류
{
  "error": {
    "code": 400,
    "message": "Invalid request body",
    "status": "INVALID_ARGUMENT"
  }
}

// Safety Settings 오류
{
  "error": {
    "code": 400,
    "message": "Invalid safety settings category",
    "status": "INVALID_ARGUMENT"
  }
}
```

## 임시 해결 방법

### 1. 에러 로깅 강화
544-557번 라인 수정:
```typescript
if (!apiResponse.ok) {
  const errorData = await apiResponse.text();
  console.error(`❌ ${model} API Error (${apiResponse.status}):`, errorData);
  console.error(`📝 Request body:`, JSON.stringify(requestBody, null, 2));
  console.error(`🔗 Endpoint:`, apiEndpoint);
  
  return new Response(
    JSON.stringify({
      success: false,
      message: '오류가 발생했습니다',
      error: `Gemini API 오류: ${apiResponse.status}`,
      details: errorData  // 상세 에러 추가
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}
```

### 2. 모델명 확인
DB에서 실제 사용 중인 모델 확인:
```sql
SELECT DISTINCT model FROM ai_bots WHERE isActive = 1;
```

### 3. Fallback 모델 추가
Gemini API 실패 시 다른 모델로 전환

## 다음 단계
1. ✅ Cloudflare Functions 로그 확인
2. ✅ 실제 Gemini API 에러 메시지 확인
3. ✅ 모델명 확인
4. ⚠️ 필요시 코드 수정

---
**우선 Cloudflare Logs에서 정확한 에러 메시지를 확인해주세요!**
