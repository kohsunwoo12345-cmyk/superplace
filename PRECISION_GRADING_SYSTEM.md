# 🎯 정밀 숙제 채점 시스템

## 시스템 아키텍처

```
학생 사진 업로드
    ↓
┌─────────────────────────────────────────────┐
│  Step 1: 문제 유형 판별 (Gemini Vision)      │
│  - 객관식 vs 주관식 자동 판별                 │
│  - 신뢰도 점수 계산                           │
└─────────────────────────────────────────────┘
         ↓                    ↓
   [객관식]              [주관식]
         ↓                    ↓
    ┌────────┐          ┌──────────┐
    │  SKIP  │          │ Step 2:  │
    │  OCR   │          │  Gemini  │
    └────────┘          │  Vision  │
         ↓              │   OCR    │
         │              └──────────┘
         │                   ↓
         └─────────┬─────────┘
                   ↓
         ┌──────────────────┐
         │    Step 3:       │
         │  RAG Search      │
         │ (채점 기준 검색)  │
         │ Cloudflare AI +  │
         │    Vectorize     │
         └──────────────────┘
                   ↓
         ┌──────────────────┐
         │    Step 4:       │
         │  수학 판별       │
         └──────────────────┘
                   ↓
              [수학?]
         ┌──────┴──────┐
      [YES]          [NO]
         ↓              ↓
    ┌─────────┐    ┌────────┐
    │ Gemini  │    │  직접  │
    │  Code   │    │  LLM   │
    │Execution│    │  채점  │
    │ Python  │    └────────┘
    │ SymPy   │         ↓
    └─────────┘         │
         ↓              │
         └──────┬───────┘
                ↓
         ┌──────────────┐
         │   Step 5:    │
         │ Gemini LLM   │
         │    채점      │
         └──────────────┘
                ↓
         ┌──────────────┐
         │ JSON Output  │
         │  (채점 결과)  │
         └──────────────┘
```

## 주요 기능

### 1. 객관식/주관식 자동 판별 ✅
**함수**: `detectQuestionType(imageUrl, geminiApiKey)`

**특징**:
- Gemini Vision으로 이미지 분석
- 객관식 문제 특징: ①②③④, 1)2)3)4), "다음 중" 등
- 주관식 문제 특징: 빈칸, 서술형, 계산 과정
- 신뢰도 점수 (0.0~1.0) 반환

**출력**:
```json
{
  "isMultipleChoice": true/false,
  "confidence": 0.95,
  "reason": "판별 근거"
}
```

### 2. Google Gemini Vision OCR ✅
**함수**: `performOCR(imageUrl, geminiApiKey)`

**특징**:
- **주관식 문제만** OCR 수행
- 객관식은 OCR 생략 (성능 최적화)
- 수식 기호 정확 추출: ×, ÷, +, -, =, ≠, ≤, ≥
- 분수, 위첨자/아래첨자 지원: x², H₂O
- 특수 문자 지원: √, π, ∑, ∫

**출력**: 
```
"1번. 2 × 3 = 6\n2번. 18 ÷ 5 = 3\n3번. x² + 2x - 3 = 0"
```

### 3. RAG 채점 기준 검색 ✅
**함수**: `searchGradingCriteria(ocrText, subject, env)`

**특징**:
- Cloudflare Workers AI (@cf/baai/bge-m3) 임베딩
- Vectorize 벡터 검색 (topK=3)
- `homework_grading_knowledge` 필터
- DB 설정에서 RAG 활성화 여부 확인

**출력**:
```
【참고 자료 (채점 기준)】

1. 수학 3학년: 곱셈 정답 - 2×3=6, 5×7=35...
2. 나눗셈 나머지 처리: 18÷5 = 3...3 (몫 3, 나머지 3)
3. 문장제 풀이: 사과 5개를 3명이 나눠먹으면 한 명당 1개씩...
```

### 4. Python SymPy 계산 (수학만) ✅
**함수**: `calculateWithPython(equation, geminiApiKey)`

**특징**:
- **Gemini Code Execution** 사용 (Python 실제 실행)
- SymPy 라이브러리로 정확한 수학 계산
- 방정식 풀이, 미분, 적분, 인수분해 등 지원
- Fallback: 간단한 사칙연산은 JS로 처리

