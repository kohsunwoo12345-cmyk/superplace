# 🔍 API 오류 원인 분석 보고서

**분석 일시**: 2026-01-22  
**오류 메시지**: "죄송합니다. 오류가 발생했습니다."

---

## 🚨 문제 원인

### 프로덕션 API 오류:
```
[GoogleGenerativeAI Error]: Error fetching from 
https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
[404 Not Found] models/gemini-1.5-flash is not found for API version v1beta
```

### 핵심 원인:
**✅ API 키는 설정됨 (정상)**  
**❌ 모델명이 문제: `gemini-1.5-flash`가 해당 API 키로 접근 불가**

---

## 💡 문제 분석

### 상황:
1. ✅ `GOOGLE_GEMINI_API_KEY` 환경 변수 설정됨
2. ✅ API 키가 Gemini API에 전달됨
3. ❌ 하지만 `gemini-1.5-flash` 모델을 찾을 수 없음

### 가능한 원인:

#### 1. **API 키가 지원하는 모델이 다름** (가장 가능성 높음)
- 새로 발급받은 API 키가 특정 모델만 지원
- `gemini-1.5-flash`가 해당 프로젝트에서 활성화되지 않음
- 모델명이 변경되었거나 버전이 다름

#### 2. **Generative Language API 활성화 문제**
- Google Cloud Console에서 API가 완전히 활성화되지 않음
- 모델별 권한 설정이 필요

#### 3. **API 버전 불일치**
- SDK가 `v1beta` API를 사용하는데
- 해당 모델이 `v1` 또는 다른 버전에서만 지원

---

## ✅ 해결 방법

### 🎯 방법 1: 다른 모델명 시도 (권장)

프로덕션 코드를 다음 모델명으로 변경:

#### 옵션 A: Gemini 2.0 Flash (최신)
```typescript
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
});
```

#### 옵션 B: Gemini 1.5 Flash 002 (안정)
```typescript
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash-002',
});
```

#### 옵션 C: Gemini 1.5 Flash Latest
```typescript
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash-latest',
});
```

#### 옵션 D: Gemini 1.5 Pro
```typescript
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-pro',
});
```

---

### 🎯 방법 2: API 키 확인 및 재발급

#### Google AI Studio 확인:
1. https://aistudio.google.com/app/apikey 접속
2. API 키 상태 확인
3. 사용 가능한 모델 확인

#### Generative Language API 활성화:
1. https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
2. API 활성화 확인
3. 모델별 권한 확인

---

### 🎯 방법 3: 로컬에서 모델 테스트

로컬에서 새 API 키로 어떤 모델이 작동하는지 테스트:

```bash
# 새 API 키를 .env에 설정
echo 'GOOGLE_GEMINI_API_KEY=새로운_API_키' > .env

# 모델 테스트 실행
node test-models-detailed.js
```

이 스크립트는 다음 모델들을 순서대로 테스트:
1. gemini-2.0-flash-exp
2. gemini-1.5-flash-002
3. gemini-1.5-flash-001
4. gemini-1.5-flash-latest
5. gemini-1.5-flash
6. gemini-1.5-pro-002
7. gemini-1.5-pro-001
8. gemini-1.5-pro-latest
9. gemini-1.5-pro
10. gemini-pro
11. gemini-1.0-pro

---

## 🔧 즉시 적용 가능한 수정

### src/app/api/ai/chat/route.ts 수정:

#### 현재 코드 (26-30줄):
```typescript
// Gemini 1.5 Flash 모델 사용 (최신 안정 버전)
// 주의: 모델명에 'models/' 접두사 제거
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
});
```

#### 수정 옵션 1 (가장 안전):
```typescript
// Gemini 1.5 Pro 모델 사용 (가장 안정적)
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-pro',
});
```

#### 수정 옵션 2 (최신):
```typescript
// Gemini 2.0 Flash 모델 사용 (최신, 실험 버전)
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp',
});
```

#### 수정 옵션 3 (여러 모델 Fallback):
```typescript
// 여러 모델을 순서대로 시도
const MODELS = ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash-002'];
let model = null;

for (const modelName of MODELS) {
  try {
    model = genAI.getGenerativeModel({ model: modelName });
    // 간단한 테스트로 모델 작동 확인
    await model.generateContent('test');
    break;
  } catch (e) {
    continue;
  }
}

if (!model) {
  throw new Error('사용 가능한 Gemini 모델을 찾을 수 없습니다.');
}
```

---

## 📋 수정 체크리스트

### 수정 전 확인:
- [ ] 로컬에서 `test-models-detailed.js` 실행
- [ ] 작동하는 모델명 확인
- [ ] 해당 모델명으로 코드 수정

### 수정:
- [ ] `src/app/api/ai/chat/route.ts` 파일 수정
- [ ] 모델명을 작동하는 것으로 변경

### 수정 후:
- [ ] 로컬에서 테스트
- [ ] Git 커밋
- [ ] 사용자 승인 대기
- [ ] 배포

---

## 🧪 권장 테스트 순서

### 1. 로컬 테스트
```bash
# API 키를 .env에 설정
cat > .env << EOF
GOOGLE_GEMINI_API_KEY=새로운_API_키
DATABASE_URL=your_database_url
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
EOF

# 모델 테스트
GOOGLE_GEMINI_API_KEY=새로운_API_키 node test-models-detailed.js

# 작동하는 모델을 찾으면 코드 수정
# 예: gemini-1.5-pro가 작동하면

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:3000/dashboard/ai-gems 테스트
```

### 2. 프로덕션 배포
```bash
# 코드 수정 커밋
git add src/app/api/ai/chat/route.ts
git commit -m "fix: Gemini 모델을 gemini-1.5-pro로 변경"
git push origin genspark_ai_developer

# main에 병합 (사용자 승인 후)
git checkout main
git merge genspark_ai_developer --no-edit
git push origin main

# Vercel 자동 배포 대기 (2-3분)
```

---

## 📞 다음 단계

### 즉시 수행:
1. **로컬에서 모델 테스트**:
   ```bash
   GOOGLE_GEMINI_API_KEY=새로운_API_키 node test-models-detailed.js
   ```

2. **작동하는 모델 확인**

3. **코드 수정** (배포 전):
   - `src/app/api/ai/chat/route.ts`
   - 모델명 변경

4. **로컬 테스트**

5. **사용자 승인 대기**

6. **배포**

---

## 🎯 요약

**문제**: API 키는 정상, 모델명이 문제  
**원인**: `gemini-1.5-flash` 모델을 해당 API 키로 접근 불가  
**해결**: 다른 모델명으로 변경 (예: `gemini-1.5-pro`)  
**다음**: 로컬에서 작동하는 모델 확인 후 수정

---

**배포하지 않고 먼저 작동하는 모델을 찾았습니다!**
