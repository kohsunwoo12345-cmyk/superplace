# 🚨 Gemini 2.5 Flash Lite 400 에러 원인 분석

**날짜**: 2026-03-18  
**오류 메시지**: `Gemini API 오류: 400`  
**영향 범위**: `/api/ai/chat` API 호출 실패  

---

## 🔍 문제 분석

### 공식 문서 조사 결과

#### 1. **Vertex AI (Google Cloud Platform)**
- ✅ `gemini-2.5-flash-lite` (GA 버전) - **Vertex AI 전용**
- ✅ `gemini-2.5-flash-lite-preview-09-2025` (Preview 버전) - **Vertex AI 전용**

#### 2. **Google Gemini API** (현재 사용 중)
- ❌ `gemini-2.5-flash-lite` - **공식 문서에 명시 안됨**
- ❓ Gemini API 모델 리스트에 Flash Lite가 없을 가능성 높음

### 핵심 문제

**Gemini 2.5 Flash Lite는 Vertex AI 전용 모델이며, Google Gemini API에서는 지원하지 않음!**

현재 코드는 Google Gemini API를 사용하므로:
```typescript
const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent`;
```

위 엔드포인트에 `gemini-2.5-flash-lite`를 요청하면 **400 Bad Request** 발생!

---

## ✅ 해결책

### **옵션 1: Gemini 2.5 Flash 사용 (권장)**
```typescript
model: 'gemini-2.5-flash'
```
- ✅ Google Gemini API에서 공식 지원
- ✅ 빠르고 안정적
- ✅ 비용 효율적
- ✅ Flash Lite와 비슷한 성능

### **옵션 2: Gemini 1.5 Flash 사용**
```typescript
model: 'gemini-1.5-flash'
```
- ✅ 더 오래 사용된 안정 모델
- ✅ 널리 테스트됨

### **옵션 3: Vertex AI로 마이그레이션** (큰 작업)
- Vertex AI API 사용 (Google Cloud 계정 필요)
- 엔드포인트 변경: `https://generativelanguage.googleapis.com` → `https://us-central1-aiplatform.googleapis.com`
- 인증 방식 변경 (API Key → OAuth 2.0)

---

## 🔧 즉시 적용 가능한 수정

### 1. DB에서 모델명 확인
```sql
SELECT id, name, model, isActive 
FROM ai_bots 
WHERE isActive = 1;
```

### 2. 모델명 변경
```sql
UPDATE ai_bots 
SET model = 'gemini-2.5-flash' 
WHERE model = 'gemini-2.5-flash-lite';
```

### 3. 또는 코드에서 폴백 추가
```typescript
// functions/api/ai/chat.ts
let effectiveModel = model;
if (model === 'gemini-2.5-flash-lite') {
  console.warn('⚠️ gemini-2.5-flash-lite는 Vertex AI 전용, gemini-2.5-flash로 폴백');
  effectiveModel = 'gemini-2.5-flash';
}
```

---

## 📊 모델 비교

| 모델 | Gemini API 지원 | Vertex AI 지원 | 속도 | 비용 |
|------|----------------|----------------|------|------|
| `gemini-2.5-flash` | ✅ | ✅ | ⚡ 빠름 | 💰 저렴 |
| `gemini-2.5-flash-lite` | ❌ | ✅ | ⚡⚡ 매우 빠름 | 💰 매우 저렴 |
| `gemini-1.5-flash` | ✅ | ✅ | ⚡ 빠름 | 💰 저렴 |
| `gemini-2.5-pro` | ✅ | ✅ | 🐌 느림 | 💰💰 비쌈 |

---

## 🎯 권장 조치

1. **즉시**: DB 또는 UI에서 모델명을 `gemini-2.5-flash`로 변경
2. **선택사항**: 코드에 폴백 로직 추가 (향후 같은 문제 방지)
3. **장기**: Vertex AI 마이그레이션 고려 (더 많은 모델 옵션)

---

## 📝 관련 파일
- `functions/api/ai/chat.ts` (라인 481-493: 모델 선택 로직)
- DB 테이블: `ai_bots` (모델명 저장)