**지원 기능**:
```python
from sympy import symbols, solve, simplify, factor, expand
from sympy import sqrt, pi, E, I, oo
from sympy import sin, cos, tan, log, exp
from sympy import diff, integrate, limit, series
```

**출력**:
```json
{
  "equation": "2x + 3 = 7",
  "result": "[2]",
  "steps": [
    "1. 방정식 정리: 2x + 3 = 7",
    "2. 양변에서 3을 빼기: 2x = 4",
    "3. 양변을 2로 나누기: x = 2"
  ],
  "pythonCode": "from sympy import *\nx = symbols('x')\nsolve(2*x + 3 - 7, x)"
}
```

### 5. Gemini LLM 최종 채점 ✅
**함수**: `gradeWithLLM(...)`

**입력**:
- 원본 이미지
- OCR 텍스트 (주관식만)
- RAG 검색 결과
- 과목 정보
- 수학 여부
- DB 설정 (systemPrompt, model, temperature, maxTokens)

**출력 (JSON)**:
```json
{
  "totalQuestions": 10,
  "correctAnswers": 8,
  "detailedResults": [
    {
      "questionNumber": 1,
      "isCorrect": true,
      "studentAnswer": "6",
      "correctAnswer": "6",
      "explanation": "2×3=6, 정답입니다."
    }
  ],
  "overallFeedback": "전체적인 피드백",
  "strengths": "잘한 점",
  "improvements": "개선할 점"
}
```

## API 엔드포인트

### POST `/api/homework/precision-grading`

**요청**:
```json
{
  "userId": 123,
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  ],
  "subject": "수학"
}
```

**응답**:
```json
{
  "success": true,
  "score": 80,
  "totalQuestions": 10,
  "correctAnswers": 8,
  "detailedResults": [...],
  "feedback": "종합 피드백...",
  "strengths": "강점...",
  "suggestions": "개선 사항...",
  "ocrText": "추출된 텍스트...",
  "pythonCalculations": [
    {
      "equation": "2x + 3 = 7",
      "result": "[2]",
      "steps": [...],
      "pythonCode": "..."
    }
  ]
}
```

## 처리 흐름

### 객관식 문제
```
이미지 → 유형 판별 (객관식) → OCR 생략 → RAG 검색 → LLM 채점 → JSON
```
- **OCR 생략**으로 속도 향상
- 이미지만으로 직접 채점

### 주관식 문제 (일반)
```
이미지 → 유형 판별 (주관식) → OCR → RAG 검색 → LLM 채점 → JSON
```
- OCR로 텍스트 추출
- RAG로 채점 기준 검색
- LLM이 종합 채점

### 주관식 문제 (수학)
```
이미지 → 유형 판별 (주관식) → OCR → 수식 추출 
   → Python SymPy 계산 → RAG 검색 → LLM 채점 (계산 결과 포함) → JSON
```
- OCR로 수식 추출
- **Gemini Code Execution**으로 Python 실행
- SymPy로 정확한 수학 계산
- LLM이 계산 결과를 반영하여 채점

## 성능 최적화

1. **객관식 OCR 생략**: 불필요한 OCR 단계 제거
2. **병렬 처리**: 여러 이미지 순차 처리 (향후 병렬화 가능)
3. **RAG 조건부 실행**: enableRAG 설정 확인 후 실행
4. **Python 계산 제한**: 수학 문제만, 최대 5개 수식
5. **Fallback 메커니즘**: 각 단계별 실패 시 대체 로직

## 기술 스택

- **Cloudflare Pages Functions**: 서버리스 API
- **Cloudflare Workers AI**: @cf/baai/bge-m3 임베딩
- **Cloudflare Vectorize**: 벡터 검색 (1024-dim, cosine)
- **Google Gemini 2.5 Flash**: 
  - Vision (OCR, 이미지 분석)
  - Code Execution (Python SymPy)
  - Text Generation (채점)
- **D1 Database**: 설정 저장 (homework_grading_config)
- **TypeScript**: 타입 안전성

## 환경 변수

