# 숙제 제출 다중 사진 촬영 및 AI 자동 채점 시스템

> 학생들이 여러 장의 숙제 사진을 촬영하고, AI가 자동으로 채점하여 학원장/선생님에게 학습 분석 보고서를 제공하는 통합 시스템

## 🎯 개요

학생들이 숙제를 여러 장 촬영하여 제출하면, Gemini AI가 자동으로 채점하고 문제별 정답/오답을 판별합니다. 학생이 3번 제출할 때마다 자동으로 학습 분석 보고서가 생성되어 학원장과 선생님에게 제공됩니다.

## ✨ 주요 기능

### 1. 다중 사진 촬영 시스템
- 📸 **연속 촬영**: 카메라로 여러 장을 연속으로 촬영
- 📁 **다중 업로드**: 파일 선택 시 여러 파일 동시 선택
- 🖼️ **미리보기**: 촬영한 모든 사진을 확인 가능
- 🗑️ **삭제 기능**: 원하지 않는 사진 삭제
- 📊 **카운트 표시**: "N번째 촬영", "총 N장" 실시간 표시

### 2. AI 자동 채점 시스템
- 🤖 **Gemini AI 분석**: 각 문제의 정답/오답 자동 판별
- 📝 **OCR 인식**: 문제 텍스트와 학생 답안 정확하게 인식
- ✅ **O/X 표시**: 문제별로 정답(O), 오답(X) 자동 표시
- 💯 **점수 계산**: 전체 문제 수 대비 정답 비율로 점수 산출
- 📋 **상세 피드백**: 잘한 점, 보완할 점, 제안사항 제공

**예시:**
```
문제: 1+1=?
학생 답: 2 → ✅ 정답 (O)
학생 답: 3 → ❌ 오답 (X)
```

### 3. 학습 분석 시스템
- 📊 **유형별 분석**: 덧셈, 뺄셈, 곱셈, 분수, 도형 등 문제 유형 자동 분류
- 📈 **약점 추적**: 학생별로 자주 틀리는 유형 카운팅
- 🎯 **정확도 향상**: 데이터가 쌓일수록 분석 정확도 증가
- 🔄 **실시간 업데이트**: 매 제출마다 약점 데이터 업데이트

### 4. 자동 보고서 생성
- 📄 **3번째 제출 트리거**: 학생이 3번 제출할 때마다 자동 생성
- 🧠 **AI 종합 분석**: Gemini AI가 최근 3회 데이터를 종합 분석
- 👥 **대상**: 학원장과 담당 선생님에게 자동 전달
- 📊 **포함 내용**:
  - 학생의 전반적인 학습 상태
  - 잘하는 부분 (강점)
  - 보완이 필요한 부분 (약점)
  - 구체적인 지도 방안 (3가지)
  - 평균 점수 추이
  - 자주 틀리는 유형 Top 5

### 5. 보고서 조회 시스템
- 📱 **웹 인터페이스**: `/dashboard/reports/student` 페이지
- 🏫 **학원별 조회**: 학원 전체 학생의 보고서 목록
- 👤 **학생별 상세**: 특정 학생의 상세 분석 보고서
- 📅 **시간순 정렬**: 최신 보고서부터 표시
- 🎨 **카드형 UI**: 직관적인 레이아웃

## 📱 사용 방법

### 학생 (숙제 제출)
1. `/attendance-verify` 페이지에서 출석 코드 입력
2. 출석 인증 후 자동으로 숙제 제출 화면 전환
3. **카메라 촬영** 또는 **파일 업로드** 선택
4. 여러 장의 숙제 사진 촬영 (1번째, 2번째, 3번째...)
5. 촬영 완료 후 "숙제 제출 및 채점받기" 버튼 클릭
6. AI가 자동으로 채점하고 결과 표시

### 학원장/선생님 (보고서 확인)
1. `/dashboard/reports/student` 페이지 접속
2. 학원 전체 학생의 보고서 카드 목록 확인
3. 특정 학생 카드 클릭하여 상세 보고서 열람
4. 평균 점수, 약점 유형, AI 분석 결과 확인
5. 지도 방안을 참고하여 맞춤형 교육 제공

## 🗄️ 데이터베이스 구조

### homework_submissions_v2
```sql
CREATE TABLE homework_submissions_v2 (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  code TEXT,
  imageUrl TEXT,  -- 다중 이미지: "N images"
  submittedAt TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'submitted',
  academyId INTEGER
);
```

### homework_gradings_v2 (확장)
```sql
-- 기존 컬럼
id, submissionId, score, feedback, strengths, suggestions, 
subject, completion, effort, pageCount, gradedAt, gradedBy

-- 신규 컬럼
totalQuestions INTEGER,        -- 전체 문제 수
correctAnswers INTEGER,        -- 정답 개수
problemAnalysis TEXT,          -- 문제별 분석 (JSON)
weaknessTypes TEXT            -- 틀린 유형 목록 (JSON)
```

