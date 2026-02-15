# 학생 추가 및 상세 정보 확인 테스트 가이드

## 배포 정보
- URL: https://superplacestudy.pages.dev
- 배포 시간: 2026-02-15 02:48:15 GMT
- 커밋: 0378298

## 테스트 절차

### 1단계: 브라우저 캐시 완전 삭제
```
Chrome/Edge:
1. Ctrl+Shift+Delete (Windows) / Cmd+Shift+Delete (Mac)
2. "캐시된 이미지 및 파일" 선택
3. "데이터 삭제" 클릭
4. 또는 시크릿 모드 사용 (Ctrl+Shift+N)
```

### 2단계: 학원장 계정으로 로그인
```
1. https://superplacestudy.pages.dev/login
2. 학원장 계정으로 로그인
3. F12 개발자 도구 열기 (Console 탭)
```

### 3단계: 학생 추가
```
1. 학생 관리 메뉴 클릭
2. "학생 추가" 버튼 클릭
3. 다음 정보 정확히 입력:

   이름: 홍길동테스트
   연락처: 010-1111-2222
   학교: 서울고등학교
   학년: 고2 (드롭다운에서 선택)
   이메일: hong@test.com
   비밀번호: test1234
   진단 메모: 수학 기초 보강

4. "학생 추가" 버튼 클릭
5. Console 로그 확인 및 복사
```

### 4단계: Console 로그 확인
```
다음 로그를 확인하고 복사:

✅ 성공 시:
📤 학생 추가 요청: {name: "홍길동테스트", phone: "010-1111-2222", ...}
📋 Checking students table structure...
✅ Students table exists
📋 Has diagnostic_memo column: true (또는 false → true로 변경)
✅ Student record created
📥 응답 상태: 200
✅ 학생 추가 성공: {success: true, studentId: XXX}

❌ 실패 시:
에러 메시지 전체 복사
```

### 5단계: 추가된 학생 ID 확인
```
Console에서 studentId 확인:
✅ 학생 추가 성공: {success: true, studentId: 158}
                                            ^^^ 이 번호 기억
```

### 6단계: 학생 목록에서 확인
```
1. 학생 관리 페이지로 돌아감
2. "홍길동테스트" 찾기
3. 클릭하여 상세 페이지로 이동
4. URL 확인: /dashboard/students/detail/?id=158
```

### 7단계: 상세 페이지에서 확인
```
개인 정보 탭에서 다음 항목 확인:

□ 이름: 홍길동테스트
□ 전화번호: 010-1111-2222 (하이픈 형식)
□ 이메일: hong@test.com (실제 이메일)
□ 소속 학교: 서울고등학교
□ 학년: 고2
□ 소속 학원: (학원명 또는 미등록)
□ 소속 반: 미등록
□ 가입일: (오늘 날짜)
□ 진단 메모: 수학 기초 보강 (파란 박스)
```

### 8단계: API 직접 확인
```
F12 Console에서 다음 실행:

fetch('/api/admin/users/158', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(d => console.log('API Response:', d))

결과 확인:
{
  "user": {
    "id": 158,
    "name": "홍길동테스트",
    "phone": "010-1111-2222",
    "email": "hong@test.com",
    "school": "서울고등학교",
    "grade": "고2",
    "diagnostic_memo": "수학 기초 보강",
    ...
  }
}
```

## 문제 발생 시 체크리스트

### A. "학생 추가 실패" 알림이 나타나는 경우
```
1. F12 Console에서 정확한 에러 메시지 확인
2. 다음 정보 복사:
   - 빨간색 에러 메시지 전체
   - Request body
   - Response 내용
```

### B. 학생 추가는 성공했는데 상세 페이지에서 "미등록"만 나오는 경우
```
1. F12 Console에서 다음 실행:
   
   fetch('/api/admin/users/[학생ID]', {
     headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')}
   })
   .then(r => r.json())
   .then(d => {
     console.log('=== API 응답 분석 ===');
     console.log('phone:', d.user.phone);
     console.log('email:', d.user.email);
     console.log('school:', d.user.school);
     console.log('grade:', d.user.grade);
     console.log('academyName:', d.user.academyName);
     console.log('diagnostic_memo:', d.user.diagnostic_memo);
   })

2. 결과를 복사하여 공유
```

### C. 전화번호가 이름으로 나오는 경우
```
이것은 React 컴포넌트 렌더링 순서 문제일 수 있음:
1. 페이지 새로고침 (F5)
2. 여전히 문제가 있으면 시크릿 모드에서 재시도
```

## 기대 결과

모든 필드가 입력한 값 그대로 표시되어야 함:
- ✅ 전화번호: 010-1111-2222 (하이픈 자동 추가)
- ✅ 이메일: hong@test.com (실제 입력값)
- ✅ 학교: 서울고등학교
- ✅ 학년: 고2
- ✅ 진단 메모: 수학 기초 보강

## 문제 보고 시 필요한 정보

다음을 모두 복사하여 제공:
1. Console 로그 전체
2. Network 탭의 /api/students/create 요청/응답
3. Network 탭의 /api/admin/users/[id] 요청/응답
4. 스크린샷 (상세 페이지)
