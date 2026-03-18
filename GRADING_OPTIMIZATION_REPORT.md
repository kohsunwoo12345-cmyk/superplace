# 🔧 숙제 채점 시스템 복구 보고서

## 📋 문제 요약

**증상:**
- 숙제 제출 후 채점 결과의 `problemAnalysis`와 `weaknessTypes`가 항상 빈 배열 `[]`
- 개선점, 문제별 채점이 표시되지 않음
- 점수가 75점으로 고정되고 기본값만 표시됨

## 🔍 원인 분석

### 1. Python Worker 오류 (보조 문제)
- **상태**: `Code generation from strings disallowed`
- **원인**: Cloudflare Workers에서 `eval()` 함수 사용 불가
- **영향**: 수학 문제 검증 실패 (선택 기능)
- **해결**: Python Worker는 별도 수정 필요 (필수 아님)

### 2. AI 응답 파싱 실패 (핵심 문제)
- **원인**: AI가 제대로 된 JSON 형식을 반환하지 않음
- **현재 동작**: JSON 파싱 실패 → `createDefaultGradingResult()` 호출 → 빈 배열 반환
- **테스트 이미지**: 1x1 픽셀 투명 PNG → AI가 분석할 내용 없음

### 3. System Prompt 개선 필요
- **이전**: 단순한 지시문 (`"당신은 전문 교사입니다. 제공된 숙제 이미지를 분석하여 채점하세요."`)
- **문제**: AI가 어떤 형식으로 응답해야 하는지 명확하지 않음

## ✅ 적용된 수정 사항

### 1. System Prompt 최적화 (커밋 `fa0cac55`)
```typescript
const defaultSystemPrompt = `당신은 전문 교사입니다. 제공된 숙제 이미지를 분석하여 **반드시 JSON 형식으로만** 채점하세요.

**필수 응답 형식:**
\`\`\`json
{
  "score": 85,
  "subject": "수학",
  "feedback": "전반적으로 잘 완성했습니다.",
  "strengths": "계산 능력이 뛰어남",
  "suggestions": "문제 풀이 과정을 더 자세히 쓰세요",
  "completion": "excellent",
  "totalQuestions": 10,
  "correctAnswers": 8,
  "problemAnalysis": [
    {
      "questionNumber": 1,
      "problem": "2 + 3 = ?",
      "studentAnswer": "5",
      "isCorrect": true,
      "explanation": "정답입니다"
    }
  ],
  "weaknessTypes": ["곱셈 실수", "받아올림 오류"],
  "detailedAnalysis": "전반적으로 기초 계산은 잘하나, 곱셈에서 실수가 있음",
  "studyDirection": "곱셈구구를 복습하세요"
}
\`\`\`

**중요 규칙:**
1. 반드시 위 JSON 형식으로만 응답
2. problemAnalysis 배열에 모든 문제를 포함
3. weaknessTypes에 발견된 실수 유형 나열
4. 추가 설명 없이 JSON만 반환`;
```

**효과:**
- AI에게 명확한 JSON 구조 제시
- `problemAnalysis` 배열 필수 항목 명시
- `weaknessTypes` 배열 형식 명시

### 2. AI 응답 디버깅 로직 추가 (커밋 `80fdbe57`, `f97e9cc9`)
- `ai_response_debug` 테이블 생성
- AI 응답 전체를 DB에 저장
- `/api/homework/ai-debug` 엔드포인트 생성

### 3. 채점 함수 파라미터 수정 (커밋 `f97e9cc9`)
- `submissionId`와 `DB`를 `performGrading()` 함수에 전달
- 디버그 로깅이 실행될 수 있도록 스코프 수정

## 🧪 테스트 결과

### 테스트 환경
- **테스트 이미지**: 1x1 픽셀 투명 PNG (Base64)
- **예상 문제**: AI가 분석할 실제 내용이 없어 기본값 반환

### 실제 테스트 필요
- **실제 숙제 이미지**로 테스트 필요
- **예시**: 수학 문제가 적힌 노트 사진
- **이유**: 1x1 투명 이미지로는 AI가 제대로 분석 불가

## 📊 현재 상태

### ✅ 완료된 작업
1. ✅ System Prompt 최적화 완료
2. ✅ AI 디버그 로깅 시스템 구축
3. ✅ 채점 함수 파라미터 수정
4. ✅ 프론트엔드 표시 로직 확인 (정상)

### ⚠️ 검증 필요
1. ⚠️ **실제 숙제 이미지로 테스트** (필수)
2. ⚠️ AI가 실제로 JSON 형식을 반환하는지 확인
3. ⚠️ `problemAnalysis` 배열이 채워지는지 확인

## 🎯 다음 단계

### Option 1: 실제 숙제 이미지로 테스트
```bash
# 실제 숙제 사진을 Base64로 인코딩
base64 -i homework.jpg -o homework.txt

# API 호출
curl -X POST "https://suplacestudy.com/api/homework-v2/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "01051363624",
    "images": ["data:image/jpeg;base64,<BASE64_DATA>"]
  }'
```

### Option 2: 프로덕션 확인
1. 실제 학생이 숙제 제출
2. `/dashboard/homework/results/` 페이지에서 결과 확인
3. 상세 보기에서 `problemAnalysis`, `weaknessTypes` 확인

### Option 3: AI 응답 직접 확인
```bash
# 제출 후 submissionId 확인
SUBMISSION_ID="homework-xxx"

# AI 디버그 데이터 조회
curl "https://suplacestudy.com/api/homework/ai-debug?submissionId=$SUBMISSION_ID" \
  -H "Authorization: Bearer test-token"
```

## 📌 핵심 개선 사항

### 1. 명확한 JSON 구조 요청
- **이전**: 모호한 지시
- **현재**: 예시 JSON 포함 명확한 형식 지정

### 2. 필수 필드 명시
- `problemAnalysis`: 각 문제별 분석 배열
- `weaknessTypes`: 실수 유형 배열
- `detailedAnalysis`: 상세 분석 텍스트
- `studyDirection`: 학습 방향 제시

### 3. 프론트엔드 표시 확인
- ✅ 문제별 분석 표시 UI 정상
- ✅ 약점 유형 표시 UI 정상
- ✅ 개선 방법 표시 UI 정상
- ✅ 상세 분석 표시 UI 정상

## 🔗 관련 커밋

1. **fa0cac55**: FIX: optimize system prompt for proper JSON response
2. **80fdbe57**: DEBUG: add AI response logging to diagnose empty problemAnalysis
3. **f97e9cc9**: FIX: pass submissionId and DB to AI grading functions for debug logging

## 📝 추가 권장 사항

### 1. JSON Schema Validation
- AI 응답을 JSON Schema로 검증
- 누락된 필드 자동 채우기

### 2. Fallback 로직 개선
- JSON 파싱 실패 시 텍스트 응답 분석
- 정규식으로 주요 정보 추출

### 3. 테스트 이미지 개선
- 실제 수학 문제 이미지 사용
- 다양한 과목 샘플 준비

---

**최종 상태**: 🟡 System Prompt 최적화 완료, 실제 이미지 테스트 필요

**배포 URL**: https://superplacestudy.pages.dev/dashboard/homework/results/

**마지막 업데이트**: 2026-03-19 05:20 KST