**problemAnalysis 예시:**
```json
[
  {
    "page": 1,
    "problem": "1+1",
    "answer": "2",
    "isCorrect": true,
    "type": "덧셈"
  },
  {
    "page": 1,
    "problem": "2+2",
    "answer": "5",
    "isCorrect": false,
    "type": "덧셈"
  }
]
```

### student_weakness_analysis (신규)
```sql
CREATE TABLE student_weakness_analysis (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  weaknessType TEXT NOT NULL,  -- 예: "덧셈", "뺄셈", "곱셈"
  count INTEGER DEFAULT 1,
  lastUpdated TEXT DEFAULT (datetime('now'))
);
```

### student_reports (신규)
```sql
CREATE TABLE student_reports (
  id TEXT PRIMARY KEY,
  userId INTEGER NOT NULL,
  academyId INTEGER,
  reportType TEXT DEFAULT 'homework_analysis',
  summary TEXT,           -- AI 분석 결과 (JSON)
  weaknesses TEXT,        -- 약점 목록 (JSON)
  suggestions TEXT,       -- 지도 방안
  averageScore REAL,
  createdAt TEXT DEFAULT (datetime('now'))
);
```

## 📡 API 엔드포인트

### POST /api/homework/grade
**요청:**
```json
{
  "userId": 123,
  "code": "123456",
  "images": [
    "data:image/jpeg;base64,...",
    "data:image/jpeg;base64,...",
    "data:image/jpeg;base64,..."
  ]
}
```

**응답:**
```json
{
  "success": true,
  "message": "숙제 제출 및 AI 채점이 완료되었습니다 (3장)",
  "submission": {
    "id": "homework-...",
    "userId": 123,
    "studentName": "홍길동",
    "imageCount": 3,
    "status": "graded"
  },
  "grading": {
    "score": 85,
    "totalQuestions": 10,
    "correctAnswers": 8,
    "feedback": "전반적으로 잘 풀었습니다.",
    "weaknessTypes": ["덧셈"],
    "gradedBy": "Gemini AI"
  },
  "reportGenerated": true,
  "submissionNumber": 3
}
```

### GET /api/reports/student
**요청 (학생별):**
```
GET /api/reports/student?userId=123
```

**요청 (학원별):**
```
GET /api/reports/student?academyId=1
```

**응답:**
```json
{
  "success": true,
  "reports": [
    {
      "id": "report-...",
      "userId": 123,
      "studentName": "홍길동",
      "averageScore": 82.5,
      "createdAt": "2026-02-08T...",
      "summary": {
        "summary": "전반적으로 우수한 성적...",
        "strengths": "문제 풀이가 빠르고 정확함",
        "weaknesses": "덧셈 연산에서 실수가 많음",
        "suggestions": "1. 덧셈 연습 문제 추가..."
      },
      "weaknesses": [
        {"weaknessType": "덧셈", "count": 3},
        {"weaknessType": "분수", "count": 2}
      ]
    }
  ],
  "count": 1
}
```

## 🎨 UI/UX 개선사항

### 출석 인증 페이지 (`/attendance-verify`)
- **다중 촬영 지원**
  - "N번째 촬영" 버튼 라벨 동적 변경
  - "총 N장 촬영됨" 상태 표시
  - 촬영 후 카메라 계속 유지 (연속 촬영)

- **이미지 미리보기**
  - 2열 그리드 레이아웃
  - 각 이미지에 순서 번호 표시
  - 삭제 버튼 (휴지통 아이콘)
  - 스크롤 가능한 영역 (최대 높이 500px)

- **제출 버튼**
  - "숙제 제출 및 채점받기 (N장)" 라벨
  - 채점 중 로딩 애니메이션
  - "AI 채점 중... (N장)" 상태 표시

### 보고서 페이지 (`/dashboard/reports/student`)
- **목록 화면**
  - 카드형 레이아웃 (3열 그리드)
  - 학생 이름, 평균 점수, 생성일시
  - 자주 틀리는 유형 태그 (최대 3개)
  - 호버 시 그림자 효과

- **상세 화면**
  - 평균 점수 대형 표시
  - 종합 분석 (AI 생성)
  - 잘하는 부분 (초록색 카드)
  - 보완 필요 부분 (노란색 카드)
  - 지도 방안 (보라색 카드)
  - 자주 틀리는 유형 (빨간색 카드)

## 🔄 처리 흐름

