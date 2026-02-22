# 🔍 클래스가 표시되지 않는 문제 - 최종 진단 가이드

## 현재 상황
- 클래스 추가는 가능하지만 목록에 표시되지 않음
- "클래스가 없습니다" 메시지만 표시

## ✅ 완료된 수정사항
1. ✅ Merge conflict 제거
2. ✅ TypeScript 문법 오류 수정
3. ✅ 새로운 API (`create-new.ts`) 배포 완료
4. ✅ 디버그 정보 추가 (커밋 a811911)

---

## 📋 사용자가 확인할 사항

### 1단계: 브라우저 캐시 클리어
```
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### 2단계: 사이트 접속
```
https://superplacestudy.pages.dev/dashboard/classes
```

### 3단계: 개발자 도구 열기
```
F12 키 누르기
또는 우클릭 → 검사
```

### 4단계: Console 탭에서 확인
다음 메시지들을 찾아서 스크린샷:
- `📚 클래스 목록 로드 중...`
- `👤 Current user:`
- `✅ 클래스 데이터:`
- `📊 클래스 개수:`

### 5단계: 디버그 정보 확인
페이지 하단에 "🔍 디버그 정보 보기" 클릭

---

## 🎯 예상되는 문제 시나리오

### A. 사용자 academyId가 NULL
**증상**:
```json
{
  "id": "user-123",
  "email": "director@example.com",
  "academyId": null  // ← 문제!
}
```

**해결**:
1. 회원가입 시 academy 배정 필요
2. 또는 기존 사용자 데이터 수정

### B. academyId 타입 불일치
**증상**:
```
생성한 클래스: academy_id = "academy-abc-123" (문자열)
사용자: academyId = 1 (숫자)
→ 불일치!
```

**해결**:
- 둘 다 문자열 또는 둘 다 숫자로 통일

### C. 클래스가 실제로 생성 안됨
**증상**:
- Console에 "✅ 클래스 데이터: { classes: [], count: 0 }"

**확인**:
1. `/dashboard/classes/add` 에서 클래스 추가
2. "반이 생성되었습니다!" 알림 확인
3. Console에 "✅ Class created: { classId: 123 }" 확인

---

## 🔧 즉시 테스트 방법

### 방법 1: 직접 클래스 추가
1. https://superplacestudy.pages.dev/dashboard/classes/add
2. 반 이름: "테스트반"
3. 학년: "3학년" (선택)
4. "반 생성" 버튼 클릭
5. 성공 메시지 확인
6. `/dashboard/classes` 로 이동하여 확인

### 방법 2: API 직접 호출 (고급)
```javascript
// F12 → Console에서 실행
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

// 클래스 생성
fetch('/api/classes/create-new', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    academyId: user.academyId || user.academy_id || 'test-academy',
    name: '디버그 테스트 반',
    grade: '1학년'
  })
}).then(r => r.json()).then(console.log);

// 2초 후 클래스 조회
setTimeout(() => {
  fetch('/api/classes', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }).then(r => r.json()).then(console.log);
}, 2000);
```

---

## 📸 필요한 스크린샷

다음 정보를 캡처해서 공유:

### 1. Console 로그
```
F12 → Console 탭
```
- `👤 Current user:` 의 전체 객체
- `✅ 클래스 데이터:` 의 전체 응답
- 에러 메시지 (있다면)

### 2. 디버그 정보 UI
```
페이지 하단 "🔍 디버그 정보 보기" 클릭 후 스크린샷
```

### 3. Network 탭
```
F12 → Network 탭
```
- `/api/classes` 요청 클릭
- Response 탭 스크린샷

---

## 💡 즉시 해결 방법 (임시)

### 만약 academyId가 NULL이라면:

**방법 1: localStorage 직접 수정**
```javascript
// F12 → Console
const user = JSON.parse(localStorage.getItem('user'));
user.academyId = 'academy-' + Date.now(); // 임시 academy ID
localStorage.setItem('user', JSON.stringify(user));
location.reload();
```

**방법 2: 새로 로그인**
- 로그아웃 → 로그인
- 회원가입 시 academy 선택했는지 확인

---

## 🚀 배포 상태

- **최신 커밋**: a811911
- **배포 시간**: 2-3분
- **URL**: https://superplacestudy.pages.dev
- **디버그 코드**: ✅ 포함됨

---

## 📝 체크리스트

배포 완료 후 (2-3분):

- [ ] 브라우저 캐시 클리어 (`Ctrl + Shift + R`)
- [ ] https://superplacestudy.pages.dev/dashboard/classes 접속
- [ ] F12 → Console 탭 열기
- [ ] "👤 Current user" 로그 확인
- [ ] "🔍 디버그 정보 보기" 클릭
- [ ] 사용자 객체에 academyId 있는지 확인
- [ ] `/dashboard/classes/add` 에서 새 반 추가
- [ ] 성공 메시지 확인
- [ ] 목록에 표시되는지 확인

---

## 🎯 최종 목표

**클래스 추가 → 즉시 목록에 표시**

이제 디버그 정보로 정확한 원인을 파악할 수 있습니다.

배포 완료 후 (2-3분) 위의 체크리스트를 따라 테스트하고,
Console 로그와 디버그 정보를 스크린샷으로 공유해주세요!
