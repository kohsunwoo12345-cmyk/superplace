# 구독 플랜 사용량 카운팅 수정 - 테스트 가이드

## 🧪 테스트 시나리오

### 1. 학생 수 카운트 정확성 테스트

#### 준비
1. 학원장 계정으로 로그인
2. 학생 10명 등록
3. 학생 3명 퇴원 처리 (학생 상세 페이지 → 퇴원 처리)

#### 실행
1. `/dashboard/settings` 페이지 접속
2. "현재 플랜" 카드에서 "학생" 항목 확인

#### 예상 결과
- **이전**: 10명 표시 (퇴원 학생 포함)
- **이후**: 7명 표시 (활성 학생만)

✅ **통과 조건**: 퇴원하지 않은 학생 수만 카운트됨

---

### 2. 숙제 검사 카운트 정확성 테스트

#### 준비
1. 학생 5명이 숙제 제출
2. 3명의 숙제만 AI 채점 완료
3. 2명의 숙제는 미채점 상태

#### 실행
1. `/dashboard/settings` 페이지 접속
2. "현재 플랜" 카드에서 "숙제 검사" 항목 확인

#### 예상 결과
- **이전**: 0 또는 부정확한 숫자
- **이후**: 3 표시 (실제 채점된 숙제 수)

✅ **통과 조건**: `homework_gradings` 테이블의 실제 레코드 수와 일치

---

### 3. AI 분석 카운트 정확성 테스트

#### 준비
1. 학생 역량 분석 페이지에서 AI 분석 5회 실행
2. `usage_logs` 테이블에 `type='ai_analysis'` 레코드 생성 확인

#### 실행
1. `/dashboard/settings` 페이지 접속
2. "현재 플랜" 카드에서 "AI 분석" 항목 확인

#### 예상 결과
- **이전**: 0 또는 부정확한 숫자
- **이후**: 5 표시 (실제 분석 실행 수)

✅ **통과 조건**: `usage_logs` 테이블의 `type='ai_analysis'` 레코드 수와 일치

---

### 4. 유사문제 카운트 정확성 테스트

#### 준비
1. AI 봇 채팅에서 유사문제 출제 3회 요청
2. `usage_logs` 테이블에 `type='similar_problem'` 레코드 생성 확인

#### 실행
1. `/dashboard/settings` 페이지 접속
2. "현재 플랜" 카드에서 "유사문제" 항목 확인

#### 예상 결과
- **이전**: 0 또는 부정확한 숫자
- **이후**: 3 표시 (실제 출제 수)

✅ **통과 조건**: `usage_logs` 테이블의 `type='similar_problem'` 레코드 수와 일치

---

### 5. 랜딩페이지 카운트 정확성 테스트

#### 준비
1. `/dashboard/admin/landing-pages/create`에서 랜딩페이지 4개 생성
2. 1개 삭제

#### 실행
1. `/dashboard/settings` 페이지 접속
2. "현재 플랜" 카드에서 "랜딩페이지" 항목 확인

#### 예상 결과
- **이전**: 4 표시 (삭제된 것 포함)
- **이후**: 3 표시 (현재 존재하는 페이지만)

✅ **통과 조건**: `landing_pages` 테이블의 실제 레코드 수와 일치

---

## 📊 SQL 직접 확인 (개발자용)

### 1. 활성 학생 수 확인
```sql
SELECT COUNT(*) as active_students
FROM User 
WHERE academyId = 'YOUR_ACADEMY_ID' 
  AND role = 'STUDENT' 
  AND withdrawnAt IS NULL;
```

### 2. 숙제 검사 수 확인
```sql
SELECT COUNT(*) as homework_checks
FROM homework_gradings hg
JOIN homework_submissions hs ON hg.submissionId = hs.id
WHERE hs.academyId = 'YOUR_ACADEMY_ID';
```

### 3. AI 분석 수 확인
```sql
SELECT COUNT(*) as ai_analysis_count
FROM usage_logs ul
JOIN User u ON ul.userId = u.id
WHERE u.academyId = 'YOUR_ACADEMY_ID' 
  AND ul.type = 'ai_analysis';
```

### 4. 유사문제 출제 수 확인
```sql
SELECT COUNT(*) as similar_problems_count
FROM usage_logs ul
JOIN User u ON ul.userId = u.id
WHERE u.academyId = 'YOUR_ACADEMY_ID' 
  AND ul.type = 'similar_problem';
```

### 5. 랜딩페이지 수 확인
```sql
SELECT COUNT(*) as landing_pages_count
FROM landing_pages
WHERE academyId = 'YOUR_ACADEMY_ID';
```

---

## 🔍 API 직접 테스트

### API 엔드포인트
```
GET /api/subscription/check?academyId=YOUR_ACADEMY_ID
```

### 테스트 방법
```bash
curl "https://superplacestudy.pages.dev/api/subscription/check?academyId=YOUR_ACADEMY_ID"
```

### 예상 응답
```json
{
  "success": true,
  "hasSubscription": true,
  "subscription": {
    "usage": {
      "students": 7,           // ✅ 활성 학생만
      "homeworkChecks": 3,     // ✅ 실제 채점 수
      "aiAnalysis": 5,         // ✅ 실제 분석 수
      "similarProblems": 3,    // ✅ 실제 출제 수
      "landingPages": 3        // ✅ 실제 페이지 수
    },
    "limits": {
      "maxStudents": 50,
      "maxHomeworkChecks": 500,
      "maxAIAnalysis": 100,
      "maxSimilarProblems": 50,
      "maxLandingPages": 20
    }
  }
}
```

---

## 🐛 디버깅

### 콘솔 로그 확인
API를 호출하면 서버 로그에 다음과 같은 메시지가 출력됩니다:

```
📊 실제 사용량 카운트 (academyId: academy-123)
  - 활성 학생 수: 7
  - 숙제 검사: 3
  - AI 분석: 5
  - 유사문제: 3
  - 랜딩페이지: 3
```

### 브라우저 개발자 도구
1. F12 → Network 탭 열기
2. `/api/subscription/check` 요청 찾기
3. Response 탭에서 JSON 확인

---

## ⚠️ 주의사항

1. **캐싱**: 브라우저 캐시로 인해 이전 데이터가 보일 수 있음 → 하드 리프레시 (Ctrl+Shift+R)
2. **DB 동기화**: 데이터 변경 후 즉시 반영됨 (캐싱 없음)
3. **성능**: 학원당 10,000개 이상 데이터 시 응답 시간 증가 가능

---

## ✅ 테스트 체크리스트

- [ ] 학생 수: 퇴원 학생 제외 확인
- [ ] 숙제 검사: 실제 채점 수 일치
- [ ] AI 분석: 실제 분석 수 일치
- [ ] 유사문제: 실제 출제 수 일치
- [ ] 랜딩페이지: 실제 페이지 수 일치
- [ ] 진행률 바: 정확한 퍼센티지 표시
- [ ] 한도 초과 시 경고 메시지 표시
- [ ] 브라우저 콘솔 에러 없음
- [ ] API 응답 시간 200ms 이하

---

**작성일**: 2026-03-03  
**테스트 대상**: `/api/subscription/check` API  
**영향 페이지**: `/dashboard/settings`