```
1. 학생 출석 코드 입력
   └─> 출석 인증 API 호출
   └─> 출석 기록 생성 ✅

2. 숙제 사진 촬영
   └─> 카메라 시작
   └─> 1번째 촬영 → capturedImages[0]
   └─> 2번째 촬영 → capturedImages[1]
   └─> 3번째 촬영 → capturedImages[2]
   └─> 미리보기 표시 ✅

3. 숙제 제출
   └─> POST /api/homework/grade
   └─> Gemini AI 호출
   ├─> 각 이미지 분석
   ├─> 문제 인식 (OCR)
   ├─> 답안 인식
   └─> 정답/오답 판별 ✅

4. 채점 결과 저장
   └─> homework_submissions_v2 INSERT
   └─> homework_gradings_v2 INSERT
   └─> problemAnalysis, weaknessTypes 저장 ✅

5. 약점 분석 업데이트
   └─> student_weakness_analysis 조회
   ├─> 기존 약점: count += 1
   └─> 신규 약점: INSERT ✅

6. 제출 횟수 확인
   └─> SELECT COUNT(*) FROM homework_submissions_v2
   └─> count % 3 === 0 ?
       ├─> YES: generateStudentReport() 호출 ✅
       └─> NO: 통과

7. 보고서 생성 (3번째 제출)
   └─> 최근 3회 채점 결과 조회
   └─> 약점 데이터 조회
   └─> Gemini AI 종합 분석 요청
   └─> student_reports INSERT ✅

8. 학원장/선생님 확인
   └─> GET /api/reports/student?academyId=1
   └─> 보고서 목록 렌더링
   └─> 특정 보고서 클릭
   └─> 상세 분석 표시 ✅
```

## 🧪 테스트 시나리오

### 시나리오 1: 첫 번째 제출
```
1. 학생 로그인 (출석 코드: 123456)
2. 숙제 사진 3장 촬영
   - 1페이지: 덧셈 문제 5개
   - 2페이지: 뺄셈 문제 5개
   - 3페이지: 곱셈 문제 5개
3. 제출 버튼 클릭
4. AI 채점 진행 (약 10초)
5. 결과:
   - 점수: 80점 (12/15 정답)
   - 틀린 유형: 덧셈 2개, 곱셈 1개
6. 약점 데이터 업데이트:
   - 덧셈: count = 1 → 2
   - 곱셈: count = 0 → 1
7. 보고서 생성: X (1/3)
```

### 시나리오 2: 세 번째 제출 (보고서 생성)
```
1. 학생이 세 번째 숙제 제출
2. AI 채점 완료
3. 제출 횟수 확인: 3번 → 보고서 트리거!
4. 보고서 생성 프로세스:
   - 최근 3회 채점 결과 조회
     - 1회: 80점
     - 2회: 75점
     - 3회: 85점
   - 평균 점수: 80점
   - 약점 데이터:
     - 덧셈: 5회
     - 곱셈: 3회
     - 분수: 2회
   - Gemini AI 분석 요청
   - 보고서 저장 완료
5. 응답에 reportGenerated: true 포함
6. 학원장/선생님에게 알림 (추후 구현)
```

### 시나리오 3: 보고서 조회
```
1. 학원장 로그인
2. /dashboard/reports/student 접속
3. 학원 전체 보고서 목록 표시
   - 홍길동: 평균 80점 (약점: 덧셈, 곱셈)
   - 김철수: 평균 90점 (약점: 분수)
   - 이영희: 평균 75점 (약점: 도형, 뺄셈)
4. "홍길동" 카드 클릭
5. 상세 보고서 표시:
   - 종합 분석: "계산 속도는 빠르나 실수가 많음"
   - 강점: "논리적 사고력이 우수함"
   - 약점: "덧셈 연산에서 실수 빈번"
   - 지도 방안:
     1. 덧셈 기초 다시 점검
     2. 문제 풀이 후 검산 습관화
     3. 매일 10분 연산 연습
```

## 🚀 향후 개선 사항

### 1. 실시간 알림
- [ ] 보고서 생성 시 학원장/선생님에게 푸시 알림
- [ ] 이메일 자동 발송
- [ ] 카카오톡 알림톡 연동

### 2. 상세 분석
- [ ] 문제별 소요 시간 측정
- [ ] 학습 패턴 분석 (시간대별, 요일별)
- [ ] 성적 추이 그래프
- [ ] 학급 평균 대비 비교

### 3. 개인화 추천
- [ ] 학생별 맞춤 문제 추천
- [ ] 약점 보완 학습 자료 제공
- [ ] 유사 문제 자동 생성

### 4. 협업 기능
- [ ] 선생님 간 학생 정보 공유
- [ ] 학부모 포털 (자녀 성적 확인)
- [ ] 댓글 및 피드백 시스템

### 5. 분석 고도화
- [ ] 더 세분화된 문제 유형 분류
- [ ] 오답 노트 자동 생성
- [ ] AI 튜터링 기능

## 📞 지원

### 문제 해결
- 이미지가 너무 큰 경우: 자동으로 리사이징됨 (최대 2MB)
- Gemini API 오류: 기본 점수(80점) 자동 부여
- 데이터베이스 오류: 로그 확인 후 재시도

### 문의
- 개발자: GenSpark AI Developer
- 이메일: support@superplace.com
- GitHub Issues: https://github.com/kohsunwoo12345-cmyk/superplace/issues

## 📄 라이선스
Copyright © 2025-2026 SUPER PLACE. All rights reserved.

---

**버전**: 1.0.0  
**최종 업데이트**: 2026년 2월 8일  
**PR**: https://github.com/kohsunwoo12345-cmyk/superplace/pull/7
