# 배포 후 테스트 체크리스트

## 🚀 배포 상태
- Commit: bd33d824
- 주요 수정: homework_gradings_v2 컬럼명 불일치 수정
- 배포 예상 완료: 2-5분 후

## ✅ 수정 사항

### 1. 컬럼명 불일치 해결
**문제:** results.js가 존재하지 않는 컬럼 조회
- `hg.feedback` → 실제: `hg.overallFeedback`
- `hg.suggestions` → 실제: `hg.improvements`  
- `hg.detailedAnalysis` → 실제: `hg.detailedResults`
- `hg.completion`, `hg.effort`, `hg.pageCount` → 존재하지 않음

**해결:** SELECT 쿼리와 포맷팅 수정

### 2. 학생 상세 페이지 숙제 기록
**문제:** userId 필터가 적용되지 않음
**해결:** WHERE 절에 userFilter 추가

### 3. 중복 채점 제거
**문제:** attendance-verify에서 process-grading 중복 호출
**해결:** 중복 호출 제거, submit의 백그라운드 채점만 사용

## 🧪 테스트 절차

### 1단계: 숙제 제출
1. https://superplacestudy.pages.dev/attendance-verify/ 접속
2. 코드 `402246` 입력
3. 숙제 사진 촬영/업로드
4. 제출 버튼 클릭
5. **기대 결과:** "제출이 완료되었습니다" 메시지

### 2단계: 10-20초 대기
- 백그라운드에서 Python Worker가 채점 진행 중

### 3단계: 결과 확인
1. https://superplacestudy.pages.dev/dashboard/homework/results/ 접속
2. **확인 사항:**
   - [ ] 제출한 숙제가 표시되는가?
   - [ ] 점수가 0점이 아닌가?
   - [ ] 결과가 1개만 나오는가? (2개 X)
   - [ ] 문제별 정답/오답 그리드가 표시되는가?
   - [ ] 종합 평가와 개선할 점이 표시되는가?

### 4단계: 학생 상세 페이지
1. https://superplacestudy.pages.dev/dashboard/students 접속
2. 해당 학생 클릭 (코드 402246)
3. "숙제 기록" 탭 클릭
4. **확인 사항:**
   - [ ] 숙제 기록이 표시되는가?
   - [ ] 점수, 과목, 문제 분석이 나오는가?
   - [ ] 다른 학생을 클릭하면 다른 기록이 나오는가?

## ⚠️ 알려진 이슈

### Python Worker Unauthorized 문제
**현상:** 
- Python Worker가 401 Unauthorized 반환
- API 키: `xL-fXyCJpmj-gupSAYr12YDIZ6Xy1lXUOUmihLMb` 사용 중

**가능한 원인:**
1. Python Worker의 환경 변수에 저장된 API 키가 다름
2. Worker 코드에서 다른 키를 기대함
3. API 키 포맷이 다름 (헤더 이름 등)

**해결 방법:**
- Python Worker의 wrangler.toml 또는 환경 변수 확인 필요
- Worker 코드의 API 키 검증 로직 확인

### 0점 문제
**가능한 원인:**
1. Python Worker가 Unauthorized로 실패
2. OCR이 이미지에서 문제를 인식 못함
3. 채점 로직 오류

**확인 필요:**
- Cloudflare Pages 로그에서 Worker 응답 확인
- Python Worker 로그 확인

## 📊 예상 결과

### 정상 동작 시:
```
제출 → /api/homework/submit → waitUntil(/api/homework/grade) 
→ Python Worker → homework_gradings_v2 저장 
→ 10-20초 후 결과 페이지에 표시
```

### 데이터 흐름:
```
homework_submissions_v2 (제출 기록)
         ↓
homework_gradings_v2 (채점 결과)
         ↓
/api/homework/results (조회)
         ↓
UI 표시
```

## 🔧 디버깅

### Cloudflare Pages 로그 확인:
1. Cloudflare 대시보드 접속
2. Pages → superplace → Functions 로그
3. `/api/homework/grade` 호출 로그 확인
4. Worker 응답 JSON 확인

### Python Worker 로그 확인:
1. Workers → physonsuperplacestudy-production
2. Logs & Analytics
3. 채점 요청 및 응답 확인

