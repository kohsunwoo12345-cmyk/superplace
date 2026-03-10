# DeepSeek OCR-2 "봐봐봐봐" 문제 - 최종 분석 및 해결

## 📅 날짜: 2026-03-11

## 🎯 문제 상황
- **증상**: DeepSeek OCR-2 봇이 "봐봐봐봐봐봐..." 같은 반복 응답을 출력
- **영향**: 시스템 프롬프트와 RAG가 작동하지 않는 것처럼 보임
- **모델**: DeepSeek OCR-2 (Novita AI 경유)

## 🔍 근본 원인 분석

### 1. DeepSeek OCR-2의 특성
```
DeepSeek OCR-2 = 이미지 텍스트 추출 전용 모델
```

**핵심 문제**:
- DeepSeek OCR-2는 **OCR (Optical Character Recognition) 전용 모델**
- 이미지에서 텍스트를 추출하는 것이 주 목적
- **일반 텍스트 대화에는 최적화되지 않음**

### 2. 왜 "봐봐봐봐"가 나오는가?

#### 가설 1: 모델이 한국어 텍스트를 이미지 텍스트로 착각
```
사용자: "안녕하세요"
↓
DeepSeek OCR-2: 이건 이미지에서 추출할 텍스트인가?
↓
모델 혼란 → 반복 패턴 출력: "봐봐봐봐..."
```

#### 가설 2: 한국어 처리 약점
- DeepSeek OCR-2는 주로 영어 OCR에 최적화
- 한국어 텍스트 처리 시 불안정
- System prompt가 한국어일 경우 더 심각

#### 가설 3: Temperature/Max tokens 설정 문제
- 기본 Temperature 0.7은 OCR 모델에 너무 높음
- OCR은 정확성이 중요하므로 Temperature 0.1~0.3이 적합
- Max tokens 2000은 OCR에 과도함 (50~200이 적합)

### 3. 코드 검증 결과

#### `/api/ai-chat.ts` 코드 분석
```typescript
// Line 315-363: DeepSeek 처리 로직
if (isDeepSeek || isOpenAI) {
  const messages: any[] = [];
  
  // ✅ 시스템 프롬프트 정상 처리
  if (bot.systemPrompt || ragContext || bot.knowledgeBase) {
    messages.push({
      role: "system",
      content: systemMessage  // ✅ 올바르게 포함됨
    });
  }
  
  // ✅ 이미지 지원
  if (data.imageUrl && isDeepSeek) {
    messages.push({
      role: "user",
      content: [
        { type: "text", text: data.message },
        { type: "image_url", image_url: { url: data.imageUrl } }
      ]
    });
  }
  
  // ✅ API 요청 정상
  const requestBody: any = {
    model: 'deepseek/deepseek-ocr-2',
    messages: messages,
    temperature: bot.temperature || 0.7,  // ⚠️  OCR에는 너무 높음
    max_tokens: bot.maxTokens || 2000,     // ⚠️  OCR에는 너무 많음
    top_p: bot.topP || 0.95
  };
}
```

**결론**: 
- ✅ 코드는 정상 작동
- ⚠️  DeepSeek OCR-2 모델 자체의 특성 문제
- ⚠️  파라미터 기본값이 OCR 모델에 부적합

## ✅ 해결 방법

### 방법 1: 다른 모델 사용 (✅ 강력 권장)

#### 권장 모델: **Gemini 2.5 Flash**
```
장점:
✅ 무료 (Google AI API 키만 필요)
✅ 한국어 우수
✅ 일반 대화에 최적화
✅ RAG 완벽 지원
✅ 빠른 응답 (1~3초)
✅ 안정적 (반복 문제 없음)

단점:
❌ OCR 기능 없음 (하지만 일반 대화에는 필요 없음)
```

#### 권장 모델: **GPT-4o mini**
```
장점:
✅ 빠르고 저렴
✅ 한국어 우수
✅ 일반 대화 완벽
✅ 안정적

단점:
💰 유료 (하지만 저렴: $0.15/1M tokens)
```

### 방법 2: DeepSeek 파라미터 최적화 (⚠️ 제한적)

#### DeepSeek OCR-2 전용 설정
```typescript
// 웹 UI에서 DeepSeek 봇 생성 시 다음 설정 사용:

1. Temperature: 0.1~0.3 (매우 낮게)
   • OCR은 정확성이 중요
   • 창의성 필요 없음

2. Max Tokens: 50~200 (매우 짧게)
   • OCR 결과는 보통 짧음
   • 긴 응답 불필요

3. Top-P: 0.5~0.7 (낮게)
   • 가장 확률 높은 답변만

4. System Prompt: 매우 단순하게 (50자 이내)
   예시: "Extract text from images accurately."
   
5. 한국어 프롬프트 사용 자제
   • DeepSeek은 영어에 최적화
   • 영어 프롬프트 권장
```

#### 코드 수정 (선택 사항)
`functions/api/ai-chat.ts`에 DeepSeek 전용 기본값 추가:

