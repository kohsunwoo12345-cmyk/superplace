# Python Worker 배포 가이드

## ✅ 완료된 작업

### 1. Pages API 구현
- `/api/homework/grade` 엔드포인트 생성
- Python Worker와 연동하는 완전한 시스템 구축
- 학생 숙제 제출 → Worker 요청 → 결과 저장 전체 플로우 구현

### 2. Python Worker 코드 작성
- `python-worker/worker.py`: 완전한 채점 시스템
- OCR, RAG, 과목별 처리, 최종 채점 모두 구현

## 🚀 Python Worker 배포 방법

### 옵션 1: Wrangler CLI 사용 (권장)

```bash
# 1. python-worker 디렉토리로 이동
cd /home/user/webapp/python-worker

# 2. Wrangler 로그인 (이미 로그인되어 있다면 스킵)
wrangler login

# 3. 환경 변수 설정
wrangler secret put GEMINI_API_KEY
# 입력 프롬프트에서 Gemini API 키를 입력하세요

# 4. Worker 배포
wrangler deploy

# 5. 배포 확인
curl https://physonsuperplacestudy.kohsunwoo12345.workers.dev/
```

### 옵션 2: Cloudflare Dashboard 사용

1. **Cloudflare Dashboard 접속**
   - https://dash.cloudflare.com/
   - Workers & Pages 섹션으로 이동

2. **새 Worker 생성**
   - "Create Application" 클릭
   - "Create Worker" 선택
   - 이름: `physonsuperplacestudy`

3. **코드 업로드**
   - `python-worker/worker.py` 내용을 복사
   - Quick Edit에 붙여넣기
   - "Save and Deploy" 클릭

4. **환경 변수 설정**
   - Settings 탭 → Variables
   - "Add variable" 클릭
   - Name: `GEMINI_API_KEY`
   - Value: Gemini API 키
   - Type: Secret (암호화)
   - "Save" 클릭

5. **Vectorize 바인딩 (선택사항, RAG 사용 시)**
   - Settings 탭 → Bindings
   - "Add binding" 클릭
   - Type: Vectorize Index
   - Variable name: `VECTORIZE`
   - Index name: `homework-knowledge-base`

### 옵션 3: API로 직접 배포

```bash
# Worker 스크립트 업로드
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/physonsuperplacestudy" \
  -H "Authorization: Bearer gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u" \
  -H "Content-Type: application/javascript" \
  --data-binary @python-worker/worker.py

# 환경 변수 설정
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/workers/scripts/physonsuperplacestudy/settings" \
  -H "Authorization: Bearer gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "bindings": [{
        "type": "secret_text",
        "name": "GEMINI_API_KEY",
        "text": "YOUR_GEMINI_API_KEY"
      }]
    }
  }'
```

## 🧪 테스트 방법

### 1. Worker 직접 테스트

```bash
curl -X POST https://physonsuperplacestudy.kohsunwoo12345.workers.dev/grade \
  -H "Content-Type: application/json" \
  -H "X-API-Key: gvZFnhFMNNfLesIhj_-WfDO84SqSnAYWDnzp6q6u" \
  -d '{
    "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRg..."],
    "userId": 1,
    "userName": "테스트 학생",
    "systemPrompt": "숙제를 채점해주세요",
    "model": "gemini-2.5-flash",
    "temperature": 0.3,
    "enableRAG": false
  }'
```

### 2. Pages API를 통한 테스트

```bash
curl -X POST https://superplacestudy.pages.dev/api/homework/grade \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "images": ["data:image/jpeg;base64,/9j/4AAQSkZJRg..."]
  }'
```

## 📋 필요한 환경 변수

| 변수명 | 필수 여부 | 설명 |
|--------|----------|------|
| `GEMINI_API_KEY` | ✅ 필수 | Gemini API 키 (OCR 및 최종 채점용) |
| `DEEPSEEK_API_KEY` | ⬜ 선택 | DeepSeek API 키 (향후 OCR 개선용) |

## 🔧 Vectorize 설정 (RAG 기능용)

```bash
# 1. Vectorize 인덱스 생성
wrangler vectorize create homework-knowledge-base \
  --dimensions=768 \
  --metric=cosine

# 2. 지식 베이스 업로드 (예시)
# 학원 자료를 벡터로 변환하여 업로드
```

## ✅ 배포 확인 체크리스트

- [ ] Worker가 `https://physonsuperplacestudy.kohsunwoo12345.workers.dev`에 배포됨
- [ ] `GEMINI_API_KEY` 환경 변수 설정됨
- [ ] API 키 검증 작동 확인 (X-API-Key 헤더)
- [ ] OCR 기능 테스트 완료
- [ ] 채점 결과 JSON 형식 반환 확인
- [ ] Pages `/api/homework/grade` 엔드포인트 연동 확인

## 🐛 문제 해결

### Worker가 응답하지 않는 경우
1. Dashboard에서 Worker 로그 확인
2. `wrangler tail` 명령으로 실시간 로그 보기
3. GEMINI_API_KEY가 올바르게 설정되었는지 확인

### OCR이 작동하지 않는 경우
1. 이미지가 Base64로 올바르게 인코딩되었는지 확인
2. Gemini API 키 할당량 확인
3. 이미지 크기 확인 (권장: 4MB 이하)

### RAG 검색이 작동하지 않는 경우
1. Vectorize 바인딩이 올바르게 설정되었는지 확인
2. 인덱스에 데이터가 업로드되었는지 확인
3. academyId가 올바르게 전달되는지 확인

## 📚 추가 참고 자료

- [Cloudflare Workers 문서](https://developers.cloudflare.com/workers/)
- [Python Workers 가이드](https://developers.cloudflare.com/workers/languages/python/)
- [Vectorize 문서](https://developers.cloudflare.com/vectorize/)
- [Gemini API 문서](https://ai.google.dev/docs)

## 🎉 완료!

Worker가 성공적으로 배포되면:
1. Pages에서 학생이 숙제를 제출
2. Worker가 자동으로 채점
3. 결과가 DB에 저장
4. 학생/선생님이 결과 확인

전체 시스템이 완벽하게 연동됩니다! 🚀
