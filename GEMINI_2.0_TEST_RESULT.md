# ⚠️ Gemini 2.0 모델 테스트 결과

## 테스트 날짜
2026-03-09

## 테스트 모델
- gemini-2.0-flash
- gemini-2.0-flash-lite

## ❌ 테스트 결과: 실패

### 문제 상황

Gemini 2.0 모델들은 **Google AI에 의해 deprecated되었으며 새 사용자에게 제공되지 않습니다**.

### API 응답 메시지

```json
{
  "error": {
    "code": 404,
    "message": "This model models/gemini-2.0-flash is no longer available to new users. Please update your code to use a newer model for the latest features and improvements.",
    "status": "NOT_FOUND"
  }
}
```

### 테스트 상세

| 모델 | 봇 생성 | API 호출 | 상태 |
|------|---------|----------|------|
| gemini-2.0-flash | ✅ | ❌ 404 | Deprecated |
| gemini-2.0-flash-lite | ✅ | ❌ 404 | Deprecated |

### 결론

1. **UI에 모델 추가**: ✅ 완료
   - AI 봇 생성 페이지에서 선택 가능
   - AI 봇 편집 페이지에서 선택 가능

2. **봇 생성**: ✅ 성공
   - DB에 봇 저장 완료

3. **API 호출**: ❌ 실패
   - Google AI가 모델을 deprecated함
   - 새 사용자는 사용 불가

## 권장 사항

### 사용 가능한 모델 (2026년 기준)

✅ **추천 모델:**
1. `gemini-2.5-flash` - 최신 2.5 모델, 가장 안정적
2. `gemini-2.5-flash-lite` - 경량화 모델, 빠른 응답
3. `gemini-2.5-pro` - 최고 성능

❌ **사용 불가 (Deprecated):**
- `gemini-2.0-flash` 
- `gemini-2.0-flash-lite`
- `gemini-1.0-*` (이전 버전)

### 조치 사항

Google이 Gemini 2.0 모델을 deprecated했으므로:

1. **UI에서 제거 권장**
   - 사용자가 선택해도 작동하지 않음
   - 혼란을 줄 수 있음

2. **Gemini 2.5 모델 사용 권장**
   - 더 나은 성능
   - 장기 지원 보장
   - 안정적인 API

## 변경 이력

### 커밋 c3e3641b (2026-03-09)
- gemini-2.0-flash 추가
- gemini-2.0-flash-lite 추가

### 커밋 4e5fc48b (2026-03-09)
- API 버전 수정 (v1 사용)

### 테스트 결과
- Bot ID (gemini-2.0-flash): bot-1773085527547-o6r4gdiik
- Bot ID (gemini-2.0-flash-lite): bot-1773085532248-kpxej3311
- **API 호출: 모두 404 오류 (Deprecated)**

## 파일 위치

- `src/app/dashboard/admin/ai-bots/create/page.tsx`
- `src/app/dashboard/admin/ai-bots/edit/page.tsx`
- `functions/api/ai/chat.ts`
- `test-gemini-2.0-models.ts`

## 다음 단계

**옵션 1: UI에서 제거**
```typescript
const GEMINI_MODELS = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash (추천)" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
  // ❌ Deprecated: gemini-2.0-flash, gemini-2.0-flash-lite
];
```

**옵션 2: Deprecated 표시**
```typescript
{ 
  value: "gemini-2.0-flash", 
  label: "Gemini 2.0 Flash (사용 불가)", 
  description: "❌ Google에 의해 deprecated됨",
  disabled: true 
}
```

## 결론

✅ **필드 추가**: 완료  
❌ **API 호출 테스트**: 실패 (Google이 모델을 deprecated함)

Gemini 2.0 모델은 더 이상 사용할 수 없으며,  
**Gemini 2.5 모델 사용을 권장합니다**.
