# Python Worker 숙제 채점 시스템 구현 가이드

## Worker 정보
- **프로젝트 이름**: `physonsuperplacestudy`
- **Workers URL**: `https://physonsuperplacestudy.kohsunwoo12345.workers.dev`
- **API 토큰**: `gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u`

## 엔드포인트
`POST /grade`

## 요청 형식
```json
{
  "images": ["base64_image_1", "base64_image_2"],
  "userId": 123,
  "userName": "김학생",
  "academyId": 1,
  "systemPrompt": "채점 시스템 프롬프트",
  "model": "gemini-2.5-flash",
  "temperature": 0.3,
  "enableRAG": true
}
```

## 처리 프로세스

### 1단계: OCR (DeepSeek v2)
```python
import base64
import requests

def ocr_with_deepseek(image_base64: str, model: str) -> str:
    """
    DeepSeek API를 사용하여 이미지의 텍스트 추출
    - 수학 수식도 정확하게 인식
    - 손글씨도 인식 가능
    """
    # DeepSeek API 호출
    # 모델: model 파라미터에서 받은 값 사용
    # 기본값: deepseek-chat 또는 gemini-2.5-flash
    pass
```

### 2단계: RAG 검색 (Vectorize)
```python
def search_rag(text: str, academy_id: int) -> list[str]:
    """
    Vectorize DB에서 관련 학원 자료 검색
    - 문제 유형 식별
    - 관련 개념 찾기
    - 정답지 검색
    """
    # Cloudflare Vectorize 검색
    # academyId별로 분리된 지식 베이스
    pass
```

### 3단계: 과목별 라우팅
```python
def detect_subject(text: str) -> str:
    """과목 자동 식별: math, english, other"""
    # 키워드 기반 또는 LLM 기반 분류
    pass

def calculate_math(text: str) -> dict:
    """
    수학 문제 계산 (SymPy)
    - 수식 파싱
    - 정답 계산
    - 풀이 과정 생성
    """
    import sympy
    # SymPy로 수학 계산
    # 환각 현상 완벽 차단
    pass

def verify_english(text: str, rag_context: list[str]) -> dict:
    """
    영어 문제 검증
    - 문법 체크
    - RAG에서 찾은 규칙 적용
    """
    # 원장님의 문법 노하우 활용
    pass
```

### 4단계: 최종 LLM 출력
```python
def final_grading(
    ocr_text: str,
    calculation_result: dict,
    rag_context: list[str],
    system_prompt: str,
    model: str,
    temperature: float
) -> dict:
    """
    최종 채점 결과 생성
    - OCR 텍스트
    - 계산 결과 (수학인 경우)
    - RAG 검색 결과
    - 시스템 프롬프트
    를 모두 조합하여 최종 채점
    """
    # Gemini API 호출 (또는 설정된 모델)
    # JSON 형식으로 결과 반환
    pass
```

## 응답 형식
```json
{
  "success": true,
  "results": [
    {
      "imageIndex": 0,
      "ocrText": "1. 2 + 2 = 4\\n2. 3 × 5 = 15",
      "subject": "math",
      "calculation": {
        "problem1": {"answer": 4, "correct": true},
        "problem2": {"answer": 15, "correct": true}
      },
      "ragContext": [
        "초등 수학 덧셈 개념",
        "구구단 3단"
      ],
      "grading": {
        "totalQuestions": 2,
        "correctAnswers": 2,
        "detailedResults": [
          {
            "questionNumber": 1,
            "isCorrect": true,
            "studentAnswer": "4",
            "correctAnswer": "4",
            "explanation": "정확합니다! 2 + 2 = 4는 올바른 답입니다."
          },
          {
            "questionNumber": 2,
            "isCorrect": true,
            "studentAnswer": "15",
            "correctAnswer": "15",
            "explanation": "잘했습니다! 3 × 5 = 15는 정확한 계산입니다."
          }
        ],
        "overallFeedback": "모든 문제를 정확하게 풀었습니다!",
        "strengths": "기본 연산을 정확하게 수행했습니다.",
        "improvements": "계속 연습하면 더 빠르게 풀 수 있을 것입니다."
      }
    }
  ]
}
```

## Python Worker 구현 예시 (worker.py)

```python
from js import Response, fetch
import json
import base64
import asyncio

async def on_fetch(request, env):
    """메인 핸들러"""
    
    # CORS 헤더
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    }
    
    # OPTIONS 요청 처리
    if request.method == 'OPTIONS':
        return Response.new('', status=204, headers=headers)
    
    # API 키 검증
    api_key = request.headers.get('X-API-Key')
    if api_key != 'gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u':
        return Response.json({'error': 'Unauthorized'}, status=401, headers=headers)
    
    try:
        # 요청 파싱
        body = await request.json()
        images = body.get('images', [])
        user_id = body.get('userId')
        system_prompt = body.get('systemPrompt', '')
        model = body.get('model', 'gemini-2.5-flash')
        temperature = body.get('temperature', 0.3)
        enable_rag = body.get('enableRAG', False)
        academy_id = body.get('academyId')
        
        results = []
        
        # 각 이미지 처리
        for idx, image_base64 in enumerate(images):
            # 1. OCR with DeepSeek
            ocr_text = await ocr_with_deepseek(image_base64, model)
            
            # 2. RAG 검색 (활성화된 경우)
            rag_context = []
            if enable_rag and academy_id:
                rag_context = await search_rag(ocr_text, academy_id, env)
            
            # 3. 과목 감지
            subject = detect_subject(ocr_text)
            
            # 4. 과목별 처리
            calculation = None
            if subject == 'math':
                calculation = calculate_math(ocr_text)
            
            # 5. 최종 채점
            grading = await final_grading(
                ocr_text=ocr_text,
                calculation_result=calculation,
                rag_context=rag_context,
                system_prompt=system_prompt,
                model=model,
                temperature=temperature
            )
            
            results.append({
                'imageIndex': idx,
                'ocrText': ocr_text,
                'subject': subject,
                'calculation': calculation,
                'ragContext': rag_context,
                'grading': grading,
            })
        
        return Response.json({
            'success': True,
            'results': results
        }, headers=headers)
        
    except Exception as e:
        return Response.json({
            'success': False,
            'error': str(e)
        }, status=500, headers=headers)


# 헬퍼 함수들은 위에 정의된 대로 구현
```

## 배포 방법

```bash
# Worker 배포
wrangler deploy

# 또는 API로 직접 배포
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{account_id}/workers/scripts/physonsuperplacestudy" \
  -H "Authorization: Bearer gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u" \
  --form 'metadata=@metadata.json' \
  --form 'script=@worker.py'
```

## 환경 변수 설정

Worker에 필요한 환경 변수:
- `DEEPSEEK_API_KEY`: DeepSeek API 키
- `GEMINI_API_KEY`: Gemini API 키 (최종 LLM용)
- `VECTORIZE_INDEX`: Vectorize 인덱스 바인딩

## 참고사항

1. **환각 현상 방지**: 수학 문제는 반드시 SymPy로 계산하여 정확성 보장
2. **RAG 활용**: 학원별 맞춤 지식 베이스 활용
3. **과목별 최적화**: 수학/영어 각각 다른 로직 적용
4. **프롬프트 반영**: 관리자가 설정한 시스템 프롬프트 사용
5. **에러 핸들링**: 각 단계에서 에러 발생 시 적절한 응답 반환
