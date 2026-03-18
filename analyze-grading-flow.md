# 🔍 채점 흐름 분석

## 현재 구조

### 1. 관리자 설정 페이지
- URL: `https://superplacestudy.pages.dev/dashboard/admin/homework-grading-config/`
- 저장 위치: `homework_grading_config` 테이블 (D1)
- 저장 항목:
  - `systemPrompt`: 프롬프트
  - `model`: AI 모델 (gemini-2.5-flash, deepseek-chat 등)
  - `temperature`, `maxTokens`, `topK`, `topP`
  - `enableRAG`: RAG 활성화 여부
  - `knowledgeBase`: RAG 지식베이스 텍스트

### 2. 실제 채점 API (`/api/homework/process-grading`)
- 설정 불러오기: `SELECT * FROM homework_grading_config ORDER BY id DESC LIMIT 1`
- **실제 채점 수행 방식**:
  - Gemini 모델: Google Gemini API 직접 호출
  - DeepSeek 모델: DeepSeek API 또는 Novita AI API 직접 호출
  - **Python Worker는 수학 문제 검증용으로만 사용 (선택 기능)**

### 3. Python Worker의 역할
- **PYTHON_WORKER_URL_**: `physonsuperplacestudy.kohsunwoo12345.workers.dev`
- **용도**: AI가 채점한 `problemAnalysis` 배열의 수학 문제를 Python으로 재검증
- **호출 시점**: AI 채점 완료 후 (180-192번 줄)
- **현재 상태**: `eval()` 오류로 작동하지 않음

## 🚨 핵심 문제

### 사용자 예상 vs 실제
| 항목 | 사용자 예상 | 실제 동작 |
|------|------------|----------|
| 채점 주체 | Python Workers | Gemini/DeepSeek API |
| Workers 역할 | 전체 채점 | 수학 검증만 (실패 중) |
| 설정 반영 | Workers에서 | process-grading API에서 |

### 실제 문제점
1. **AI가 JSON을 제대로 반환하지 않음** → `problemAnalysis` 빈 배열
2. **테스트 이미지가 1x1 투명 PNG** → AI가 분석할 내용 없음
3. **Python Workers는 채점 주체가 아님** → 부수적 검증만 담당

## ✅ 해결 방안

### Option 1: 현재 구조 유지 (권장)
- Gemini/DeepSeek API로 채점 (현재 방식)
- System Prompt 최적화 완료 ✅
- **실제 숙제 이미지로 테스트 필수**
- Python Worker는 수학 검증으로만 사용 (선택)

### Option 2: Workers로 전체 채점 이관 (대규모 수정 필요)
- `/api/homework/process-grading`에서 Workers 호출
- Workers에서 Gemini/DeepSeek API 호출
- **이점**: 중앙 집중식 로직 관리
- **단점**: 대규모 코드 수정, 타임아웃 위험

## 🎯 즉시 조치 사항

1. **실제 숙제 이미지로 테스트**
2. **관리자 설정이 실제로 반영되는지 확인**
3. **0점이 나온 제출 데이터 조회**
