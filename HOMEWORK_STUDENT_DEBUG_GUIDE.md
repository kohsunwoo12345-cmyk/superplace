# 숙제 학생 선택 문제 최종 해결 가이드

## 🐛 문제 현상
- 숙제 내주기 페이지에서 "특정 학생" 선택 시
- "학생이 없습니다 (총 0명)" 메시지 표시
- 학생 목록이 비어있음

## 🔍 진단 기능 추가

### 1. 디버그 정보 패널
특정 학생 선택 시 파란색 박스에 다음 정보 표시:
```
🔍 디버그 정보:
• 학생 수: X명
• API 호출 완료: ✅/❌
• 첫 번째 학생: 홍길동/없음
```

### 2. 에러 알림
- API 호출 실패 시 alert 팝업
- HTTP 에러 코드 및 메시지 표시
- 네트워크 오류 상세 정보

### 3. 새로고침 버튼
- 학생이 0명일 때 "🔄 새로고침" 버튼 표시
- 클릭 시 `/api/students` 재호출
- 콘솔에 재조회 로그 출력

### 4. 콘솔 로그 강화
```javascript
📡 학생 조회 요청 시작
   Token: 존재함
   AcademyId: 123
📡 학생 조회 응답 상태: 200
📦 학생 조회 응답 데이터: {
  success: true,
  count: 5,
  firstStudent: { id: 1, name: "홍길동" },
  allStudents: [...]
}
✅ 5명 학생 로드됨 (전체: 5)
```

## 📋 문제 진단 절차

### 배포 완료 후 (5분 후) 수행:

#### Step 1: 페이지 접속
```
https://superplace-academy.pages.dev/dashboard/homework/teacher
```

#### Step 2: 숙제 생성 폼 열기
1. "새 숙제 내기" 버튼 클릭
2. "대상 학생" → "특정 학생" 선택

#### Step 3: 디버그 정보 확인
파란색 디버그 박스에서:
- **학생 수**: X명
- **API 호출 완료**: ✅/❌
- **첫 번째 학생**: 이름 또는 "없음"

#### Step 4: 브라우저 콘솔 확인
F12 → Console 탭:
```
📡 학생 조회 응답 데이터: { ... }
```

## 🎯 시나리오별 해결책

### 시나리오 A: 학생 수 0명 + API 호출 완료 ✅
**원인**: 데이터베이스에 학생이 없음

**해결책**:
1. 학생 관리 페이지로 이동
2. 학생 추가
3. 숙제 페이지로 돌아와서 "🔄 새로고침" 클릭

### 시나리오 B: Alert 팝업 "학생 조회 실패: 401"
**원인**: 인증 토큰 만료 또는 없음

**해결책**:
1. 로그아웃
2. 다시 로그인
3. 숙제 페이지 재접속

### 시나리오 C: Alert 팝업 "학생 조회 실패: 403"
**원인**: 권한 없음 (학생 계정으로 접속)

**해결책**:
1. 선생님 또는 학원장 계정으로 로그인
2. 숙제 페이지 재접속

### 시나리오 D: 콘솔에 "❌ 학생 조회 HTTP 에러: 500"
**원인**: 서버 오류

**해결책**:
1. Cloudflare Pages 로그 확인
2. `/api/students` API 직접 호출:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://superplace-academy.pages.dev/api/students
```

### 시나리오 E: 학생은 있지만 목록에 안 보임
**원인**: 프론트엔드 필터링 문제

**해결책**:
1. 콘솔에서 `data.students` 확인
2. `status` 필드 확인 (ACTIVE여야 함)
3. 학생의 `status`를 'ACTIVE'로 변경

## 🧪 수동 테스트 방법

### 1. API 직접 호출
```bash
# 터미널에서
TOKEN="your-token-here"
curl -H "Authorization: Bearer $TOKEN" \
  https://superplace-academy.pages.dev/api/students | jq '.'
