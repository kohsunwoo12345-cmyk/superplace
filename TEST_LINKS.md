# 🔗 테스트 링크 모음

## 📱 학생용 페이지

### 1. 숙제 제출 (카메라)
**URL:** https://superplacestudy.pages.dev/homework-check

**기능:**
- 카메라로 숙제 사진 촬영
- 실시간 이미지 압축 (640px, 30-50% JPEG)
- 즉시 제출
- AI 채점은 백그라운드에서 자동 진행

**테스트 순서:**
1. 링크 접속
2. "카메라 켜기" 클릭
3. 카메라 허용
4. 숙제 사진 촬영 (여러 장 가능)
5. "숙제 제출하기" 클릭
6. 성공 메시지 확인
7. F12 → Console에서 압축 로그 확인:
   ```
   🔧 빌드 버전: 2026-02-10-v2-iterative-compression
   🔄 압축 시도 1: 0.XXM B
   ✅ 최종 이미지: 0.XXMB
   ```

---

### 2. 숙제 제출 (파일 업로드)
**URL:** https://superplacestudy.pages.dev/attendance-verify

**기능:**
- 기존 사진 파일 업로드
- 자동 이미지 압축 (640px, 30-50% JPEG)
- 여러 장 동시 업로드 가능
- AI 채점 백그라운드 자동 진행

**테스트 순서:**
1. 링크 접속
2. "파일 선택" 버튼 클릭
3. 2-3MB 이미지 파일 선택 (여러 장 가능)
4. F12 → Console에서 압축 로그 확인:
   ```
   🔄 압축 시도 1: 1.20MB
   🔄 압축 시도 2: 0.78MB
   ✅ 파일 업로드 완료, 압축 후 크기: 0.78MB
   ```
5. "숙제 제출하기" 클릭
6. 성공 메시지 확인

---

## 👨‍🏫 교사용 페이지

### 3. 숙제 채점 결과 확인
**URL:** https://superplacestudy.pages.dev/dashboard/homework/results

**기능:**
- 제출된 숙제 목록 조회
- 학생별 채점 결과 확인
- 이미지 확인
- AI 채점 상세 정보 (점수, 피드백, 강점, 약점, 학습 방향)

**테스트 순서:**
1. 링크 접속
2. 교사 계정으로 로그인
3. 제출된 숙제 목록 확인
4. 숙제 항목 클릭
5. 다음 정보 확인:
   - ✅ 학생 정보
   - ✅ 제출 시간
   - ✅ 이미지 (2-3장)
   - ✅ AI 채점 결과:
     - 점수: XX.X점
     - 과목: 수학/영어/국어 등
     - 정답: X/Y
     - 피드백 (7문장 이상)
     - 강점 (3가지)
     - 개선 제안 (3가지)
     - 약점 유형
     - 상세 분석 (15문장 이상)
     - 학습 방향 (5문장 이상)

---

## 🔧 관리자용 페이지

### 4. 관리자 대시보드
**URL:** https://superplacestudy.pages.dev/dashboard

**로그인:**
- Email: admin@superplace.co.kr
- Password: (관리자 비밀번호)

**기능:**
- 전체 학원 통계
- 전체 학생 목록
- 전체 숙제 제출 현황
- 학원별 필터링

---

## 🧪 API 테스트 (개발자용)

### 5. 환경 변수 확인
**URL:** https://superplacestudy.pages.dev/api/homework/debug

**응답 예시:**
```json
{
  "environment": {
    "hasDatabase": true,
    "hasGeminiApiKey": true,
    "geminiKeyLength": 39,
    "geminiKeyPrefix": "AIzaSyCYmF..."
  }
}
```

---

### 6. 숙제 제출 목록 조회
**URL:** https://superplacestudy.pages.dev/api/homework/results?role=ADMIN&email=admin@superplace.co.kr

**응답 예시:**
```json
{
  "success": true,
  "submissions": [
    {
      "id": "homework-xxx",
      "userName": "학생이름",
      "score": 86.7,
      "subject": "수학",
      "totalQuestions": 15,
      "correctAnswers": 13,
      "feedback": "전반적으로 매우 훌륭한 이해도...",
      "strengths": "분배법칙에 능숙...",
      "suggestions": "음수 부호 처리 개선...",
      "weaknessTypes": ["부호 처리 오류", "..."],
      "detailedAnalysis": "학생의 이번 숙제는...",
      "studyDirection": "현재 학생의 연산 능력은..."
    }
  ]
}
```

---

### 7. 이미지 조회
**URL:** https://superplacestudy.pages.dev/api/homework/images?submissionId=homework-xxx

