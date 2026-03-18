# 🚨 Cloudflare Functions 로그 확인 필수!

**현재 상황**: `error: "Gemini API 오류: 400"`  
**필요**: Cloudflare Functions 로그의 정확한 에러 메시지  

---

## 📋 Cloudflare 로그 확인 방법

### 1. 접속
https://dash.cloudflare.com

### 2. 경로
**Pages** → **superplace** → **Functions** 탭 → **Logs** 버튼 클릭

### 3. 찾아야 할 로그 (최근 순)

```
🤖 AI 챗봇 요청 - botId: xxx
✅ 봇 발견: xxx
📊 모델: gemini-2.5-flash-lite (또는 다른 모델)
📚 Gemini 직접 호출 모드
🎯 사용 모델: xxx
🔧 callGeminiDirect 시작
📊 모델: xxx
📊 API 버전: v1beta
📊 topK 제외됨 (Gemini 2.x)
⏳ Gemini API 호출 중...
📡 응답 상태: 400 Bad Request
❌ Gemini API Error (400): {...}
❌ 파싱된 에러: {
  "error": {
    "code": 400,
    "message": "여기가 핵심!",  ← 이 메시지가 정확한 원인!
    "status": "INVALID_ARGUMENT"
  }
}
```

---

## 🎯 복사해야 할 정보

**❌ 파싱된 에러:** 부분 **전체**를 복사해주세요!

특히:
- `error.message` 값
- `error.status` 값
- 전체 JSON 구조

---

## 🔍 예상되는 에러 메시지들

### A) Safety Settings 문제
```json
{
  "error": {
    "message": "Invalid value at 'safety_settings' ...",
    "status": "INVALID_ARGUMENT"
  }
}
```

### B) 잘못된 파라미터
```json
{
  "error": {
    "message": "Invalid value for 'generationConfig.topP' ...",
    "status": "INVALID_ARGUMENT"
  }
}
```

### C) Contents 구조 문제
```json
{
  "error": {
    "message": "Invalid value at 'contents' ...",
    "status": "INVALID_ARGUMENT"
  }
}
```

### D) 모델명 문제
```json
{
  "error": {
    "message": "Model 'gemini-2.5-flash-lite' not found ...",
    "status": "NOT_FOUND"
  }
}
```

---

## ⚡ 긴급 대응

**Cloudflare Functions 로그를 확인할 수 없다면:**

다음 정보를 알려주세요:
1. 어떤 봇을 사용했나요? (봇 이름)
2. 해당 봇의 모델은 무엇인가요? (gemini-2.5-flash-lite?)
3. 지식베이스가 있나요?

이 정보로 추측해서 수정하겠습니다.