```

**예상 응답**:
```json
{
  "success": true,
  "students": [
    {
      "id": "student-123",
      "name": "홍길동",
      "email": "hong@example.com",
      "role": "STUDENT",
      "academyId": "academy-1",
      "status": "ACTIVE"
    }
  ]
}
```

### 2. 브라우저 Network 탭
1. F12 → Network 탭
2. "특정 학생" 선택
3. `/api/students` 요청 찾기
4. Response 탭에서 응답 확인

### 3. localStorage 확인
```javascript
// 브라우저 콘솔에서
const user = JSON.parse(localStorage.getItem('user'));
console.log('User:', user);
console.log('AcademyId:', user.academyId);
console.log('Token:', localStorage.getItem('token'));
```

## 📊 배포 정보

### 커밋
- **해시**: `464ca0b1`
- **메시지**: "fix: 숙제 학생 선택 디버깅 강화"

### 변경 사항
1. `fetchStudents` 함수에 에러 처리 강화
2. HTTP 에러 시 alert 표시
3. 디버그 정보 패널 추가
4. 새로고침 버튼 추가
5. 콘솔 로그 상세화

### 배포 URL
- **프로덕션**: https://superplace-academy.pages.dev
- **완료 예상**: 2026-03-07 13:40 UTC (5분 후)

## ✅ 테스트 체크리스트

### 배포 후 즉시:
- [ ] 숙제 페이지 접속
- [ ] "새 숙제 내기" 클릭
- [ ] "특정 학생" 선택
- [ ] 디버그 정보 확인:
  - [ ] 학생 수
  - [ ] API 호출 완료 여부
  - [ ] 첫 번째 학생 이름
- [ ] 브라우저 콘솔 확인:
  - [ ] `📡 학생 조회 응답 데이터` 로그
  - [ ] 학생 배열 내용
- [ ] 학생이 0명이면:
  - [ ] "🔄 새로고침" 버튼 클릭
  - [ ] 학생 추가 후 재시도
- [ ] 학생이 있으면:
  - [ ] 체크박스 선택
  - [ ] "✅ N명 선택됨" 표시 확인
  - [ ] 선택된 학생 이름 표시 확인

### 학생 있는 경우:
- [ ] 체크박스 선택
- [ ] 하단에 "✅ 2명 선택됨 (홍길동, 김철수)" 표시
- [ ] "숙제 내기" 버튼 클릭
- [ ] 성공 메시지 확인
- [ ] 학생 계정으로 로그인
- [ ] "나의 숙제"에 표시 확인

## 🔧 추가 디버깅 (문제 지속 시)

### 1. Token 확인
```javascript
// 브라우저 콘솔
const token = localStorage.getItem('token');
console.log('Token exists:', !!token);
console.log('Token format:', token?.split('|').length === 3 ? 'Valid' : 'Invalid');
```

### 2. User 정보 확인
```javascript
// 브라우저 콘솔
const user = JSON.parse(localStorage.getItem('user'));
console.log('User role:', user.role);
console.log('Academy ID:', user.academyId);
console.log('User ID:', user.id);
```

### 3. API 수동 호출
```javascript
// 브라우저 콘솔
const token = localStorage.getItem('token');
fetch('/api/students', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(d => console.log('Students:', d));
```

## 💡 예상 결과

### 정상 동작 시:
```
✅ 학생 선택 (총 5명)
🔍 디버그 정보:
• 학생 수: 5명
• API 호출 완료: ✅
• 첫 번째 학생: 홍길동

[학생 목록]
☐ 홍길동 (hong@example.com)
☐ 김철수 (kim@example.com)
...

✅ 2명 선택됨
홍길동, 김철수
```

### 문제 발생 시:
```
❌ 학생 선택 (총 0명)
🔍 디버그 정보:
• 학생 수: 0명
• API 호출 완료: ✅
• 첫 번째 학생: 없음

[빈 상태]
학생이 없습니다
학생을 먼저 등록해주세요
[🔄 새로고침]
```

---

**작성 시각**: 2026-03-07 13:35 UTC
**다음 단계**: 배포 완료 후 디버그 정보 확인 → 결과 보고

배포 완료 후 디버그 정보를 확인하고 정확한 문제 원인을 알려주세요!
