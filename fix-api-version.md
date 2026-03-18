# 🔍 Gemini API 400 에러 원인 분석 완료

## ✅ 문제 확인
**현재 코드 (functions/api/ai/chat.ts:482-484)**:
```typescript
if (model.includes('1.0') || model.includes('2.0')) {
  apiVersion = 'v1';  // ❌ 문제!
}
```

## 🚨 에러 원인
`gemini-2.0-flash-exp` 모델:
- 현재 로직: `model.includes('2.0')` → `v1` 사용
- **문제**: Gemini 2.0 실험 모델은 `v1beta` API를 사용해야 함
- **결과**: 400 Bad Request 에러

## 📊 모델별 올바른 API 버전

| 모델 | 현재 버전 | 올바른 버전 | 상태 |
|------|-----------|-------------|------|
| gemini-2.5-flash-lite | v1beta | v1beta | ✅ 정상 |
| gemini-2.5-flash | v1beta | v1beta | ✅ 정상 |
| gemini-2.5-pro | v1beta | v1beta | ✅ 정상 |
| gemini-2.0-flash-exp | v1 | v1beta | ❌ 에러! |
| gemini-1.5-flash | v1beta | v1beta | ✅ 정상 |
| gemini-1.5-pro | v1beta | v1beta | ✅ 정상 |
| gemini-1.0-pro | v1 | v1 | ✅ 정상 |

## 🔧 해결 방법
```typescript
// ❌ 현재 (잘못됨)
if (model.includes('1.0') || model.includes('2.0')) {
  apiVersion = 'v1';
}

// ✅ 수정 (올바름)
if (model === 'gemini-1.0-pro' || model === 'gemini-1.0-pro-latest') {
  apiVersion = 'v1';
}
// 나머지는 모두 v1beta
```

## 📝 Google Gemini API 공식 규칙
- **v1beta**: 최신 실험 모델 (2.5, 2.0-exp, 1.5)
- **v1**: 안정 버전 모델 (1.0-pro만)

## 🎯 수정 적용
functions/api/ai/chat.ts 482-484번 라인 수정 필요