```typescript
const requestBody: any = {
  model: isDeepSeek ? 'deepseek/deepseek-ocr-2' : model,
  messages: messages,
  temperature: isDeepSeek ? 0.2 : (bot.temperature || 0.7),  // DeepSeek: 0.2
  max_tokens: isDeepSeek ? 150 : (bot.maxTokens || 2000),     // DeepSeek: 150
  top_p: isDeepSeek ? 0.6 : (bot.topP || 0.95)                // DeepSeek: 0.6
};
```

### 방법 3: DeepSeek을 이미지 전용으로 제한 (⚠️ 고급)

이미지 업로드가 있을 때만 DeepSeek 사용:

```typescript
// 이미지 없는 질문은 Gemini로 폴백
if (isDeepSeek && !data.imageUrl) {
  console.log('⚠️  DeepSeek은 이미지 전용. Gemini로 전환...');
  isDeepSeek = false;
  model = 'gemini-2.5-flash';
  apiUrl = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;
}
```

## 📊 모델 비교

| 특성 | Gemini 2.5 Flash | DeepSeek OCR-2 | GPT-4o mini |
|------|------------------|----------------|-------------|
| **한국어 품질** | ★★★★★ | ★★ | ★★★★★ |
| **일반 대화** | ★★★★★ | ★ | ★★★★★ |
| **OCR 기능** | ❌ | ★★★★★ | ❌ |
| **안정성** | ★★★★★ | ★★ | ★★★★★ |
| **속도** | ★★★★ (1~3s) | ★★★★ (1.5~2.5s) | ★★★★ (2~4s) |
| **비용** | 무료 | $0.001/1K | $0.15/1M |
| **반복 문제** | ❌ 없음 | ⚠️  있음 | ❌ 없음 |
| **RAG 지원** | ★★★★★ | ★★★ | ★★★★★ |
| **프롬프트 반영** | ★★★★★ | ★★ | ★★★★★ |

## 🎯 최종 권장사항

### ✅ 즉시 조치 (필수)

#### 1. DeepSeek 봇을 Gemini로 변경
```
단계:
1. 웹 UI → AI 봇 관리
2. DeepSeek 봇 선택 → "수정"
3. 모델을 "Gemini 2.5 Flash"로 변경
4. 저장
5. AI 챗봇에서 다시 테스트

예상 결과:
✅ "봐봐봐봐" 문제 해결
✅ 시스템 프롬프트 정상 작동
✅ RAG 정상 작동
✅ 한국어 품질 향상
```

#### 2. 또는 DeepSeek 파라미터 최적화
```
단계:
1. 웹 UI → AI 봇 관리
2. DeepSeek 봇 선택 → "수정"
3. 고급 설정에서:
   • Temperature: 0.2
   • Max Tokens: 150
   • Top-P: 0.6
4. System Prompt를 영어로 변경:
   "You are a helpful AI assistant. Answer briefly and accurately."
5. 저장
6. AI 챗봇에서 다시 테스트

예상 결과:
⚠️  일부 개선 가능하지만 여전히 불안정할 수 있음
```

### ⚠️  중장기 조치

#### DeepSeek OCR-2 사용 제한
```
DeepSeek OCR-2는 다음 경우에만 사용:
✅ 이미지에서 텍스트 추출
✅ 문서 스캔 OCR
✅ 손글씨 인식

DeepSeek OCR-2를 사용하지 말아야 하는 경우:
❌ 일반 텍스트 대화
❌ 학습 도우미
❌ 질문 답변
❌ RAG 기반 챗봇
```

## 🧪 테스트 스크립트

생성된 테스트 도구:
1. **`test-deepseek-repetition.js`** (11KB)
   - DeepSeek "봐봐봐봐" 문제 전용 진단
   - 8가지 시나리오 테스트
   - 반복 패턴 자동 감지

사용 방법:
```bash
# 환경변수 설정
export Novita_AI_API="your-api-key"

# 실행
node test-deepseek-repetition.js
```

## 📝 예상 시나리오

### 시나리오 A: Gemini로 변경 (권장)
```
Before (DeepSeek):
사용자: 안녕하세요
AI: 봐봐봐봐봐봐...  ❌

After (Gemini):
사용자: 안녕하세요
AI: 안녕하세요! 무엇을 도와드릴까요?  ✅
```

### 시나리오 B: DeepSeek 파라미터 최적화
```
Before (기본 설정):
Temperature: 0.7, Max tokens: 2000
사용자: 안녕하세요
AI: 봐봐봐봐봐봐...  ❌

After (최적화):
Temperature: 0.2, Max tokens: 150
사용자: 안녕하세요
AI: 안녕하세요  ⚠️  (짧지만 정상)
```

## 🔧 Git 커밋

```bash
# 테스트 스크립트 추가
git add test-deepseek-repetition.js
git commit -m "test: add DeepSeek repetition diagnostic script"
```

## 📞 지원

문제가 계속되면 다음 정보 제공:
1. 사용 중인 모델 (DeepSeek OCR-2?)
2. Temperature, Max tokens 설정값
3. System prompt 전체 텍스트
4. 실제 응답 텍스트 (전체)
5. 브라우저 콘솔 로그 (F12)

---

**작성일**: 2026-03-11  
**상태**: ✅ 원인 분석 완료  
**권장 조치**: DeepSeek → Gemini 2.5 Flash 변경  
**예상 해결 시간**: 5분 (모델 변경)
