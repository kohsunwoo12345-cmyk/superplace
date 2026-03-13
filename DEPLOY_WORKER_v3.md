# Worker v3.0 배포 가이드 (Full Gemini Workflow)

## 🔧 새로운 워크플로우

```
이미지 업로드
    ↓
Step 1: Gemini 2.5 Flash Lite
    - 이미지 OCR 및 텍스트 추출
    - 문제 유형 및 과목 판별
    - 문제와 학생 답안 분리
    ↓
Step 2: Python 실행 (선택적)
    - 복잡한 계산 문제 처리
    - RAG 데이터 참조
    ↓
Step 3: Gemini 2.5 Flash Lite
    - 최종 채점
    - 상세 피드백 생성
    - JSON 형식 결과 반환
```

## 📦 배포 방법

### 방법 1: Cloudflare Dashboard (권장)

1. **Dashboard 접속**
   https://dash.cloudflare.com/117379ce5c9d9af026b16c9cf21b10d5/workers-and-pages

2. **Worker 선택**
   - "physonsuperplacestudy" 클릭

3. **코드 업데이트**
   - "Quick edit" 클릭
   - `/home/user/python_worker/worker_script_v3.js` 파일 내용 복사
   - 에디터에 붙여넣기
   - "Save and Deploy" 클릭

4. **환경 변수 확인**
   - Settings → Variables → Environment Variables
   - `GOOGLE_GEMINI_API_KEY`가 설정되어 있는지 확인
   - 없으면 추가:
     - Variable name: `GOOGLE_GEMINI_API_KEY`
     - Value: (귀하의 Gemini API 키)
     - Type: Secret (암호화)

### 방법 2: wrangler CLI

```bash
cd /home/user/python_worker

# Cloudflare 로그인
wrangler login

# 배포
wrangler deploy --config wrangler.toml

# 또는 직접 지정
wrangler deploy worker_script_v3.js --name physonsuperplacestudy
```

## 🧪 배포 후 테스트

### 1. Health Check
```bash
curl https://physonsuperplacestudy.kohsunwoo12345.workers.dev/
```

**예상 응답**:
```json
{
  "status": "ok",
  "message": "숙제 채점 Worker v3.0 (Full Gemini Workflow)",
  "version": "3.0.0-GEMINI-FULL",
  "model": "gemini-2.5-flash-lite",
  "workflow": "Gemini → Python (optional) → Gemini",
  "timestamp": "2026-03-13T22:10:00.000Z"
}
```

### 2. 실제 이미지 테스트

저장된 테스트 스크립트 실행:
```bash
cd /home/user/python_worker
./test_real_image.sh
```

또는 수동 테스트:
```bash
# 실제 제출된 숙제 이미지로 테스트
curl -X POST https://physonsuperplacestudy.kohsunwoo12345.workers.dev/grade \
  -H "Content-Type: application/json" \
  -H "X-API-Key: gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u" \
  -d '{
    "userId": 1771491306,
    "images": ["<base64_image_data>"]
  }' | jq '.'
```

## ✅ 확인 사항

### 성공한 경우:
```json
{
  "success": true,
  "results": [
    {
      "imageIndex": 0,
      "success": true,
      "subject": "math",
      "extractedText": "문제: 1+1=? 답: 2",
      "totalQuestions": 1,
      "grading": {
        "totalQuestions": 1,
        "correctAnswers": 1,
        "score": 100,
        "overallFeedback": "정확하게 풀었습니다!",
        "strengths": "계산이 정확합니다.",
        "improvements": "다음에는 풀이 과정도 써보세요.",
        "detailedResults": [...]
      }
    }
  ]
}
```

### 실패한 경우:
- **API 키 오류**: `GOOGLE_GEMINI_API_KEY` 환경 변수 확인
- **이미지 분석 실패**: Gemini API 할당량 확인
- **채점 오류**: Worker 로그 확인

## 🔍 로그 확인

**Cloudflare Dashboard**:
https://dash.cloudflare.com/117379ce5c9d9af026b16c9cf21b10d5/workers/services/view/physonsuperplacestudy/logs

**정상 로그 예시**:
```
========================================
🎯 새 채점 요청 (userId: 1771491306, 이미지: 1장)
========================================

📷 이미지 1/1 처리 시작

📸 Step 1: Gemini로 이미지 분석 시작
📡 Gemini 응답 상태: 200
📝 Gemini 분석 결과: {"subject":"math","problemType":"계산"...
✅ 분석 완료: math / 3문제 / 127자

ℹ️ Python 실행 불필요

📝 Step 3: Gemini로 최종 채점 시작
📡 Gemini 채점 응답 상태: 200
📄 Gemini 채점 결과: {"totalQuestions":3,"correctAnswers":2...
✅ 채점 완료: 2/3 정답 (67점)

✅ 이미지 1 처리 완료

========================================
✅ 전체 처리 완료: 1개 이미지
========================================
```

## 🎯 주요 개선 사항

| 항목 | v2.5 (이전) | v3.0 (현재) |
|------|-------------|-------------|
| OCR | 단순 텍스트 추출 | 구조화된 분석 (문제/답안 분리) |
| 채점 | 단순 비교 | Gemini가 직접 채점 및 평가 |
| 피드백 | 템플릿 기반 | 맞춤형 상세 피드백 |
| Python | 미사용 | 필요시 실행 (향후 구현) |
| 워크플로우 | 1단계 | 3단계 (분석→실행→채점) |

## 🚨 문제 해결

### 문제 1: 여전히 0점
**원인**: GOOGLE_GEMINI_API_KEY가 설정되지 않음

**해결**:
1. Cloudflare Dashboard → Workers → physonsuperplacestudy
2. Settings → Variables
3. `GOOGLE_GEMINI_API_KEY` 추가 (Secret 타입)

### 문제 2: "이미지 분석 실패"
**원인**: Gemini API 할당량 초과 또는 이미지 형식 문제

**해결**:
1. Gemini API 키 할당량 확인
2. 이미지를 JPEG/PNG Base64 형식으로 전송하는지 확인
3. Worker 로그에서 정확한 오류 메시지 확인

### 문제 3: 느린 응답
**원인**: Gemini API를 2번 호출 (분석 + 채점)

**해결**:
- 정상 동작입니다 (품질을 위해 2단계 처리)
- 일반적으로 5-10초 소요

## 📞 추가 지원

배포 후에도 문제가 지속되면:
1. Worker 로그 캡처
2. 테스트 이미지 예시
3. 받은 오류 메시지
위 정보와 함께 문의해주세요.
