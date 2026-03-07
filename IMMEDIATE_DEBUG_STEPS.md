# 즉시 디버깅 단계

## 1. 배포 대기 (3-5분)
커밋: 7b52aacc
URL: https://superplace-academy.pages.dev

## 2. 테스트 페이지 접속

### A. 학생 수 확인 API
```
https://superplace-academy.pages.dev/api/debug/count-students
```

**확인 사항:**
- 총 User 수
- STUDENT 역할 수
- 학원별 학생 수
- 샘플 학생 데이터

### B. 학생 테스트 페이지
```
https://superplace-academy.pages.dev/test/students
```

**확인 사항:**
- 로그인 후 토큰으로 실제 API 호출
- 응답 데이터 전체 표시
- 학생 목록 표시

## 3. 예상 결과

### 정상인 경우:
- count-students: { totalUsers: 50, totalStudents: 30, ... }
- test page: 학생 목록 30명 표시

### 문제가 있는 경우:
- count-students: { totalStudents: 0, ... }
- test page: 빈 배열 []

## 4. 문제 원인별 해결

### Case 1: DB에 학생이 없음
→ 샘플 학생 데이터 생성 필요

### Case 2: academyId 필터 문제
→ academyId 제거 또는 수정

### Case 3: 권한/토큰 문제  
→ API 인증 로직 수정

## 5. 즉시 실행

5분 후:
1. 브라우저에서 count-students API 호출
2. 결과를 복사해서 보고
3. 그 결과에 따라 즉시 수정
