# Python Worker 숙제 채점 시스템

이 Worker는 학생 숙제를 자동으로 채점하는 Python Worker입니다.

## 배포 방법

### 1. Wrangler 사용 (권장)

```bash
cd python-worker
wrangler deploy
```

### 2. 환경 변수 설정

Cloudflare Dashboard에서 환경 변수를 설정하세요:

- `GEMINI_API_KEY`: Gemini API 키
- `DEEPSEEK_API_KEY`: DeepSeek API 키 (선택사항)

```bash
# 환경 변수 설정
wrangler secret put GEMINI_API_KEY
wrangler secret put DEEPSEEK_API_KEY
```

### 3. Vectorize 바인딩 생성

```bash
# Vectorize 인덱스 생성
wrangler vectorize create homework-knowledge-base \
  --dimensions=768 \
  --metric=cosine

# wrangler.toml에 바인딩이 이미 설정되어 있습니다
```

## 테스트

```bash
# 로컬 테스트
wrangler dev

# 배포 후 테스트
curl -X POST https://physonsuperplacestudy.kohsunwoo12345.workers.dev/grade \
  -H "Content-Type: application/json" \
  -H "X-API-Key: gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u" \
  -d '{
    "images": ["base64_encoded_image"],
    "userId": 123,
    "userName": "테스트 학생",
    "systemPrompt": "숙제를 채점해주세요",
    "model": "gemini-2.5-flash",
    "temperature": 0.3,
    "enableRAG": false
  }'
```

## 기능

### 1. OCR (이미지 → 텍스트)
- Gemini Vision API 사용
- 수학 수식, 손글씨 모두 인식

### 2. RAG 검색
- Vectorize DB에서 학원 자료 검색
- academyId별로 분리된 지식 베이스

### 3. 과목별 처리
- **수학**: Python으로 수식 계산 검증
- **영어**: 문법 규칙 적용
- **기타**: 일반 텍스트 분석

### 4. 최종 채점
- Gemini API로 종합 채점
- JSON 형식 결과 반환

## 응답 형식

```json
{
  "success": true,
  "results": [
    {
      "imageIndex": 0,
      "ocrText": "문제 텍스트...",
      "subject": "math",
      "calculation": {...},
      "ragContext": ["관련 자료1", "관련 자료2"],
      "grading": {
        "totalQuestions": 5,
        "correctAnswers": 4,
        "detailedResults": [...],
        "overallFeedback": "전체 피드백",
        "strengths": "잘한 점",
        "improvements": "개선할 점"
      }
    }
  ]
}
```

## 주의사항

1. API 키는 반드시 Secrets로 관리하세요
2. 이미지는 Base64로 인코딩하여 전송하세요
3. X-API-Key 헤더를 포함하세요
4. CORS가 허용되어 있습니다

## 업그레이드 계획

- [ ] SymPy 통합 (정확한 수학 계산)
- [ ] DeepSeek OCR 통합
- [ ] 다중 언어 지원
- [ ] 캐싱 최적화