- `GOOGLE_GEMINI_API_KEY`: Gemini API 키 (필수)
- `DB`: D1 Database 바인딩 (필수)
- `AI`: Workers AI 바인딩 (RAG용)
- `VECTORIZE`: Vectorize 인덱스 바인딩 (RAG용)

## 설정

### DB 테이블: `homework_grading_config`
```sql
CREATE TABLE homework_grading_config (
  id INTEGER PRIMARY KEY,
  systemPrompt TEXT,
  model TEXT DEFAULT 'gemini-2.5-flash',
  temperature REAL DEFAULT 0.3,
  maxTokens INTEGER DEFAULT 2000,
  topK INTEGER DEFAULT 40,
  topP REAL DEFAULT 0.95,
  enableRAG INTEGER DEFAULT 0,
  knowledgeBase TEXT,
  createdAt TEXT,
  updatedAt TEXT
);
```

### Vectorize 인덱스: `knowledge-base-embeddings`
- **모델**: @cf/baai/bge-m3
- **차원**: 1024
- **메트릭**: cosine
- **필터**: `type: 'homework_grading_knowledge'`

## 사용 예시

```javascript
const response = await fetch('/api/homework/precision-grading', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 123,
    images: [base64Image1, base64Image2],
    subject: '수학'
  })
});

const result = await response.json();
console.log(`점수: ${result.score}점`);
console.log(`OCR: ${result.ocrText}`);
console.log(`Python 계산:`, result.pythonCalculations);
```

## 로그 확인

```
🎯 정밀 채점 시작: 2장의 이미지
📚 과목: 수학

📄 이미지 1/2 처리 중...
🔍 Step 1: 문제 유형 판별 시작...
✅ 문제 유형 판별: 주관식 (신뢰도: 0.95)
📝 Step 2: Google Document AI OCR 실행...
✅ OCR 완료: 150자 추출
🔍 Step 3: RAG 채점 기준 검색...
✅ RAG 검색 완료: 3개 관련 자료 발견
🐍 Python SymPy 계산 요청: 2x + 3 = 7
📝 생성된 Python 코드:
from sympy import *
x = symbols('x')
solve(2*x + 3 - 7, x)
✅ 실행 결과: [2]
🤖 Step 5: Gemini LLM 채점...
✅ LLM 채점 완료: 8/10 정답

✅ 정밀 채점 완료: 80점 (8/10)
```

## 향후 개선 사항

1. ✅ 객관식/주관식 자동 판별
2. ✅ OCR 정확도 향상 (Gemini Vision)
3. ✅ Python SymPy 실제 계산 (Code Execution)
4. ✅ RAG 채점 기준 검색
5. ⏳ 병렬 처리로 성능 개선
6. ⏳ 과목별 특화 프롬프트
7. ⏳ 이미지 전처리 (회전 보정, 노이즈 제거)
8. ⏳ 손글씨 인식 정확도 향상
9. ⏳ 다중 언어 지원 (영어, 중국어 등)
10. ⏳ 실시간 스트리밍 응답

## 파일 구조

```
functions/api/homework/
├── precision-grading.ts    # 정밀 채점 API (NEW)
├── grade.ts                # 기존 채점 API
└── ai-grading.ts           # AI 채점 유틸

test-precision-grading.js   # 테스트 스크립트
PRECISION_GRADING_SYSTEM.md # 문서 (이 파일)
```

## 배포

```bash
# 커밋
git add functions/api/homework/precision-grading.ts
git commit -m "feat: 정밀 숙제 채점 시스템 구현 (OCR → RAG → LLM ↔ Python)"

# 푸시
git push origin main

# Cloudflare Pages 자동 배포 (1-2분)
```

## 테스트

```bash
# 테스트 실행
node test-precision-grading.js

# 또는 curl
curl -X POST https://superplacestudy.pages.dev/api/homework/precision-grading \
  -H "Content-Type: application/json" \
  -d '{"userId":1,"images":["data:image/..."],"subject":"수학"}'
```

---

**작성일**: 2026-03-09  
**작성자**: Claude AI  
**버전**: 1.0.0  
**상태**: ✅ 구현 완료, 테스트 대기