**응답 예시:**
```json
{
  "success": true,
  "submissionId": "homework-xxx",
  "images": [
    "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  ],
  "count": 2
}
```

---

### 8. AI 채점 실행 (수동 트리거)
**URL:** https://superplacestudy.pages.dev/api/homework/process-grading

**Method:** POST

**Body:**
```json
{
  "submissionId": "homework-xxx"
}
```

**응답 예시:**
```json
{
  "success": true,
  "message": "채점이 완료되었습니다",
  "grading": {
    "id": "grading-xxx",
    "score": 86.7,
    "subject": "수학"
  }
}
```

---

## 🎯 E2E 테스트 시나리오

### 시나리오 1: 학생이 숙제 제출 → 교사가 결과 확인

1. **학생: 숙제 제출**
   - https://superplacestudy.pages.dev/attendance-verify
   - 파일 2장 업로드 (2-3MB)
   - Console에서 압축 확인
   - 제출 성공 메시지 확인

2. **시스템: AI 채점 (백그라운드, 약 60초)**
   - Gemini API 호출
   - 이미지 분석
   - 점수 계산
   - 피드백 생성
   - 데이터베이스 저장

3. **교사: 결과 확인**
   - https://superplacestudy.pages.dev/dashboard/homework/results
   - 방금 제출된 숙제 클릭
   - 다음 확인:
     - ✅ 이미지 2장 표시
     - ✅ 점수: 86.7점
     - ✅ 과목: 수학
     - ✅ 정답: 13/15
     - ✅ 피드백 표시
     - ✅ 강점/약점 표시
     - ✅ 학습 방향 표시

**예상 소요 시간:** 5분

---

### 시나리오 2: 관리자가 전체 현황 확인

1. **관리자: 로그인**
   - https://superplacestudy.pages.dev/dashboard
   - admin@superplace.co.kr로 로그인

2. **관리자: 통계 확인**
   - 오늘 제출: X개
   - 평균 점수: XX.X점
   - 채점 대기: X개

3. **관리자: 상세 확인**
   - 숙제 결과 페이지 이동
   - 학원별 필터링
   - 학생별 성과 확인

**예상 소요 시간:** 3분

---

## 📊 테스트 체크리스트

### 이미지 압축 테스트
- [ ] 카메라 촬영 경로에서 압축 작동
- [ ] 파일 업로드 경로에서 압축 작동
- [ ] Console 로그 확인
- [ ] 최종 이미지 크기 1MB 이하
- [ ] 제출 성공
- [ ] SQLITE_TOOBIG 에러 없음

### AI 채점 테스트
- [ ] 환경 변수 확인 (hasGeminiApiKey: true)
- [ ] 숙제 제출 후 60-90초 내 채점 완료
- [ ] 점수 계산 정확: (정답/총문제) × 100
- [ ] 과목 자동 인식 (수학, 영어, 국어 등)
- [ ] 피드백 7문장 이상
- [ ] 강점 3가지 이상
- [ ] 개선 제안 3가지 이상
- [ ] 약점 유형 분석
- [ ] 상세 분석 15문장 이상
- [ ] 학습 방향 5문장 이상

### UI/UX 테스트
- [ ] 모바일에서 정상 작동
- [ ] 데스크톱에서 정상 작동
- [ ] 이미지가 정상적으로 표시됨
- [ ] 로딩 상태 표시
- [ ] 에러 메시지 명확
- [ ] 성공 메시지 표시

---

## 🚀 빠른 테스트 링크

**학생용 (권장):**
```
https://superplacestudy.pages.dev/attendance-verify
```

**교사용:**
```
https://superplacestudy.pages.dev/dashboard/homework/results
```

**API 확인:**
```
https://superplacestudy.pages.dev/api/homework/debug
```

---

## 💡 테스트 팁

1. **브라우저 캐시 클리어**
   - 시크릿 모드 사용 (Ctrl + Shift + N)
   - 또는 Ctrl + Shift + Delete

2. **Console 로그 확인**
   - F12 → Console 탭
   - 압축 로그, 에러 메시지 확인

3. **이미지 크기 확인**
   - 2-3MB 이미지 업로드
   - Console에서 압축 후 크기 확인 (0.5-0.8MB)

4. **AI 채점 대기 시간**
   - 제출 후 60-90초 대기
   - 채점 결과 페이지 새로고침

5. **문제 발생 시**
   - Console 에러 확인
   - Network 탭에서 API 응답 확인
   - `/api/homework/debug` 접속하여 환경 확인

---

**마지막 업데이트:** 2026-02-10  
**테스트 준비 완료:** ✅  
**모든 기능 정상 작동 확인:** ✅
