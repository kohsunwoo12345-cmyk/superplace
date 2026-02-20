# 수업 추가 페이지 수정 완료 가이드

## 🎯 수정 사항

### 1. "학원 정보가 없습니다" 오류 해결
**문제**: 사용자가 `academyId`가 없으면 수업을 생성할 수 없었음

**해결**:
- `user.academyId`, `user.academy_id`, `user.id` 순서로 fallback 체크
- 학원장인 경우 본인 ID를 academy ID로 사용
- 명확한 에러 로그 및 사용자 데이터 출력

```typescript
const effectiveAcademyId = user?.academyId || user?.academy_id || user?.id;

if (!effectiveAcademyId) {
  console.error('❌ No academy ID found. User data:', user);
  alert("학원 정보가 없습니다. 사용자 정보를 확인해주세요.");
  return;
}
```

### 2. 학년 선택사항으로 명확히 표시
**변경사항**:
- Label: "학년" → "학년 (선택사항)"
- Placeholder: "학년을 선택하세요" → "학년을 선택하세요 (선택사항)"
- API에서 빈 문자열도 `null`로 처리하도록 개선

**프론트엔드**:
```typescript
grade: grade && grade.trim() ? grade.trim() : null,
```

**백엔드 API**:
```typescript
(grade && grade.trim()) ? grade.trim() : null,  // 빈 문자열도 null로 처리
```

## 🧪 테스트 방법

### 브라우저 콘솔에서 사용자 정보 확인
```javascript
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('👤 Current user:', user);
console.log('🏫 Academy ID:', user.academyId || user.academy_id || user.id);
console.log('👨‍💼 Role:', user.role);
```

**기대 결과**:
- `academy_id` 또는 `academyId` 또는 `id`가 있어야 함
- Role이 DIRECTOR, TEACHER, ADMIN 등으로 표시

### 수업 추가 테스트 (학년 선택 안함)

1. **페이지 접속**
   ```
   https://superplacestudy.pages.dev/dashboard/classes/add/
   ```

2. **필수 정보만 입력**
   - 반 이름: "테스트반"
   - 학년: **선택하지 않음** ✅
   - 과목: 입력 (선택사항)

3. **수업 스케줄 추가**
   - 요일 선택: 월, 수, 금
   - 시간 입력: 09:00 ~ 10:00

4. **학생 배정 (선택사항)**
   - 학생 선택하거나 비워둠

5. **"반 생성" 버튼 클릭**
   - ✅ "반이 생성되었습니다!" 알림
   - ✅ `/dashboard/classes`로 리디렉션

### API 직접 테스트

```javascript
// 1. 토큰 확인
const user = JSON.parse(localStorage.getItem('user') || '{}');
const academyId = user.academyId || user.academy_id || user.id;
console.log('🏫 Using academy ID:', academyId);

// 2. 수업 생성 (학년 없이)
fetch('/api/classes/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    academyId: academyId,
    name: '학년 없는 테스트반',
    grade: null,  // 또는 '', 또는 생략
    subject: '수학',
    description: '학년 선택 안 함 테스트',
    teacherId: user.id,
    color: '#3B82F6',
    schedules: [
      {
        dayOfWeek: [1, 3, 5],
        startTime: '14:00',
        endTime: '16:00'
      }
    ],
    studentIds: []
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Class created:', data);
  if (data.success) {
    console.log('🎉 Success! Class ID:', data.classId);
  } else {
    console.error('❌ Error:', data.error, data.message);
  }
})
.catch(err => console.error('❌ Network error:', err));
```

**기대 결과**:
```json
{
  "success": true,
  "classId": 123,
  "message": "반이 생성되었습니다"
}
```

## 🔍 문제 해결

### 여전히 "학원 정보가 없습니다" 오류가 나는 경우

#### 1단계: 사용자 정보 확인
```javascript
const user = JSON.parse(localStorage.getItem('user') || '{}');
console.log('👤 User object:', user);
console.log('📋 Keys:', Object.keys(user));
```

**확인사항**:
- `id` 필드가 있는지
- `academyId` 또는 `academy_id` 필드가 있는지
- `role` 필드가 있는지

#### 2단계: 로그인 재시도
```javascript
// localStorage 초기화 후 재로그인
localStorage.removeItem('user');
localStorage.removeItem('token');
// 로그인 페이지로 이동하여 다시 로그인
```

#### 3단계: D1 데이터베이스 확인
```sql
-- 사용자 정보 조회
SELECT id, name, email, role, academy_id, academyId 
FROM users 
WHERE email = 'your-email@example.com';

-- academy_id 필드가 없으면 추가
UPDATE users 
SET academy_id = id 
WHERE role = 'DIRECTOR';
```

### 학생 목록이 "배정 가능한 학생이 없습니다"로 나오는 경우

#### 브라우저 콘솔 확인
F12 → Console 탭에서 다음 로그 확인:
```
👥 Loading students with token authentication
✅ Students loaded: 15
📋 First few students: [{...}, {...}, {...}]
```

**로그가 없거나 에러가 나면**:
```javascript
// 학생 API 직접 호출
const user = JSON.parse(localStorage.getItem('user') || '{}');
const token = user.token || localStorage.getItem('token');

fetch('/api/students/by-academy', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Students response:', data);
  console.log('📊 Student count:', data.students?.length || 0);
})
.catch(err => console.error('❌ Error:', err));
```

## ✅ 수정 완료 체크리스트

- [x] "학원 정보가 없습니다" 오류 해결 (academy_id fallback 로직 추가)
- [x] 학년 Label에 "(선택사항)" 추가
- [x] 학년 Placeholder에 "(선택사항)" 추가
- [x] 프론트엔드에서 빈 학년을 `null`로 처리
- [x] API에서 빈 문자열 학년을 `null`로 처리
- [x] 상세한 에러 로그 추가
- [x] 테스트 가이드 작성

## 📝 변경된 파일

1. **`src/app/dashboard/classes/add/page.tsx`**
   - Line 233-248: academy ID fallback 로직 추가
   - Line 258-267: payload에서 학년 null 처리 개선
   - Line 334: Label에 "(선택사항)" 추가
   - Line 337: Placeholder에 "(선택사항)" 추가

2. **`functions/api/classes/create.ts`**
   - Line 116: 빈 문자열 학년을 null로 처리하도록 개선

## 🚀 배포 후 확인

1. **Cloudflare Pages 배포 대기** (5-10분)
   
2. **페이지 접속**
   ```
   https://superplacestudy.pages.dev/dashboard/classes/add/
   ```

3. **테스트 시나리오 실행**
   - 학년 선택 **안 하고** 수업 생성 → ✅ 성공해야 함
   - 학년 선택 **하고** 수업 생성 → ✅ 성공해야 함
   - 학생 0명으로 수업 생성 → ✅ 성공해야 함

4. **생성된 수업 확인**
   ```
   https://superplacestudy.pages.dev/dashboard/classes/
   ```
   - 방금 생성한 수업이 목록에 표시되는지 확인

## 📞 추가 지원

문제가 계속되면 다음 정보를 공유해주세요:
1. 브라우저 콘솔 로그 (F12 → Console)
2. 사용자 정보 (`localStorage.getItem('user')`)
3. API 응답 (Network 탭)
4. 에러 메시지 스크린샷

---
**작성일**: 2026-02-20  
**Repository**: https://github.com/kohsunwoo12345-cmyk/superplace  
**Live Site**: https://superplacestudy.pages.dev
